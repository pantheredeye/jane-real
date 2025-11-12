-- Add Stripe subscription fields to User table
ALTER TABLE User ADD COLUMN stripeCustomerId TEXT UNIQUE;
ALTER TABLE User ADD COLUMN stripeSubscriptionId TEXT UNIQUE;
ALTER TABLE User ADD COLUMN subscriptionStatus TEXT DEFAULT 'NONE' NOT NULL;
ALTER TABLE User ADD COLUMN subscriptionPlan TEXT;
ALTER TABLE User ADD COLUMN trialEndsAt INTEGER;
ALTER TABLE User ADD COLUMN currentPeriodEnd INTEGER;
ALTER TABLE User ADD COLUMN cancelAtPeriodEnd INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE User ADD COLUMN grandfathered INTEGER DEFAULT 0 NOT NULL;

-- Create indexes for Stripe fields
CREATE INDEX User_stripeCustomerId_idx ON User(stripeCustomerId);
CREATE INDEX User_subscriptionStatus_idx ON User(subscriptionStatus);
