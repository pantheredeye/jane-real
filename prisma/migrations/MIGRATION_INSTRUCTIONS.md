# Database Migration: Make Email Required

## What Changed

- `User.email` is now **required** and the primary identifier
- `User.username` is now **optional** (derived from email prefix)
- All user records and related data will be wiped with this migration

## Running the Migration

### Local Development

Your local dev database will automatically recreate with the new schema on next run.

### Production (Cloudflare D1)

**⚠️ WARNING: This will delete all existing users, credentials, tenants, routes, and related data!**

Run this command to apply the migration:

```bash
pnpm wrangler d1 execute route-calculator-db --file=./prisma/migrations/make_email_required.sql --remote
```

Or if your database has a different name:

```bash
pnpm wrangler d1 execute YOUR_DB_NAME --file=./prisma/migrations/make_email_required.sql --remote
```

## After Migration

1. All existing users will need to sign up again
2. New signups will use email as the primary identifier
3. Passkeys will be tied to email addresses

## Rollback

There is no rollback for this migration since data is wiped. If you need to preserve user data, create a backup first:

```bash
# Export current data (if needed)
pnpm wrangler d1 export route-calculator-db --output=backup.sql --remote
```
