"use server";

import { z } from "zod";
import { env } from "cloudflare:workers";
import { db } from "@/db";
import { requestInfo, serverAction } from "rwsdk/worker";
import { sessions } from "@/session/store";
import { sendPushNotification, type PushKeys, type VapidEnv } from "../utils/vapid";

const PushKeysSchema = z.object({
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: PushKeysSchema,
});

export type PushSubscriptionInput = z.infer<typeof PushSubscriptionSchema>;

async function requireUserId(): Promise<string> {
  const session = await sessions.load(requestInfo.request);
  if (!session?.userId) throw new Error("Not authenticated");
  return session.userId;
}

function getVapidEnv(): VapidEnv | null {
  const pub = env.VAPID_PUBLIC_KEY;
  const priv = env.VAPID_PRIVATE_KEY;
  const sub = env.VAPID_SUBJECT;
  if (!pub || !priv || !sub) return null;
  return { VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: sub };
}

export const getVapidPublicKey = serverAction(async (): Promise<string | null> => {
  return env.VAPID_PUBLIC_KEY ?? null;
});

export const subscribePush = serverAction(
  async (input: unknown): Promise<{ success: true }> => {
    const userId = await requireUserId();
    const sub = PushSubscriptionSchema.parse(input);

    // One active subscription per user — no unique(userId) index, so replace.
    await db.pushSubscription.deleteMany({ where: { userId } });
    await db.pushSubscription.create({
      data: {
        userId,
        endpoint: sub.endpoint,
        keys: JSON.stringify(sub.keys),
      },
    });
    return { success: true };
  },
);

export const unsubscribePush = serverAction(async (): Promise<{ success: true }> => {
  const userId = await requireUserId();
  await db.pushSubscription.deleteMany({ where: { userId } });
  return { success: true };
});

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
}

export interface SendPushOutcome {
  sent: boolean;
  reason?: "vapid_not_configured" | "no_subscription" | "delivery_failed";
}

// Server-internal: invoked from cron/handlers, not client RPC.
export async function sendPush(userId: string, payload: PushPayload): Promise<SendPushOutcome> {
  const vapid = getVapidEnv();
  if (!vapid) return { sent: false, reason: "vapid_not_configured" };

  const subs = await db.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return { sent: false, reason: "no_subscription" };

  const body = JSON.stringify(payload);
  let sent = false;
  for (const sub of subs) {
    let keys: PushKeys;
    try {
      keys = JSON.parse(sub.keys) as PushKeys;
    } catch {
      await db.pushSubscription.delete({ where: { id: sub.id } });
      continue;
    }
    try {
      const res = await sendPushNotification(
        { endpoint: sub.endpoint, keys },
        body,
        vapid,
      );
      if (res.expired) {
        await db.pushSubscription.delete({ where: { id: sub.id } });
      } else if (res.ok) {
        sent = true;
      }
    } catch {
      // Network/crypto error for this subscription — skip, try next.
    }
  }
  return sent ? { sent: true } : { sent: false, reason: "delivery_failed" };
}
