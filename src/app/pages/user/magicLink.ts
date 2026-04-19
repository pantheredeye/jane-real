"use server";

import { db } from "@/db";
import { Resend } from "resend";
import { env } from "cloudflare:workers";
import { requestInfo, serverAction } from "rwsdk/worker";
import { sessions } from "@/session/store";
import { getClientIp, isRateLimited } from "@/app/interruptors/rateLimit";

type WorkerEnv = Env & { RESEND_API_KEY: string; APP_URL?: string };

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const requestMagicLink = serverAction(async (email: string): Promise<{ success: boolean; error?: string }> => {
  const workerEnv = env as WorkerEnv;
  try {
    const normalized = email.trim().toLowerCase();

    const ip = getClientIp(requestInfo.request);
    if (isRateLimited(`magic:${ip}:${normalized}`, 5, 15 * 60 * 1000)) {
      return { success: false, error: "Too many sign-in requests for this email. Try again in 15 minutes." };
    }

    if (!workerEnv.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return { success: false, error: "Email service not configured. Contact support." };
    }

    const user = await db.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });

    await db.authToken.deleteMany({
      where: { email: normalized, type: "MAGIC_LINK", used: false },
    });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.authToken.create({
      data: {
        email: normalized,
        userId: user?.id ?? null,
        type: "MAGIC_LINK",
        token,
        expiresAt,
      },
    });

    const magicUrl = `${workerEnv.APP_URL || "https://routefast.app"}/user/magic?token=${token}`;
    const resend = new Resend(workerEnv.RESEND_API_KEY);

    const setupNote = user ? "" : " — we'll set up your account automatically";

    await resend.emails.send({
      from: "RouteFast <noreply@digitalglue.dev>",
      replyTo: "barrett@digitalglue.dev",
      to: email,
      subject: "Sign in to RouteFast",
      html: `
        <h2>Sign in to RouteFast</h2>
        <p>Tap this button to sign in${setupNote}:</p>
        <p><a href="${magicUrl}" style="display: inline-block; padding: 12px 24px; background-color: #d32f2f; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Sign in to RouteFast →</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${magicUrl}</p>
        <p>This link expires in 15 minutes. If you didn't request it, you can safely ignore this email.</p>
        <p>Questions or problems? Just reply to this email — it goes to barrett@digitalglue.dev.</p>
        <p>Thanks,<br>The RouteFast Team</p>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("requestMagicLink failed:", error instanceof Error ? error.message : "Unknown error");
    return { success: false, error: "Failed to send sign-in email. Please try again." };
  }
});

export type VerifyResult =
  | { success: true; isNewUser: boolean; userId: string }
  | { success: false; error: "expired" | "used" | "invalid" | "server_error" };

export async function verifyMagicLinkCore(token: string, sessionHeaders: Headers): Promise<VerifyResult> {
  try {
    const authToken = await db.authToken.findUnique({ where: { token } });
    if (!authToken || authToken.type !== "MAGIC_LINK") return { success: false, error: "invalid" };
    if (authToken.used) return { success: false, error: "used" };
    if (new Date() > authToken.expiresAt) return { success: false, error: "expired" };

    let userId = authToken.userId;
    let tenantId: string | null = null;
    let membershipId: string | null = null;
    let isNewUser = false;

    if (!userId) {
      const freeCredits = parseInt(process.env.FREE_CREDITS_AMOUNT || "15", 10);
      try {
        const user = await db.user.create({
          data: {
            email: authToken.email,
            username: authToken.email,
            creditsRemaining: freeCredits,
            totalCreditsGranted: freeCredits,
          },
        });
        const tenant = await db.tenant.create({
          data: {
            name: `${authToken.email}'s Workspace`,
            slug: `${authToken.email.split("@")[0]}-${crypto.randomUUID().slice(0, 8)}`,
            status: "ACTIVE",
          },
        });
        const membership = await db.tenantMembership.create({
          data: { userId: user.id, tenantId: tenant.id, role: "OWNER" },
        });
        userId = user.id;
        tenantId = tenant.id;
        membershipId = membership.id;
        isNewUser = true;
      } catch {
        // Concurrent click / unique-email race: fall through to existing-user path
        const existing = await db.user.findUnique({ where: { email: authToken.email } });
        if (!existing) throw new Error("server_error");
        userId = existing.id;
        const membership = await db.tenantMembership.findFirst({
          where: { userId },
          orderBy: { createdAt: "asc" },
        });
        tenantId = membership?.tenantId ?? null;
        membershipId = membership?.id ?? null;
      }
    } else {
      const membership = await db.tenantMembership.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      tenantId = membership?.tenantId ?? null;
      membershipId = membership?.id ?? null;
    }

    // Mark used only after creates/reads succeed — preserves retry-ability on downstream failure
    await db.authToken.update({ where: { id: authToken.id }, data: { used: true } });

    await sessions.save(sessionHeaders, { userId, tenantId, membershipId });

    return { success: true, isNewUser, userId };
  } catch (err) {
    console.error("verifyMagicLink failed:", err instanceof Error ? err.message : "unknown");
    return { success: false, error: "server_error" };
  }
}

export const verifyMagicLink = serverAction(async (token: string): Promise<VerifyResult> => {
  const { response } = requestInfo;
  return verifyMagicLinkCore(token, response.headers);
});
