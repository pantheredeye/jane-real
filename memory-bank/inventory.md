# RouteFast Inventory — Pre-Native-Migration Audit

> Audit date: 2026-04-25. Branch: `ai-agent`. Source: `src/` + `package.json`.
> Verdict legend: **PORT** = lift as-is · **REDESIGN** = port w/ native UX rework · **DROP** = leave behind · **REWRITE** = rebuild on native APIs · **KEEP-WEB** = stays in web only (e.g. Stripe, landing).

---

## 1. App in one paragraph

RouteFast is a multi-tenant SaaS for real-estate agents on Cloudflare Workers (RWSDK 1.0.8 + Prisma/D1 + Durable Objects). Core flow: paste addresses or Zillow/Realtor URLs, get a TSP-optimized showing route via Google Maps geocoding + distance matrix, save/share routes, export as text. Layered on top: WebAuthn-passkey + magic-link + password auth, a Kimi-K2.5 conversational agent with tool-calling (events/reminders/route ops) backed by per-user `AgentStateDO`, web-push reminders (hand-rolled VAPID), Stripe subscriptions + 15-credit free trial, daily-digest email cron, comic-book/glass-neubrutalism CSS theme, and a Capacitor wrapper attempt for stores.

---

## 2. Routes & Pages

| Route | Page / Handler | RSC vs Client | Verdict | Reason |
|---|---|---|---|---|
| `/` | `LandingPage` (RSC) | RSC | **KEEP-WEB** | Marketing, SEO, Stripe sign-up. No native equivalent needed. |
| `/about` | `AboutPage` | RSC | **KEEP-WEB** | Marketing. |
| `/login`, `/signup` | redirect → `/user/auth` | RSC | DROP | Replaced by native auth screen. |
| `/protected` | `Home` (debug) | RSC | DROP | Stub. |
| `/user/auth` | `AuthPage` (passkey + password + magic) | client | **REWRITE** | Replace WebAuthn w/ Apple/Google sign-in or expo-passkeys; magic-link flow can port. |
| `/user/forgot-password`, `/user/reset-password` | client | client | PORT | Reusable w/ deep links. |
| `/user/magic` | `MagicLanding` | client | REDESIGN | Universal-link flow on native. |
| `/user/logout` | handler | server | PORT | Trivial. |
| `/api/auth/magic/verify`, `/api/auth/status` | handlers | server | **PORT** | These remain server endpoints the native app calls. |
| `/account` | `AccountPage` (passkey + password mgmt) | RSC + client panels | REDESIGN | Drop passkey panel; show device sign-in. |
| `/route/` | `HomePageWrapper` → `HomePage` | RSC wrapper + huge client tree | **REDESIGN** | THE app; native rebuild w/ shared logic from `packages/`. |
| `/route/api/export/:format` | `exportItinerary` | server | PORT | Pure text gen; move to API route. |
| `/route/api/health` | inline | server | DROP | Trivial. |
| `/agent/chat`, `/agent/voice`, `/agent/history`, `/agent/recent-prompts`, `/agent/reminders/:id/dismiss`, `/agent/badge` | handlers | server | **PORT** | These become the native app's HTTP API. Voice uses CF Workers AI Whisper — keep server-side. |
| `/subscription/subscribe`, `/success`, `/manage` | client pages | client (Stripe Elements) | **KEEP-WEB** | IAP needed on iOS instead; web flow stays for desktop/web. |
| `/subscription/webhook` | Stripe webhook | server | KEEP-WEB | Server endpoint, unchanged. |
| `/legal/privacy`, `/legal/terms` | RSC | RSC | KEEP-WEB | Static. Native app links out. |
| `/share` | placeholder | RSC | DROP | TODO stub, no implementation. |
| `/.well-known/apple-app-site-association`, `/assetlinks.json` | handlers | server | PORT | Universal-link manifests — already configured for native. |

**Summary**: 1 real app page (`/route/`), 1 real API surface (`/agent/*` + `/route/api/*`), the rest is auth + marketing + billing.

---

## 3. Components Inventory

### Route Calculator (`src/addons/route-calculator/components/`)

