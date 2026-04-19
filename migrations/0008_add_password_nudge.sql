-- Track when the user dismissed the "set a password" nudge for magic-link-only accounts.
ALTER TABLE "User" ADD COLUMN "passwordNudgeDismissedAt" DATETIME;
