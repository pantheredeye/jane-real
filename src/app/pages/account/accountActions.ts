"use server";

import { db } from "@/db";
import { requestInfo, serverAction } from "rwsdk/worker";
import { sessions } from "@/session/store";
import { hashPassword, validatePasswordStrength } from "@/app/pages/user/password";

export const setPassword = serverAction(async (password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const session = await sessions.load(requestInfo.request);
    if (!session?.userId) {
      return { success: false, error: "Not authenticated" };
    }

    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      return { success: false, error: validation.error || "Invalid password" };
    }

    const passwordHash = await hashPassword(password);
    await db.user.update({
      where: { id: session.userId },
      data: { passwordHash, passwordNudgeDismissedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error("setPassword failed:", error instanceof Error ? error.message : "Unknown error");
    return { success: false, error: "Could not save password. Please try again." };
  }
});

export const dismissPasswordNudge = serverAction(async (): Promise<{ success: boolean }> => {
  try {
    const session = await sessions.load(requestInfo.request);
    if (!session?.userId) return { success: false };
    await db.user.update({
      where: { id: session.userId },
      data: { passwordNudgeDismissedAt: new Date() },
    });
    return { success: true };
  } catch (error) {
    console.error("dismissPasswordNudge failed:", error instanceof Error ? error.message : "Unknown error");
    return { success: false };
  }
});