| Component | RSC/Client | Native-portable | Notes |
|---|---|---|---|
| `AppShell.tsx` | client | partial | Web shell w/ MenuSheet + dock-bridge wiring; native uses Stack/Tabs. |
| `PropertyInputBox.tsx` | client | yes | Logic ports; UI reskin. |
| `PropertyList.tsx` | client | yes | Container; trivial. |
| `PropertyListItem.tsx` | client | partial | Has swipe-to-delete + Menu dropdown — use react-native-gesture-handler. |
| `PropertyCard.tsx` | client | partial | Heavy DOM; rewrite layout. |
| `PropertyControls.tsx` | client | yes | Form state. |
| `DurationSelector.tsx` | client | yes | Pure pill-button UI. |
| `RouteOptionsCard.tsx` | client | yes | Collapsible card; reskin. |
| `RouteSummary.tsx` | RSC | yes | Pure presentational. |
| `StartingLocationCard.tsx` | client | partial | Uses `navigator.geolocation` → swap for `expo-location`. |
| `StartingLocationResultCard.tsx` | client | yes | Display only. |
| `DriveTimeConnector.tsx` | (no directive) | yes | Simple decoration. |
| `ErrorModal.tsx` | client | yes | Rewrap on Modal. |
| `ConfirmDialog.tsx` | client | yes | Rewrap on Alert/Modal. |
| `SaveRouteDialog.tsx` | client | yes | Rewrap. |
| `SavedRoutesSection.tsx` | client | yes | List view. |
| `MenuSheet.tsx` | client | partial | `vaul` drawer — replace w/ `@gorhom/bottom-sheet` or RN Modal. |
| `CopyButtons.tsx` | client | partial | Uses `navigator.clipboard` → `expo-clipboard`. |
| `Footer.tsx` + `Footer.css` | client | DROP | Web-only. |
| `StateManager.tsx` | client | REWRITE | localStorage persistence → AsyncStorage/MMKV. |

### Agent (`src/addons/agent/components/`)

| Component | RSC/Client | Native-portable | Notes |
|---|---|---|---|
| `AgentDock.tsx` | client | REWRITE | Floating dock w/ vaul drawers + window-event bridge — native should use a real bottom-sheet over a tab bar. |
| `ChatPanel.tsx` | client | partial | Message list logic ports; layout rebuild. |
| `ChatButton.tsx` | client | partial | FAB. |
| `AgentMessage.tsx` | client | yes | Markdown-ish text bubble. |
| `AgentResponseCard.tsx` | client | yes | Card. |
| `EventCard.tsx` / `ReminderCard.tsx` / `RouteSummaryCard.tsx` / `cardTypes.ts` | client | yes | Render typed agent results — port. |
| `VoiceMicButton.tsx` + `voice-mic.css` | client | REWRITE | MediaRecorder + Web Audio analyser — replace w/ `expo-av` or `expo-audio`. |
| `mount-dock.tsx` | client | DROP | Separate React-DOM root mounted via inline script. Native has no equivalent. |
| `dock-bridge.ts` | client | DROP | Window-event pub/sub for cross-tree coordination — native uses Context/Zustand. |

### Auth + Account (`src/app/pages/`)

| Component | RSC/Client | Native-portable | Notes |
|---|---|---|---|
| `AuthPage` | client | REWRITE | WebAuthn-specific; rebuild w/ native auth. |
| `Login`, `Signup` | client | REWRITE | Same. |
| `ForgotPassword`, `ResetPassword` | client | PORT | Form logic ports. |
| `MagicLanding` | client | REDESIGN | Universal link entry. |
| `AccountPage` + `PasskeyPanel` + `SetPasswordPanel` + `PasswordNudgeBanner` | mixed | partial | Drop passkey UI; password panels port. |

### UI primitives (`src/app/components/ui/` + `shared/`)

| Component | Source | Notes |
|---|---|---|
| `Dialog.tsx`, `AlertDialog.tsx`, `Menu.tsx` | `@base-ui/react` re-exports | DROP — rebuild on native primitives (RN Modal, ActionSheet, BottomSheet). |
| `TheaterModal.tsx` + CSS | shared | DROP — replace w/ native modal pattern. |
| `TawkChat.tsx` | inline script | KEEP-WEB only. |

### Landing / Marketing

`LandingHeader`, `HeroSection`, `PricingSection`, `FeaturesSection`, `CTAButton`, `ThemeSwitcher`, `ScreenshotComicStrip`, `DemoButton`, `DemoContent`. All **KEEP-WEB**.

