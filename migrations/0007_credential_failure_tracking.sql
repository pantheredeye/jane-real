-- Track failed passkey auth attempts to surface a reset recovery flow in the account UI.
ALTER TABLE "Credential" ADD COLUMN "failedAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Credential" ADD COLUMN "lastFailedAt" DATETIME;
