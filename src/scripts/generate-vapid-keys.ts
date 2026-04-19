// Standalone Node CLI — generates a P-256 VAPID keypair and prints the secrets
// to stdout along with `wrangler secret put` instructions.
// Run with: `node --experimental-strip-types src/scripts/generate-vapid-keys.ts`
// or any TS loader (tsx, ts-node). NOT run via rw-scripts (needs Node crypto).

import { generateKeyPairSync, createPublicKey } from "node:crypto";

function toBase64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });

// Public key: uncompressed raw (65 bytes: 0x04 || X || Y). Node's "raw" export on
// an EC JWK yields SPKI/DER — extract raw via JWK x/y.
const jwk = publicKey.export({ format: "jwk" });
if (!jwk.x || !jwk.y) throw new Error("JWK missing x/y");
const xBuf = Buffer.from(jwk.x, "base64url");
const yBuf = Buffer.from(jwk.y, "base64url");
if (xBuf.length !== 32 || yBuf.length !== 32) throw new Error("Unexpected P-256 coord length");
const publicRaw = Buffer.concat([Buffer.from([0x04]), xBuf, yBuf]);
const publicB64 = toBase64Url(publicRaw);

// Private key: PKCS8 DER.
const privatePkcs8 = privateKey.export({ format: "der", type: "pkcs8" }) as Buffer;
const privateB64 = toBase64Url(privatePkcs8);

// Sanity: reconstructing public from private should match.
const derived = createPublicKey(privateKey).export({ format: "jwk" });
if (derived.x !== jwk.x || derived.y !== jwk.y) throw new Error("Key mismatch");

console.log("VAPID keypair (P-256):\n");
console.log(`VAPID_PUBLIC_KEY=${publicB64}`);
console.log(`VAPID_PRIVATE_KEY=${privateB64}`);
console.log(`VAPID_SUBJECT=mailto:admin@routefast.app`);
console.log("\nSet as Worker secrets:");
console.log(`  echo "${publicB64}" | npx wrangler secret put VAPID_PUBLIC_KEY`);
console.log(`  echo "${privateB64}" | npx wrangler secret put VAPID_PRIVATE_KEY`);
console.log(`  echo "mailto:admin@routefast.app" | npx wrangler secret put VAPID_SUBJECT`);
console.log("\nFor local dev, add the same three lines to .dev.vars.");