### Subscription

`SubscribePage` + `Client`, `SuccessPage`, `ManagePage` + `Client`, `PaymentForm`. **KEEP-WEB** (Stripe Elements). For iOS use App-Store IAP; for Android use Play Billing or web fallback.

---

## 4. Server Functions

| Function | File | Purpose | Verdict | Notes |
|---|---|---|---|---|
| `calculateRoute` (`serverAction`) | `route-calculator/server-functions/calculateRoute.ts` | TSP optimization + credit consumption | **PORT** | Move to REST endpoint; extract `optimizeRoute()` to shared package. |
| `optimizeRoute` (export) | same | Pure TSP core | **EXTRACT** | Goes into `packages/route-engine`. |
| `geocodeAddresses`, `calculateDistanceMatrix` (`serverQuery`) | `geocoding.ts` | Google Maps wrappers | **PORT** | Server-only; native calls via API. Has 100ms throttle in loop. |
| `exportItinerary`, `generateClientItinerary`, `generateDetailedItinerary`, `generateICalendar` | `export.ts` | Text/iCal export | **EXTRACT** | Pure functions → shared package. iCal generator is unused on web client but valuable on native. |
| `fetchOgImage` | `fetchOgImage.ts` | Scrape og:image from Zillow/Realtor/Redfin/Trulia | PORT | Allowlisted; server-side only. |
| `getUserCredits` | `getUserCredits.ts` | Credit summary | PORT | Trivial. |
| `getRoutes` | `routeQueries.ts` | List saved routes | PORT | Trivial. |
| `saveRoute`, etc. | `routeActions.ts` | Persist routes | PORT | Trivial. |
| `runChat` | `agent/server-functions/chat.ts` | Agent loop entrypoint | PORT | Already invoked over HTTP via `/agent/chat`. |
| `getPreferences`, `updatePreferences`, `ensureTimezone` | `preferences.ts` | User prefs (tz, autoReminder, dailyDigest) | PORT | Native sets timezone on first login. |
| `subscribePush`, `unsubscribePush`, `getVapidPublicKey`, `sendPush` | `pushSubscription.ts` | Web Push subscription mgmt | **REWRITE** | Replace w/ APNs/FCM via Expo Notifications. VAPID/web-push gone on native. |
| `runReminderCron` | `reminderCron.ts` | Every-5min reminder fan-out | PORT | Server cron unchanged. |
| `runDailyDigest` | `dailyDigest.ts` | Daily email digest via Resend | PORT | Cron unchanged; native irrelevant to it. |
| `createSubscription`, `createCheckoutSession`, `createPortalSession`, `handleStripeWebhook` | `subscription/server-functions/*` | Stripe ops | KEEP-WEB | Plus IAP for iOS. |
| Auth: `startPasskeyRegistration`, `finishPasskeyLogin`, `loginWithPassword`, `signupWithPassword`, `requestMagicLink`, `verifyMagicToken`, `requestPasswordReset`, `resetPassword`, `lookupAuthMethod`, `accountActions` | `app/pages/user/*.ts`, `account/accountActions.ts` | Auth flows | partial | Magic-link + password port; passkey REWRITE w/ native APIs. |
| Agent tool handlers (`event.ts`, `reminder.ts`, `route.ts`, `export.ts`) | `agent/handlers/*` | Tool implementations called by agent loop | PORT | Pure server-side; trim "extract this for shared package" candidates (e.g. `lookupProperty`). |

---

## 5. Utilities & Parsers — Extract First

To `packages/parsers` (zero deps, pure TS):
- `addons/route-calculator/utils/parsePropertyInput.ts`
- `addons/route-calculator/utils/urlParsers/zillow.ts`
- `addons/route-calculator/utils/urlParsers/realtor.ts`
- `addons/route-calculator/utils/addressNormalizer.ts`
- `addons/route-calculator/utils/addressFormatter.ts`

To `packages/types` (shared domain types):
- `addons/route-calculator/types.ts` (Property, OptimizedRoute, RouteStructure, schemas)
- `addons/agent/types.ts` (Event/Reminder Zod schemas, ToolResult)
- `addons/agent/components/cardTypes.ts` (EventCardData, ReminderCardData)

