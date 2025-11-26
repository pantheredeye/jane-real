-- Add credits system fields to User table
ALTER TABLE User ADD COLUMN creditsRemaining INTEGER DEFAULT 15 NOT NULL;
ALTER TABLE User ADD COLUMN totalCreditsGranted INTEGER DEFAULT 15 NOT NULL;

-- Create UsageLog table for tracking credit consumption
CREATE TABLE UsageLog (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  action TEXT NOT NULL,
  creditsUsed INTEGER DEFAULT 1 NOT NULL,
  propertyCount INTEGER,
  metadata TEXT,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Create indexes for UsageLog
CREATE INDEX UsageLog_userId_idx ON UsageLog(userId);
CREATE INDEX UsageLog_createdAt_idx ON UsageLog(createdAt);
CREATE INDEX UsageLog_action_idx ON UsageLog(action);
