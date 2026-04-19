// Hand-rolled Web Push: VAPID JWT (ES256) + aes128gcm body encryption.
// Pure Web Crypto API — works on Cloudflare Workers (no Node crypto).
// References: RFC 8030 (Web Push), RFC 8188 (aes128gcm), RFC 8291 (Web Push encryption), RFC 8292 (VAPID).

const encoder = new TextEncoder();

export function base64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    salt as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm as BufferSource));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    prk as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const out = new Uint8Array(length);
  let previous = new Uint8Array(0);
  let offset = 0;
  let counter = 1;
  while (offset < length) {
    const input = new Uint8Array(previous.length + info.length + 1);
    input.set(previous, 0);
    input.set(info, previous.length);
    input[previous.length + info.length] = counter;
    const chunk = new Uint8Array(await crypto.subtle.sign("HMAC", key, input as BufferSource));
    const copyLen = Math.min(chunk.length, length - offset);
    out.set(chunk.subarray(0, copyLen), offset);
    offset += copyLen;
    previous = chunk;
    counter++;
  }
  return out;
}

async function importVapidPrivateKey(pkcs8b64url: string): Promise<CryptoKey> {
  const pkcs8 = base64urlDecode(pkcs8b64url);
  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8 as BufferSource,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

export async function generateVapidJwt(
  audience: string,
  privateKeyB64url: string,
  subject: string,
  expirySeconds = 12 * 3600,
): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + expirySeconds,
    sub: subject,
  };
  const headerB64 = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const key = await importVapidPrivateKey(privateKeyB64url);
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    data as BufferSource,
  );
  return `${headerB64}.${payloadB64}.${base64urlEncode(sig)}`;
}

export interface PushKeys {
  p256dh: string; // base64url of uncompressed P-256 pubkey (0x04 || X || Y, 65 bytes)
  auth: string; // base64url of 16-byte auth secret
}

export async function encryptPush(
  payload: string | Uint8Array,
  p256dhB64url: string,
  authB64url: string,
): Promise<Uint8Array> {
  const uaPublic = base64urlDecode(p256dhB64url);
  const authSecret = base64urlDecode(authB64url);

  const eph = (await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  )) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));

  const uaPubKey = await crypto.subtle.importKey(
    "raw",
    uaPublic as BufferSource,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaPubKey }, eph.privateKey, 256),
  );

  // RFC 8291: derive IKM from auth_secret + ecdh_secret + both public keys.
  const prkKey = await hkdfExtract(authSecret, ecdhSecret);
  const keyInfo = concat(encoder.encode("WebPush: info\0"), uaPublic, asPublic);
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);

  // RFC 8188: derive CEK + NONCE from random salt.
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdfExtract(salt, ikm);
  const cek = await hkdfExpand(prk, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdfExpand(prk, encoder.encode("Content-Encoding: nonce\0"), 12);

  const payloadBytes = typeof payload === "string" ? encoder.encode(payload) : payload;
  const plaintext = concat(payloadBytes, new Uint8Array([0x02]));

  const cekKey = await crypto.subtle.importKey(
    "raw",
    cek as BufferSource,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce as BufferSource },
      cekKey,
      plaintext as BufferSource,
    ),
  );

  // aes128gcm header: salt(16) || rs(4, BE) || idlen(1) || keyid(asPublic, 65).
  const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096, false);
  header[20] = asPublic.length;
  header.set(asPublic, 21);

  return concat(header, ciphertext);
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: PushKeys;
}

export interface VapidEnv {
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
}

export interface SendPushResult {
  status: number;
  ok: boolean;
  expired: boolean;
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: string | Uint8Array,
  vapid: VapidEnv,
  options: { ttl?: number; urgency?: "very-low" | "low" | "normal" | "high" } = {},
): Promise<SendPushResult> {
  const audience = new URL(subscription.endpoint).origin;
  const jwt = await generateVapidJwt(audience, vapid.VAPID_PRIVATE_KEY, vapid.VAPID_SUBJECT);
  const body = await encryptPush(payload, subscription.keys.p256dh, subscription.keys.auth);

  const headers: Record<string, string> = {
    Authorization: `vapid t=${jwt}, k=${vapid.VAPID_PUBLIC_KEY}`,
    "Content-Type": "application/octet-stream",
    "Content-Encoding": "aes128gcm",
    "Content-Length": String(body.byteLength),
    TTL: String(options.ttl ?? 60),
  };
  if (options.urgency) headers.Urgency = options.urgency;

  const res = await fetch(subscription.endpoint, {
    method: "POST",
    headers,
    body: body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer,
  });
  return {
    status: res.status,
    ok: res.ok,
    expired: res.status === 404 || res.status === 410,
  };
}
