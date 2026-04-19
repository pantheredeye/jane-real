"use server";

import { z } from "zod";
import { db } from "@/db";
import { requestInfo, serverAction } from "rwsdk/worker";
import { sessions } from "@/session/store";
import { TIMEZONE_REGEX } from "../utils/timezone";

const TimezoneSchema = z
  .string()
  .min(1, "Timezone cannot be empty")
  .regex(TIMEZONE_REGEX, "Invalid IANA timezone");

export const UserPreferencesSchema = z.object({
  timezone: TimezoneSchema.nullable(),
  autoReminder: z.boolean(),
  autoReminderMinutes: z.number().int().nonnegative(),
  dailyDigest: z.boolean(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: null,
  autoReminder: true,
  autoReminderMinutes: 60,
  dailyDigest: false,
};

// Input schema for partial updates: every field optional, still validated.
const PartialPreferencesSchema = UserPreferencesSchema.partial();
export type PartialUserPreferences = z.infer<typeof PartialPreferencesSchema>;

async function requireUserId(): Promise<string> {
  const session = await sessions.load(requestInfo.request);
  if (!session?.userId) throw new Error("Not authenticated");
  return session.userId;
}

function parseStoredPreferences(raw: string | null): UserPreferences {
  if (!raw) return { ...DEFAULT_PREFERENCES };
  try {
    const parsed = JSON.parse(raw) as unknown;
    return UserPreferencesSchema.parse({
      ...DEFAULT_PREFERENCES,
      ...(parsed as object),
    });
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export const getPreferences = serverAction(async (): Promise<UserPreferences> => {
  const userId = await requireUserId();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });
  return parseStoredPreferences(user?.preferences ?? null);
});

export const updatePreferences = serverAction(
  async (partial: PartialUserPreferences): Promise<UserPreferences> => {
    const userId = await requireUserId();
    const validatedPartial = PartialPreferencesSchema.parse(partial);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const current = parseStoredPreferences(user?.preferences ?? null);
    const merged = UserPreferencesSchema.parse({ ...current, ...validatedPartial });

    await db.user.update({
      where: { id: userId },
      data: { preferences: JSON.stringify(merged) },
    });

    return merged;
  },
);

// Sets timezone only if not already set. Used during login/signup to capture
// the client-detected timezone without overwriting a user's prior choice.
export const ensureTimezone = serverAction(
  async (timezone: string): Promise<UserPreferences> => {
    const userId = await requireUserId();
    const validated = TimezoneSchema.parse(timezone);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const current = parseStoredPreferences(user?.preferences ?? null);
    if (current.timezone) return current;

    const merged = UserPreferencesSchema.parse({ ...current, timezone: validated });
    await db.user.update({
      where: { id: userId },
      data: { preferences: JSON.stringify(merged) },
    });
    return merged;
  },
);
