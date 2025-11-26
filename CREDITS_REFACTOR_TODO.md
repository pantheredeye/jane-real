# Credits System Refactor - Implementation TODO

## Overview
Replace subscription-first model with credits-based onboarding:
- New users get 15 free credits (no payment required)
- 1 credit consumed per route calculation
- After credits exhausted, hard paywall to $9.99/month or $49.99/year subscription
- Subscribers get unlimited calculations
- Grandfathered users get unlimited access

## Configuration
- `FREE_CREDITS_AMOUNT=15` (env variable, configurable)
- Grandfathered users: bypass credits entirely
- Active/Trialing subscribers: bypass credits entirely
- Credit consumed on attempt (no refund on failure)

---

## PHASE 1: DATABASE & MIGRATION ⏳

### 1.1 Update Prisma Schema
- [ ] Add to User model:
  - `creditsRemaining Int @default(15)`
  - `totalCreditsGranted Int @default(15)`
  - Relation: `usageLogs UsageLog[]`
- [ ] Create UsageLog model:
  - `id String @id @default(uuid())`
  - `userId String` + relation to User
  - `action String` (e.g., "route_calculate")
  - `creditsUsed Int @default(1)`
  - `propertyCount Int?` (optional context)
  - `metadata String?` (JSON for addresses, settings)
  - `createdAt DateTime @default(now())`
  - Indexes: `@@index([userId])`, `@@index([createdAt])`, `@@index([action])`

### 1.2 Environment Variables
- [ ] Add `FREE_CREDITS_AMOUNT=15` to `.env.example`
- [ ] Add `FREE_CREDITS_AMOUNT=15` to `.env`
- [ ] Document in README or setup guide

### 1.3 Run Migration
- [ ] Run `pnpm prisma migrate dev --name add_credits_system`
- [ ] Verify migration applies cleanly
- [ ] Run `pnpm prisma generate` to update client

### 1.4 Grandfather Existing Users
- [ ] Create `scripts/grandfather-existing-users.ts`:
  - Query all users with `subscriptionStatus = NONE`
  - Set `grandfathered = true` for these users
  - Log count of users updated
- [ ] Run script manually: `tsx scripts/grandfather-existing-users.ts`
- [ ] Verify existing users marked as grandfathered

---

## PHASE 2: CREDITS LOGIC & ACCESS CONTROL ⏳

### 2.1 Create Credits Interruptor
- [ ] Create `src/app/interruptors/credits.ts`
- [ ] Implement `requireCredits` interruptor:
  - Check if user is authenticated (redirect to login if not)
  - Allow if `user.grandfathered === true`
  - Allow if `user.subscriptionStatus === 'ACTIVE' || 'TRIALING'`
  - Allow if `user.creditsRemaining > 0`
  - Otherwise: redirect to `/subscription/subscribe?reason=no-credits`
- [ ] Export from `src/app/interruptors/index.ts`

### 2.2 Update Route Protection
- [ ] Update `src/addons/route-calculator/routes.tsx`:
  - Replace `requireSubscription` with `requireCredits` in route array
  - Route should be: `[requireCredits, requireTenant, HomePage]`

### 2.3 Consume Credits in calculateRoute
- [ ] Update `src/addons/route-calculator/server-functions/calculateRoute.ts`:
  - Import Prisma client
  - Get current user from context
  - Before optimization logic, add credit consumption:
    - Check if user bypasses credits (grandfathered or subscribed)
    - If not bypassed, use Prisma transaction:
      - Create UsageLog entry (action: "route_calculate", creditsUsed: 1)
      - Decrement `creditsRemaining` by 1
      - Atomic update to prevent race conditions
  - Continue with existing calculation logic
  - No refund on failure (credit consumed on attempt)

### 2.4 Update Signup Flow
- [ ] Update `src/app/pages/user/functions.ts`:
  - When creating user (lines 105-110), ensure `creditsRemaining` uses env var:
    - `creditsRemaining: parseInt(process.env.FREE_CREDITS_AMOUNT || '15')`
    - `totalCreditsGranted: parseInt(process.env.FREE_CREDITS_AMOUNT || '15')`
  - Already doesn't require payment ✅

### 2.5 Testing Phase 2
- [ ] Test new signup gets 15 credits
- [ ] Test calculateRoute consumes 1 credit
- [ ] Test UsageLog entry created
- [ ] Test grandfathered user bypasses credit check
- [ ] Test subscribed user bypasses credit check
- [ ] Test user with 0 credits redirected to paywall

---

## PHASE 3: REMOVE STRIPE TRIAL PERIOD ⏳

### 3.1 Update Stripe Configuration
- [ ] Update `src/addons/subscription/utils/stripe.ts`:
  - Remove `trial_period_days: 30` from checkout session (line 78)
  - Subscriptions now start immediately as ACTIVE
  - Update any comments referencing trial period

### 3.2 Update Webhook Handler
- [ ] Review `src/addons/subscription/webhooks/webhookHandler.ts`:
  - Verify `checkout.session.completed` sets status to ACTIVE (not TRIALING)
  - Remove any TRIALING-specific logic if no longer applicable
  - Consider granting bonus credits on subscription (optional)

