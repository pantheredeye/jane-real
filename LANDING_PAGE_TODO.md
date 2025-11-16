# See Jane Sell - Landing Page & User Flow Implementation

## Project Overview
Convert 50s retro-styled landing page mockup to production RedwoodSDK app with signup, payment, and profile management.

---

## PHASE 1: LANDING PAGE CONVERSION ✅ **COMPLETED**

### 1.1 Create Landing Page Structure
- [x] Create `src/app/pages/landing/` directory
- [x] Add `routes.tsx` for public route at `/`
- [x] Create `LandingPage.tsx` (Server Component)
- [x] Port CSS from mockup to `styles.css`
- [x] Set up CSS custom properties for theming

### 1.2 Build Core Components
- [x] `HeroSection.tsx` (Server Component) - headline, tagline, description, CTA
- [x] Oval badge integrated into HeroSection - "15 SEC NOT 15 MIN" badge
- [x] `PricingSection.tsx` (Server Component) - pricing display
- [x] `FeaturesSection.tsx` (Server Component) - 3-step feature cards
- [x] `ThemeSwitcher.tsx` ("use client") - Comic/Diner theme toggle
- [x] `CTAButton.tsx` ("use client") - navigation to signup

### 1.3 Theme System
- [x] Implement CSS variables for Comic (Red) theme
- [x] Implement CSS variables for Diner (Mint) theme
- [x] Add localStorage persistence for theme choice
- [x] Add smooth transitions between themes
- [x] Test halftone dots on Comic theme
- [x] Test glow effects on Diner theme

### 1.4 Responsive Design
- [x] Test mobile layout (< 768px)
- [x] Test tablet layout (768px - 1024px)
- [x] Test desktop layout (> 1024px)
- [x] Adjust badge positioning for mobile (bottom left, crosses border on mobile)

### 1.5 Polish & Testing
- [x] Verify all copy matches approved mockup
- [x] Test theme switcher persistence
- [x] Test CTA button navigation (goes to /signup)
- [x] Update CSP headers for Google Fonts
- [x] Fix CSS loading in Document.tsx

---

## PHASE 3: APP ACCESS & USAGE TRACKING

### 3.1 Usage Tracking
- [ ] Create `trackUsage.ts` server function
- [ ] Track first use of the day (UsageLog entry)
- [ ] Prevent duplicate entries for same day
- [ ] Add usage tracking to HomePage load

### 3.2 Access Control
- [ ] Create `requirePaymentMethod` interruptor
- [ ] Block access if no payment method on file
- [ ] Add route protection to `/route-calculator`
- [ ] Show friendly error if payment method missing

### 3.3 Billing Logic Foundation
- [ ] Calculate usage count for current month
- [ ] Create function to calculate monthly bill ($1/day used)
- [ ] Design month-end billing trigger (webhook or cron)

### 3.4 Testing
- [ ] Test daily usage logging
- [ ] Test usage count calculation
- [ ] Test interruptor blocking unpaid users
- [ ] Verify no duplicate logs for same day

---

## PHASE 4: PROFILE & BILLING MANAGEMENT

### 4.1 Profile Page Structure
- [ ] Create `src/app/pages/profile/` directory
- [ ] Add `routes.tsx` for protected route at `/profile`
- [ ] Create `ProfilePage.tsx` (Server Component)
- [ ] Fetch user data + usage history

### 4.2 Profile Components
- [ ] `AccountInfo.tsx` - email, passkey status
- [ ] `PaymentMethodCard.tsx` ("use client") - display card (last 4)
- [ ] `UpdateCardForm.tsx` ("use client") - Stripe Elements for update
- [ ] `UsageHistory.tsx` (Server Component) - monthly usage table
- [ ] `BillingPreview.tsx` (Server Component) - current month preview

### 4.3 Payment Management
- [ ] `updatePaymentMethod.ts` server function
- [ ] Update Stripe payment method
- [ ] Handle update errors
- [ ] Show success/error messages

### 4.4 Account Management
- [ ] `cancelAccount.ts` server function
- [ ] Confirmation modal before cancellation
- [ ] Detach payment method from Stripe
- [ ] Soft delete or hard delete user (decide)
- [ ] Redirect to landing page after cancel

