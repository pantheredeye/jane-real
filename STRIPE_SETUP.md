# Stripe Subscription Integration Setup Guide

## Overview
RouteFast now includes Stripe subscription integration with:
- **Pricing**: $9.99/month or $49.99/year
- **Trial**: 30-day free trial (card required upfront)
- **Grandfathered users**: Existing users get free forever access

## Quick Setup

### 1. Get Your Stripe Keys

**Test Mode** (for development):
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Secret key** (starts with `sk_test_`)
3. Click "Developers" → "Webhooks" → "Add endpoint"
4. Use webhook secret (starts with `whsec_`) later

**Live Mode** (for production):
1. Switch to Live mode in Stripe dashboard
2. Copy your **Live Secret key** (starts with `sk_live_`)
3. Set up webhook endpoint for production URL

### 2. Configure Local Development

Add to your `.env` file:

```bash
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Test Webhook Locally

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
# or
scoop install stripe
```

Login and forward webhooks:
```bash
stripe login
stripe listen --forward-to localhost:5173/subscription/webhook
```

This gives you a webhook secret - add it to `.env`

### 4. Grandfather Existing Users

Mark all existing users as grandfathered (free forever):

```bash
pnpm run grandfather
```

This is a one-time operation. Run it before launching subscriptions.

### 5. Test the Integration

1. Start dev server: `pnpm run dev`
2. Navigate to `/subscription/subscribe`
3. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Failure: `4000 0000 0000 9995`
4. Check webhook events in Stripe CLI output

### 6. Deploy to Production

**Set Cloudflare secrets:**
```bash
pnpm wrangler secret put STRIPE_SECRET_KEY
pnpm wrangler secret put STRIPE_WEBHOOK_SECRET
```

**Configure Stripe webhook:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://routefast.app/subscription/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret and add to Cloudflare secrets

## Architecture

### Pages
- `/subscription/subscribe` - Plan selection and checkout
- `/subscription/success` - Post-checkout success page
- `/subscription/manage` - Subscription management with portal link

### Server Functions
- `createCheckoutSession` - Creates Stripe Checkout session
- `createPortalSession` - Creates Customer Portal session
- `webhookHandler` - Processes Stripe events

### Database
User model includes:
- `stripeCustomerId` - Stripe customer ID
- `stripeSubscriptionId` - Active subscription ID
- `subscriptionStatus` - TRIALING, ACTIVE, PAST_DUE, etc.
- `subscriptionPlan` - "monthly" or "annual"
- `grandfathered` - Free forever flag

### Middleware
- `requireSubscription` - Protects routes requiring active subscription
- Applied to `/route` (route calculator)

## User Flow

### New User
1. Sign up with passkey
2. Redirected to `/subscription/subscribe`
3. Choose monthly or annual plan
4. Enter card info in Stripe Checkout
5. Subscription created with 30-day trial
6. Access route calculator immediately

### Trial End
1. Stripe automatically charges after 30 days
2. User receives email from Stripe
3. If payment fails, marked as PAST_DUE
4. Stripe retries payment automatically

### Subscription Management
1. User goes to `/subscription/manage`
2. Clicks "Manage Subscription in Stripe"
3. Redirected to Stripe Customer Portal
4. Can update card, cancel, view invoices

## Testing Scenarios

### Test Cards
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient funds**: 4000 0000 0000 9995
- **Requires authentication**: 4000 0025 0000 3155

### Webhook Events to Test
1. Successful subscription creation
2. Trial ending → payment success
3. Payment failure → retry
4. Subscription cancellation
5. Payment method update

## Pricing Strategy

Current pricing:
- **Monthly**: $9.99/month
- **Annual**: $49.99/year (58% savings)
- **Trial**: 30 days free

To change pricing, edit `src/addons/subscription/utils/stripe.ts`:
```typescript
export const STRIPE_CONFIG = {
  prices: {
    monthly: { amount: 999 }, // cents
    annual: { amount: 4999 },
  },
  trial: { days: 30 },
}
```

## Troubleshooting

### "STRIPE_SECRET_KEY is not set"
- Check `.env` file exists and has correct key
- Restart dev server after adding keys

### "Invalid signature" on webhook
- Webhook secret doesn't match
- Use `stripe listen` for local dev
- Check webhook secret in production

### Subscription not updating after checkout
- Check webhook endpoint is reachable
- View webhook logs in Stripe Dashboard
- Ensure webhook events are configured

### User stuck on subscribe page
- Check they don't already have subscription
- Verify `requireSubscription` middleware is working
- Check database subscription status

## Support

For issues:
- Check Stripe Dashboard → Developers → Logs
- Check webhook delivery attempts
- View subscription details in Stripe Dashboard
- Check database `User.subscriptionStatus`
