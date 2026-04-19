-- Drop unique constraint on Credential.userId to allow multiple passkeys per user
DROP INDEX IF EXISTS "Credential_userId_key";

-- Add label + lastUsedAt columns
ALTER TABLE "Credential" ADD COLUMN "label" TEXT;
ALTER TABLE "Credential" ADD COLUMN "lastUsedAt" DATETIME;
