-- Add password reset token table
CREATE TABLE PasswordResetToken (
    id TEXT PRIMARY KEY NOT NULL,
    userId TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expiresAt DATETIME NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE INDEX PasswordResetToken_userId_idx ON PasswordResetToken(userId);
CREATE INDEX PasswordResetToken_token_idx ON PasswordResetToken(token);
CREATE INDEX PasswordResetToken_expiresAt_idx ON PasswordResetToken(expiresAt);
