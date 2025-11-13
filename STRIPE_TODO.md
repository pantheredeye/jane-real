# Stripe Integration TODO

## Current Status
✅ **Completed:**
- Database schema with Stripe subscription fields
- Checkout flow at `/subscription/subscribe`
- Webhook handler at `/subscription/webhook`
- Subscription management page at `/subscription/manage`
- `requireSubscription` middleware protecting `/route`
- Grandfather script for existing users

❌ **Current Issue:**
- Webhooks not firing/being received locally
- Users complete Stripe checkout successfully
- Database doesn't get updated with subscription status
- Users redirected back to checkout page when trying to access routes

## Immediate Next Steps

### 1. Fix Webhook Testing (BLOCKING)

**The Problem:**
Stripe checkout works, but webhook events don't reach your local server, so the database never updates with subscription status.

**Quick Fix - Manual DB Update:**
```bash
# Find your email in the database
pnpm wrangler d1 execute DB --local --command="SELECT id, email, subscriptionStatus FROM User"

# Update your user to TRIALING status
pnpm wrangler d1 execute DB --local --command="UPDATE User SET subscriptionStatus='TRIALING' WHERE email='your@email.com'"
```

**Proper Fix - Set Up Webhook Forwarding:**

1. **Install Stripe CLI:**
   ```bash
   stripe login
   ```

2. **Start webhook forwarding (separate terminal):**
   ```bash
   stripe listen --forward-to http://localhost:5173/subscription/webhook
   ```

   This outputs: `Your webhook signing secret is whsec_xxxxxxxxxxxxx`

3. **Add webhook secret to `.env`:**
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_the_secret_from_step_2
   ```

4. **Restart dev server with both terminals:**
   - Terminal 1: `pnpm run dev`
   - Terminal 2: `stripe listen --forward-to http://localhost:5173/subscription/webhook`

5. **Test the full flow:**
   - Go to `/subscription/subscribe`
   - Complete checkout with test card `4242 4242 4242 4242`
   - Watch Terminal 2 for webhook events
   - After redirect to `/subscription/success`, click "Start Planning Routes"
   - Should work without redirecting back to checkout

### 2. Production Deployment

**Before going live:**

1. **Run grandfather script (ONE TIME):**
   ```bash
   pnpm run grandfather
   ```

2. **Set Cloudflare secrets:**
   ```bash
   pnpm wrangler secret put STRIPE_SECRET_KEY
   # Paste your LIVE secret key: sk_live_...

   pnpm wrangler secret put STRIPE_WEBHOOK_SECRET
   # Get this from Stripe dashboard after step 3
   ```

3. **Configure production webhook in Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `https://routefast.app/subscription/webhook`
   - Events to select:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the "Signing secret" (whsec_...)
   - Add to Cloudflare secrets (step 2)

4. **Deploy:**
   ```bash
   pnpm run release
   ```

5. **Test production:**
   - Sign up with real account
   - Use test card in production (Stripe allows this)
   - Verify webhook delivery in Stripe Dashboard → Webhooks → Events

## Files Reference

**Key Files:**
- `src/addons/subscription/pages/SubscribePage.tsx` - Checkout UI
- `src/addons/subscription/server-functions/createCheckoutSession.ts` - Creates Stripe session
- `src/addons/subscription/server-functions/webhookHandler.ts` - Processes webhooks
- `src/addons/subscription/routes.tsx` - Routes including webhook endpoint
- `src/app/interruptors.ts` - `requireSubscription` middleware
- `prisma/schema.prisma` - User model with Stripe fields

**Database Commands:**
```bash
# Check user subscription status
pnpm wrangler d1 execute DB --local --command="SELECT email, subscriptionStatus FROM User"

# Manually set user to TRIALING
pnpm wrangler d1 execute DB --local --command="UPDATE User SET subscriptionStatus='TRIALING' WHERE email='test@example.com'"

# Check all subscription statuses
pnpm wrangler d1 execute DB --local --command="SELECT subscriptionStatus, COUNT(*) as count FROM User GROUP BY subscriptionStatus"
```

## Testing Checklist

- [ ] Webhooks forwarding locally with `stripe listen`
- [ ] Complete checkout flow works end-to-end
- [ ] Database updates after checkout (check with D1 query)
- [ ] Can access `/route` after subscribing
- [ ] Can view subscription details at `/subscription/manage`
- [ ] Can open Stripe Customer Portal from manage page
- [ ] Grandfathered users bypass subscription check
- [ ] Non-subscribed users redirected to `/subscription/subscribe`

## Notes

**Current Pricing:**
- Monthly: $9.99/mo
- Annual: $49.99/year (58% savings)
- Trial: 30 days free

**To change pricing:**
Edit `src/addons/subscription/utils/stripe.ts`:
```typescript
export const STRIPE_CONFIG = {
  prices: {
    monthly: { amount: 999 }, // cents
    annual: { amount: 4999 },
  },
  trial: { days: 30 },
}
```

**Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Insufficient funds: `4000 0000 0000 9995`

**Important URLs:**
- Checkout: `/subscription/subscribe`
- Success: `/subscription/success`
- Manage: `/subscription/manage`
- Webhook: `/subscription/webhook` (not user-facing)