### 3.3 Update Subscription Page Copy
- [ ] Update `src/addons/subscription/pages/SubscribePage.tsx`:
  - Remove references to "30-day free trial"
  - Update messaging: "Get unlimited route calculations"
  - Clarify benefits of subscription vs free credits

### 3.4 Testing Phase 3
- [ ] Test subscription checkout flow
- [ ] Verify user.subscriptionStatus becomes ACTIVE immediately
- [ ] Verify subscribed user can calculate routes without credit consumption
- [ ] Test webhook processing

---

## PHASE 4: UI UPDATES ⏳

### 4.1 Credits Counter Display
- [ ] Update AppShell or header component (likely `src/app/components/AppShell.tsx` or similar):
  - Add credits counter: "X credits remaining"
  - Show only if user is NOT grandfathered and NOT subscribed
  - Style to match 50s retro theme
  - Position in top-right or near user menu

### 4.2 Credits Warning
- [ ] Create warning component or toast:
  - Show when `creditsRemaining < 5`
  - Message: "You have X credits left. Subscribe for unlimited calculations."
  - Link to `/subscription/subscribe`
  - Dismissible but re-shows on page load

### 4.3 Paywall Modal
- [ ] Create `PaywallModal.tsx` component ("use client"):
  - Triggered when user hits 0 credits
  - Message: "You've used all 15 free credits!"
  - CTA: "Subscribe for unlimited calculations"
  - Show pricing options ($9.99/mo, $49.99/yr)
  - Link to `/subscription/subscribe?reason=no-credits`

### 4.4 Update Subscription Page
- [ ] Update `src/addons/subscription/pages/SubscribePage.tsx`:
  - Add messaging about credits exhaustion if `?reason=no-credits` in URL
  - Highlight "unlimited calculations" benefit
  - Show comparison: "15 free credits → Unlimited with subscription"

### 4.5 Update Landing Page (Optional)
- [ ] Consider updating `src/app/pages/landing/LandingPage.tsx`:
  - Mention "Start with 15 free route calculations"
  - Update hero/pricing section if needed

### 4.6 Testing Phase 4
- [ ] Test credits counter displays correctly
- [ ] Test warning shows at < 5 credits
- [ ] Test paywall modal at 0 credits
- [ ] Test subscription page messaging
- [ ] Test all UI on mobile and desktop

---

## PHASE 5: TESTING & DEPLOYMENT ⏳

### 5.1 Integration Testing
- [ ] End-to-end new user flow:
  - Signup → get 15 credits
  - Calculate routes until 0 credits
  - Hit paywall
  - Subscribe
  - Verify unlimited access
- [ ] Existing user flows:
  - Grandfathered user: unlimited access
  - Subscribed user: unlimited access
  - Free user: 15 credits then paywall

### 5.2 Edge Cases
- [ ] Test concurrent route calculations (race conditions)
- [ ] Test user with exactly 1 credit left
- [ ] Test failed calculations don't refund credits
- [ ] Test subscription cancellation → reverts to credits
- [ ] Test re-subscribing after cancellation

### 5.3 Performance & Monitoring
- [ ] Check UsageLog table growth (add cleanup job if needed)
- [ ] Monitor credit consumption patterns
- [ ] Log errors in credit transaction failures

### 5.4 Documentation
- [ ] Update README with credits system explanation
- [ ] Document env variables
- [ ] Update CLAUDE.md project instructions

### 5.5 Deployment
- [ ] Commit all changes to `feature/credits-system` branch
- [ ] Push branch to remote
- [ ] Create pull request
- [ ] Review and merge to main
- [ ] Deploy to staging environment
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Monitor production for errors

---

## OPEN QUESTIONS / DECISIONS NEEDED

### Resolved ✅
- ✅ Grandfathered users get unlimited access (bypass credits)
- ✅ Subscribers get unlimited calculations (bypass credits)
- ✅ No refund on failed calculations
- ✅ Existing users grandfathered (set `grandfathered = true`)
- ✅ Remove Stripe 30-day trial period
- ✅ Free credits amount: 15 (configurable via env)

### Future Enhancements (Post-Launch)
- [ ] Credit counter as "easter egg" design (deferred)
- [ ] Email drip campaigns for credit usage milestones (deferred)
- [ ] Bonus credits for referrals (future)
- [ ] Credit packs as alternative to subscription (future)
- [ ] Analytics dashboard for credit usage patterns (future)

---

## BLOCKERS

- None currently

---

## NOTES

### What Counts as 1 Credit
- Each click of "Calculate Route" button = 1 credit
- Re-optimization (client-side time/duration changes) = 0 credits (no server call)

### Migration Strategy
- Existing users without subscriptions → set `grandfathered = true`
- Existing users with active subscriptions → no changes needed, already bypass credits
- New signups → start with 15 credits

### Technical Details
- Credits consumed atomically in Prisma transaction
- UsageLog provides audit trail for support and analytics
- Interruptor pattern ensures consistent access control across routes

### Success Metrics
- Conversion rate: free credits → paid subscription
- Average credits used before conversion
- Time to first calculation after signup
- Churn rate after credits exhausted
