"use server";

import { requestInfo, serverQuery } from "rwsdk/worker";
import { db } from "@/db";
import { getClientIp, isRateLimited } from "@/app/interruptors/rateLimit";

export type AuthLookupResult = {
  exists: boolean;
  hasPassword: boolean;
  hasPasskey: boolean;
  rateLimited?: boolean;
};

export const lookupAuthMethod = serverQuery(async (email: string): Promise<AuthLookupResult> => {
  const ip = getClientIp(requestInfo.request);
  if (isRateLimited(`auth-lookup:${ip}`, 20, 5 * 60 * 1000)) {
    return { exists: false, hasPassword: false, hasPasskey: false, rateLimited: true };
  }

  const normalized = email.trim().toLowerCase();
  const user = await db.user.findUnique({
    where: { email: normalized },
    select: {
      passwordHash: true,
      _count: { select: { credentials: true } },
    },
  });

  if (!user) return { exists: false, hasPassword: false, hasPasskey: false };

  return {
    exists: true,
    hasPassword: !!user.passwordHash,
    hasPasskey: user._count.credentials > 0,
  };
});