### 4.5 Testing
- [ ] Test viewing profile
- [ ] Test updating payment method
- [ ] Test viewing usage history
- [ ] Test account cancellation flow

---

## PHASE 5: BILLING AUTOMATION

### 5.1 Month-End Billing
- [ ] Create Stripe Checkout Session or Invoice
- [ ] Calculate total: (days used × $1)
- [ ] Charge customer at month-end
- [ ] Handle successful payments
- [ ] Handle failed payments

### 5.2 Stripe Webhooks
- [ ] Set up webhook endpoint `/api/webhooks/stripe`
- [ ] Verify webhook signature
- [ ] Handle `invoice.payment_succeeded` event
- [ ] Handle `invoice.payment_failed` event
- [ ] Handle `customer.subscription.deleted` event (if using subscriptions)

### 5.3 Failed Payment Handling
- [ ] Send email notification on failed payment
- [ ] Grace period before blocking access (3 days?)
- [ ] Block access if payment fails after grace period
- [ ] Allow user to update card and retry

### 5.4 Testing
- [ ] Test month-end billing with test cards
- [ ] Test successful payment webhook
- [ ] Test failed payment webhook
- [ ] Test grace period logic

---

## PHASE 6: POLISH & LAUNCH

### 6.1 Email Notifications
- [ ] Welcome email on signup
- [ ] Monthly invoice email
- [ ] Failed payment notification
- [ ] Account cancellation confirmation

### 6.2 Analytics & Monitoring
- [ ] Add analytics tracking (signup conversions)
- [ ] Monitor Stripe payment success rate
- [ ] Set up error logging (Sentry or similar)
- [ ] Create admin dashboard for usage stats

### 6.3 Legal & Compliance
- [ ] Add Terms of Service page
- [ ] Add Privacy Policy page
- [ ] Add billing terms to signup flow
- [ ] GDPR compliance (if needed)
- [ ] Add footer with legal links

### 6.4 Final Testing
- [ ] End-to-end user journey test
- [ ] Test all error scenarios
- [ ] Load testing
- [ ] Security audit

### 6.5 Deployment
- [ ] Switch Stripe from test mode to production
- [ ] Complete Stripe legal registration
- [ ] Deploy to Cloudflare Workers
- [ ] Set production environment variables
- [ ] Monitor first real signups

---

## OPEN QUESTIONS & DECISIONS NEEDED

### Payment Timing
- [ ] **Decision:** Collect card on signup, charge at month-end based on usage? ✅
- [ ] **Decision:** No trial period - charge from day 1? (TBD)
- [ ] **Decision:** Minimum charge per month? (e.g., $1 minimum even if unused) (TBD)

### Billing Cycle
- [ ] **Decision:** Calendar month (bill on 1st) or anniversary (30 days from signup)? (TBD)
- [ ] **Decision:** Prorate first month or charge for partial month? (TBD)

### Failed Payments
- [ ] **Decision:** Grace period duration (3 days? 7 days?) (TBD)
- [ ] **Decision:** How many retry attempts before blocking access? (TBD)

### Account Management
- [ ] **Decision:** Soft delete (keep data) or hard delete (remove everything)? (TBD)
- [ ] **Decision:** Allow export of usage data before deletion? (TBD)

---

## NOTES

### Stripe Test Mode
- Using Stripe test mode during development is perfect
- Test mode uses separate API keys (test_...)
- Test card numbers: https://stripe.com/docs/testing
- No real charges will occur
- Complete legal registration before switching to production

### Theme Selection
- Need to finalize: Comic (Red) vs Diner (Mint)
- Or keep both with theme switcher?
- Theme choice affects landing page only, not app interior

### Current Mockup Status
- v5 mockup location: `/home/ptre/code/github/jane-real/mockups/v5-two-themes-oval-badge.html`
- Two themes implemented: Comic Book (Red) and Diner (Mint)
- Oval badge design approved
- Copy approved: "From Property Links to Perfect Route in Seconds"

---

## BLOCKERS

- None currently

---

## COMPLETED WORK

- ✅ Brand guidelines (colors, fonts, motifs)
- ✅ Copy refinement (hero, pricing, features)
- ✅ Mockup iterations (v1 through v5)
- ✅ Theme system design (Comic vs Diner)
- ✅ Oval badge design
- ✅ Responsive design in mockup