To `packages/route-engine` (TSP + geocoding-agnostic):
- `optimizeRoute()` core from `calculateRoute.ts`
- `nearestNeighborTSP`, `optimizedTSP`, `twoOptImprovement`, `calculateRouteDistance`

To `packages/itinerary` (export):
- `generateClientItinerary`, `generateDetailedItinerary`, `generateICalendar`, `escapeICalText`

To `packages/agent` (LLM glue, server-only):
- `agent/llm.ts` (runAgentLoop, AGENT_TOOLS)
- `agent/prompts.ts`
- `agent/handlers/*`
- `agent/utils/timezone.ts`

To `packages/push` (server-only, optional):
- `agent/utils/vapid.ts` — keep for any web-push fallback; native app does not use.

---

## 6. Database Schema

Single SQLite (D1) DB via Prisma. Models:

| Model | Purpose | Native impact |
|---|---|---|
| `User` | Auth + Stripe + credits + preferences (JSON) | Drop `passwordHash` only on social-only sign-in; otherwise unchanged. |
| `Credential` | WebAuthn credentials | DROP if native abandons WebAuthn — or keep alongside device push tokens. |
| `Tenant`, `TenantMembership` | Multi-tenant w/ OWNER/MEMBER/GUEST roles | Keep — native uses same tenant scoping. |
| `Route`, `RouteShare` | Saved routes + share table (intra/cross-tenant) | Keep. Note: `properties` and `frozen` are JSON strings in TEXT — works but no querying inside. |
| `Event`, `Reminder`, `PushSubscription` | Agent calendar + reminders + web-push subs | Keep `Event`/`Reminder`. Add `DeviceToken` model for APNs/FCM (replaces `PushSubscription`'s p256dh/auth). |
| `AuditLog`, `UsageLog` | Audit + credit usage analytics | Keep. |
| `AuthToken` (PASSWORD_RESET, MAGIC_LINK) | Email-token sign-in | Keep. |
| `ProcessedWebhookEvent` | Stripe idempotency | Keep. |

**Schema changes recommended pre-native**:
1. Add `DeviceToken { userId, platform, token, createdAt }` (or extend `PushSubscription` w/ a `kind` enum).
2. Consider denormalizing `Route.properties` JSON if you ever need to query individual properties.
3. Boolean-as-Int (`Route.optimized`) is a SQLite-ism — leave alone, but document.
4. `User.preferences` JSON-in-string — fine, but a JSON1-aware adapter would be nicer.

---

## 7. Auth

### Current flow
1. WebAuthn passkey (primary, `@simplewebauthn/server` + `browser`).
2. Password (PBKDF2 in `password.ts`) as fallback.
3. Magic-link via `AuthToken` + Resend email.
4. Sessions stored in `SessionDurableObject` (per-cookie DO), `MAX_SESSION_DURATION` from RWSDK.
5. Tenant context loaded into `ctx.tenant` + `ctx.membership` on every request.

### Native changes
- **Drop browser-WebAuthn**. Options: (a) port to native passkeys via `expo-passkeys`/AuthenticationServices on iOS + CredentialManager on Android (still WebAuthn protocol, different SDK); (b) Sign in with Apple / Google + email + magic-link only.
- **Magic-link works as-is** if universal links are wired (already have `apple-app-site-association` + `assetlinks.json`).
- **Sessions** — keep server-side DO. Issue a long-lived bearer token (or rotating refresh token) for the native client; cookies don't apply.
- **Tenant selection** — currently auto-loads from session; native may need explicit tenant-switcher UI.

---

## 8. External APIs

| API | Where | Server vs Client | Verdict |
|---|---|---|---|
| Google Maps Geocoding | `geocoding.ts` via `env.GOOGLE_MAPS_API_KEY_SERVER` | server | Stays server. Native calls via `/route/calculate`. |
| Google Maps Distance Matrix | `geocoding.ts` | server | Stays server. |
| Google Maps client-side (any) | `@googlemaps/google-maps-services-js` listed but only used server-side | server | OK. |
| Cloudflare Workers AI (Kimi K2.5 + Whisper) | `agent/llm.ts`, `agent/routes.tsx#transcribeAudio` | server | Stays server. Native uploads audio bytes to `/agent/voice`. |
| Stripe (`stripe`, `@stripe/react-stripe-js`, `@stripe/stripe-js`) | subscription addon | mixed | Web only. Native = IAP. |
| Resend (email) | `dailyDigest.ts` + magic-link | server | Stays server. |
| Web Push (hand-rolled VAPID via `agent/utils/vapid.ts`) | server + browser SW | both | REWRITE for native (APNs/FCM). |
| OG-image scraper | `fetchOgImage.ts`, allowlisted to Zillow/Realtor/Redfin/Trulia | server | Stays server. |
| Tawk.to chat widget | `app/components/TawkChat.tsx` | client | KEEP-WEB. |

**API key handling**: `GOOGLE_MAPS_API_KEY_SERVER` and `GOOGLE_MAPS_API_KEY` (client) referenced in `global.d.ts`/env. All Maps calls are server-side — good. No keys exposed to client.

---

## 9. Design / Styles

CSS surfaces totalling ~6.8k lines across 5 large files + per-component CSS:

| File | Lines | Verdict |
|---|---|---|
| `addons/route-calculator/styles.css` | 3636 | aesthetic-only — REWRITE on native using design tokens. The header docstring already documents an internal utility system (text-*, flex-*, gap-*, tap-*, btn-*, card-*) — extract token values into a shared theme. |
| `addons/agent/styles.css` | 1924 | aesthetic-only — REWRITE. |
| `app/pages/landing/styles.css` | 520 | KEEP-WEB. |
| `app/pages/user/auth.css` | 406 | DROP (auth is native). |
| `app/pages/about/styles.css` | 355 | KEEP-WEB. |
| Component CSS (Footer, theater-modal, voice-mic, etc.) | ~500 total | DROP. |

**Design tokens to extract** (from `route-calculator/styles.css` `:root`): color palette (electric blue `#3b82f6`, danger `#ef4444`, success `#10b981`, glass alphas), spacing scale `--space-1..16` (4–64 px), tap targets 44/48/56 px, typography scale `--text-xs..4xl`, fonts (Bebas Neue, Archivo Black, Inter). Glassmorphism + backdrop-blur effects — native equivalent: `expo-blur` for iOS / acrylic on Android.

**Structural** (informs native layout): the `AppShell` floating-dock + bottom primary action + collapsible cards pattern translates to a native bottom tab + bottom-sheet pattern. Otherwise pure aesthetic.

---

## 10. Tech Debt Callouts (fix BEFORE native build-out)

1. **Dock bridge is a global window-event pub/sub** (`src/addons/agent/dock-bridge.ts`) tightly coupled to a separate React-DOM root mounted via inline script (`mount-dock.tsx`). Replace w/ a single React tree + Context/Zustand store BEFORE attempting native — there's no analog on RN.
2. **HomePage.tsx is 530 lines, owns 7 hooks + agent integration + 3 confirm dialogs** — break apart into screen-shaped subcomponents before native rebuild, or the rewrite will be 1:1 and miserable.
3. **Property/Route data is JSON-in-TEXT in D1** — fine for now, but a search/filter feature will require a schema change. Decide before native UX work.
4. **No tests anywhere** (no `*.test.ts`, no test runner). Extract pure utils + add Vitest before refactoring — TSP, parsers, formatters are all easy targets.
5. **`StateManager.tsx` localStorage persistence** is the only persistence layer for in-progress routes. Confirm whether this should sync to D1 (TODO at top of `calculateRoute.ts` says yes) before native — native will need the same persistence.
6. **Two Google Maps env vars** (`GOOGLE_MAPS_API_KEY` + `_SERVER`) — only the server one is used. Audit `global.d.ts` and remove the dead one.
7. **`@googlemaps/google-maps-services-js`** is in deps but not actually used — geocoding code does raw `fetch`. Drop the dep.
8. **`vaul` drawer + `@base-ui/react`** = web-only. Keep using on web; do not let new code reach for these in shared packages.
9. **`/share` page is a stub** — decide drop-or-build before native scope is set.
10. **Cross-request promise resolution** is disabled via `compatibility_flags: ["no_handle_cross_request_promise_resolution"]` (wrangler.jsonc) — this is a workaround flag. Document the tradeoff.

---

## 11. Native Portability Flags

### Deps that won't work in React Native

| Dep | Reason | Replacement |
|---|---|---|
| `rwsdk` (1.0.8) | Cloudflare Workers RSC framework | Server stays in Workers; native is Expo. |
| `react-server-dom-webpack` | RSC | N/A on native. |
| `@base-ui/react` | DOM-only Radix-style primitives | RN built-ins + react-native-reanimated + `@gorhom/bottom-sheet`. |
| `vaul` | DOM drawer | `@gorhom/bottom-sheet`. |
| `@simplewebauthn/browser` + `/server` | WebAuthn over DOM `navigator.credentials` | `expo-passkeys` (native passkeys) OR drop. |
| `@stripe/react-stripe-js`, `@stripe/stripe-js` | Stripe Elements (DOM) | `@stripe/stripe-react-native` OR IAP. |
| `@cloudflare/vite-plugin`, `@cloudflare/workers-types`, `wrangler` | Build/runtime for Workers | N/A on native. |
| `@prisma/adapter-d1`, `@prisma/client` (workerd target) | Server-only | Stays server. |
| `@capacitor/*` | Failed/abandoned wrapper attempt | DROP — replaced by Expo. |
| `@googlemaps/google-maps-services-js` | Currently unused (raw fetch instead) | Drop. |
| `resend` | Server-only email | Stays server. |

### Native-safe deps to keep

`react`, `react-dom` (web only), `date-fns`, `zod`. (Note React 19.2.1 — RN must be on a compatible version; verify Expo SDK matches.)

### RSC / framework patterns that need replacement

- **`"use server"` server actions** → REST/tRPC/`@expo/api-routes` calls.
- **`requestInfo`/`serverAction`/`serverQuery` from `rwsdk/worker`** → wrap in plain HTTP handlers.
- **Interruptors** (`requireAuth`, `requireTenant`, `requireCredits`, `rateLimit`, `requireRole`) — port to a server middleware chain (Hono on Workers is closest analog).
- **Cookie-based session via Durable Object** — native needs token-based auth (bearer in header).
- **`render(Document, [...])` HTML shell** + `Document.tsx` w/ inline scripts — irrelevant on native.
- **`navigator.geolocation`, `navigator.clipboard`, `MediaRecorder`, `Web Audio API`, `localStorage`** — replace per usage (see component table).
- **Service worker (`/sw.js`)** + Web Push — replace w/ Expo Notifications + APNs/FCM.
- **`?url` CSS imports + `<link>` injection in `Document.tsx`** — irrelevant on native.

---

## 12. Top 5 Things to Extract First

Order matters — each builds on the previous, all are `0 → done` today with no behavior change.

1. **`packages/parsers`** — move `parsePropertyInput`, `urlParsers/zillow`, `urlParsers/realtor`, `addressNormalizer`, `addressFormatter`. Pure TS, no deps. Add Vitest tests as you move them. **First** because it unblocks both web and native sharing the URL/address brain.
2. **`packages/types`** — `route-calculator/types.ts` + `agent/types.ts` + `agent/components/cardTypes.ts`. Lets web and native compile against one source of truth for `Property`, `OptimizedRoute`, agent tool I/O. Required by everything below.
3. **`packages/route-engine`** — extract `optimizeRoute()` + TSP helpers from `calculateRoute.ts`. Pure functions over coords + a distance-matrix-fetcher interface (inject geocoder). Lets the server keep Google Maps calls, lets native unit-test the optimizer locally with mock matrices.
4. **`packages/itinerary`** — `generateClientItinerary`, `generateDetailedItinerary`, `generateICalendar`. Useful on native immediately (share-sheet text + .ics file).
5. **`packages/agent`** (server-only) — `llm.ts`, `prompts.ts`, `handlers/*`, `utils/timezone.ts`. Move so the Workers app and any future native-edge worker share one agent definition. Mark as `engines: { workers: true }` to flag it can't run on RN.

---

## Appendix: File counts

- Source files: ~120 (.ts/.tsx) + 11 .css.
- Server actions/queries: 21.
- Client components: 60+ (every interactive component carries `"use client"`).
- Routes: ~30 across 7 route modules.
- Cron jobs: 2 (`*/5 * * * *` reminders, `0 12 * * *` digest).
- Durable Objects: 2 (`SessionDurableObject`, `AgentStateDO`).
