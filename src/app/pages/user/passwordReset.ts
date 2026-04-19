"use server";

import { db } from "@/db";
import { hashPassword } from "./password";
import { Resend } from "resend";
import { env } from "cloudflare:workers";
import { requestInfo, serverAction } from "rwsdk/worker";
import { getClientIp, isRateLimited } from "@/app/interruptors/rateLimit";

type WorkerEnv = Env & { RESEND_API_KEY: string; APP_URL?: string };

function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export const requestPasswordReset = serverAction(async (email: string): Promise<{ success: boolean; error?: string }> => {
  const workerEnv = env as WorkerEnv;
  try {
    const ip = getClientIp(requestInfo.request);
    if (isRateLimited(`pw-reset:${ip}:${email.toLowerCase()}`, 5, 15 * 60 * 1000)) {
      return { success: false, error: 'Too many attempts for this email. Try again in 15 minutes.' };
    }

    if (!workerEnv.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured. Contact support.' };
    }
    const resend = new Resend(workerEnv.RESEND_API_KEY);

    const user = await db.user.findUnique({ where: { email } });

    // Don't reveal if email exists or not (security best practice)
    if (!user) {
      // Still return success to prevent email enumeration
      return { success: true };
    }

    // Delete any existing unused reset tokens for this user
    await db.authToken.deleteMany({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        used: false,
      },
    });

    // Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save token
    await db.authToken.create({
      data: {
        userId: user.id,
        email: user.email,
        type: 'PASSWORD_RESET',
        token,
        expiresAt,
      },
    });

    // Build reset URL
    const resetUrl = `${workerEnv.APP_URL || 'https://routefast.app'}/user/reset-password?token=${token}`;

    // Send email
    await resend.emails.send({
      from: 'RouteFast <noreply@digitalglue.dev>',
      replyTo: 'barrett@digitalglue.dev',
      to: email,
      subject: 'Reset Your Password - RouteFast',
      html: `
        <h2>Reset Your Password</h2>
        <p>Hi there,</p>
        <p>You requested to reset your password for RouteFast. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #d32f2f; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Questions or problems? Just reply to this email — it goes to barrett@digitalglue.dev.</p>
        <p>Thanks,<br>The RouteFast Team</p>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("requestPasswordReset failed:", error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error: 'Failed to send reset email. Please try again.' };
  }
})

export const resetPassword = serverAction(async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate password before starting transaction
    const validation = (await import('./password')).validatePasswordStrength(newPassword);
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Invalid password' };
    }

    // D1 doesn't support interactive transactions — use sequential ops
    const resetToken = await db.authToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.type !== 'PASSWORD_RESET' || !resetToken.userId) {
      return { success: false, error: 'Invalid or expired reset link' };
    }
    if (resetToken.used) return { success: false, error: 'This reset link has already been used' };
    if (new Date() > resetToken.expiresAt) return { success: false, error: 'This reset link has expired' };

    const passwordHash = await hashPassword(newPassword);

    await db.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
    await db.authToken.update({ where: { id: resetToken.id }, data: { used: true } });

    return { success: true };
  } catch (error) {
    console.error("resetPassword failed:", error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error: 'Failed to reset password. Please try again.' };
  }
})
