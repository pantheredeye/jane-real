-- Rename PasswordResetToken → AuthToken, add email + type columns, and make userId nullable
-- (SQLite can't ALTER a NOT NULL column to nullable, so we recreate the table.)

-- 1. Create new AuthToken table with final shape
CREATE TABLE AuthToken (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL,
    userId TEXT,
    type TEXT NOT NULL DEFAULT 'PASSWORD_RESET',
    token TEXT NOT NULL UNIQUE,
    expiresAt DATETIME NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- 2. Copy existing rows, joining User to backfill email
INSERT INTO AuthToken (id, email, userId, type, token, expiresAt, used, createdAt)
SELECT prt.id, u.email, prt.userId, 'PASSWORD_RESET', prt.token, prt.expiresAt, prt.used, prt.createdAt
FROM PasswordResetToken prt
JOIN User u ON u.id = prt.userId;

-- 3. Drop the old table + indexes
DROP INDEX IF EXISTS PasswordResetToken_userId_idx;
DROP INDEX IF EXISTS PasswordResetToken_token_idx;
DROP INDEX IF EXISTS PasswordResetToken_expiresAt_idx;
DROP TABLE PasswordResetToken;

-- 4. Create new indexes
CREATE INDEX AuthToken_userId_idx ON AuthToken(userId);
CREATE INDEX AuthToken_email_idx ON AuthToken(email);
CREATE INDEX AuthToken_token_idx ON AuthToken(token);
CREATE INDEX AuthToken_expiresAt_idx ON AuthToken(expiresAt);
