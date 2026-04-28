# RouteFast — North Star

Single pinned doc. Re-read Mondays. Update when direction shifts, not when tasks complete.

---

## Who / What / Why

**User**: Jane, real estate agent. Mobile-in-motion. Gets property links via text from clients constantly. Pivots routes on the fly. Spends most of her tour day driving and on the phone.

**Core moment**: text → route in <10s. Live-shared tour board with client. Voice annotate during/after each property.

**Moat**: voice notes accumulating into client preference profile + clients become users via the shared tour board.

---

## Unfair Advantages

1. **Inbox between client texts and the route.** iOS Share Extension (Messages → "Add to Route"), Twilio forwarding number on web, eventually iMessage app. Eliminate paste entirely.

2. **Voice + agent during/after showings.** Press-and-hold per property → transcribed → structured notes (liked / disliked / follow-ups / agent private). Auto-drafted post-tour recap email to client. RE-specific so incumbents won't bother.

3. **Shared client tour board (App Clip).** Magic link, no install. Client sees route + ETAs, can drop more Zillow links into pending queue, ❤️ properties, voice annotate. Becomes organic growth — clients ask their next agent for it.

---

## 60 / 90 / 180

**60-day**
- Memory bank + `/north-star` `/handoff` `/contrarian` `/hygiene` slash commands wired
- Expo skeleton (`apps/native/`) booted with auth + read-only route view from existing worker
- Begin: iOS Share Extension paste flow

**90-day**
- iOS Share Extension shipping
- Shared client tour board v1 (web + iOS App Clip)
- Begin: voice annotation per property

**180-day**
- Voice annotation shipping
- LLM-drafted post-tour client recap
- Begin: CarPlay (apply for entitlement now), Apple Watch glance

Anything not in these → `memory-bank/ideas.md`.

---

## Repo Strategy

**No new repo.** Avoid second-system effect. Restructure in-place.

```
src/                      # existing RWSDK web app — UNCHANGED
apps/
  native/                 # new Expo app
packages/                 # shared TS code, added when both apps need it
memory-bank/              # session continuity files
.claude/commands/         # slash command definitions
```

Working code stays working. Web continues to deploy. Native grows alongside. Shared code (parsers, types) extracted to `packages/` only when both apps consume it — not preemptively.

---

## Architecture

- **Native-first** (Expo, iOS lead). Jane's primary surface.
- **RWSDK web** keeps: marketing, auth, shared client tour board, thin agent desktop view. NOT trying for parity with native.
- **Cloudflare backend (unchanged)**: Workers + Durable Objects (one DO per route, canonical realtime state), D1, R2 (voice/photos), Vectorize (preference embeddings), Workers AI Whisper, AI Gateway.
- **Expo + Cloudflare**: Expo is just the client. All CF resources reachable via fetch to your worker — Workers AI, DOs, R2, Vectorize, D1 callable. WebSocket from Expo to your DO works natively. Auth tokens via headers. R2 uploads via worker-issued presigned URLs. The only "loss" vs. web: no RSC patterns on native — that's normal for native apps.
- **Realtime**: WebSocket → DO. Native and web client share the same DO.
- **Auth**: Sign in with Apple (iOS, mandatory if any social), Google (Android), magic link universal fallback. Token verified server-side, session is same model on web + native.

---

## Expo Testing Workflow

- `cd apps/native && npx expo start` — dev server, hot reload like web.
- **Expo Go app** (free on App Store / Play Store) → scan QR → see your app on phone. Limited (no custom native modules). Great for early dev.
- **Development build** — custom build with native modules baked in, installed once on device/simulator, talks to your dev server. Required for Share Extension, custom audio sessions, etc. Build via `eas build --profile development`.
- **iOS Simulator** (Mac) and **Android Emulator** — viable for most testing. Some features (camera, push, share extension) need real device.
- **EAS Build** — cloud builds for production-shape apps. Free tier covers solo dev.
- **EAS Update** — OTA JS bundle updates without app store review. Ship fixes in minutes.
- Console logs go to dev-server terminal. React Native DevTools (separate from browser DevTools) for inspect.

Mental model: like web dev, but the "browser" is your phone or a simulator, and you need a one-time build step to install custom native modules.

---

## Multi-session Continuity

Long discussions break across sessions. The fix:

1. End every session with `/handoff` — agent writes state to `memory-bank/active-context.md` + appends to `memory-bank/progress.md`.
2. Start every session with `/north-star` — agent re-reads + summarizes current direction + last decisions + next 1–3 steps.
3. Use `/contrarian` periodically — agent re-evaluates the plan from a skeptical perspective, finds blind spots.
4. `/hygiene` before agent-driven work — confirms worktree, spec, demo script, acceptance criteria.

Cross-session context lives in `memory-bank/`, not in chat history.

---

## UI/UX Checkpoint Policy

The agent must NOT make UI/UX decisions unilaterally. Before any choice involving:
- Component layout / hierarchy
- Color, spacing, typography
- Interaction pattern (tap vs. long-press vs. swipe)
- Copy / microcopy
- New screen structure

→ pause, present 2–3 options with tradeoffs, wait for user pick.

Existing subagents (`design-consistency-guardian`, `rwsdk-patterns-guardian`) enforce conventions but do not invent new ones.

---

## Design Language

Comic 50s aesthetic → marketing, login, empty states only. **In-app: modern minimal.**

**North stars (look these up, screenshot them, steal patterns):**

- **Linear** (linear.app) — grayscale + single accent, hairline dividers, Cmd+K spine, optimistic UI. *Use for*: desktop pre-planning. Route = backlog. Properties = issues. Status pills.
- **Things** (culturedcode.com/things) — generous whitespace, typography-is-the-UI, Magic Plus drag-edge button, swipe gestures. *Use for*: in-field mobile UX. Big tap targets. One decision per screen.
- **Cron / Notion Calendar** (notion.com/product/calendar) — time as first-class object, drag-resize, multi-cal overlay. *Use for*: showing-window UI. Drag-within-window snapping.

**Pattern**: minimal chrome, hierarchy from typography not boxes, animation under 200ms, dark mode native.

**Component libs:**
- Web: shadcn/ui + Tailwind (bridge from existing Base UI in `src/app/components/ui/`)
- Native: **react-native-reusables** (shadcn-for-Expo) + **NativeWind** (Tailwind for RN)
- Shared Tailwind tokens in `packages/tokens` (when extracted) — single source of truth.

---

## Billing (Stripe + StoreKit via RevenueCat)

Decided 2026-04-27. Apple requires IAP for in-app digital goods; Stripe is fine on web. RevenueCat unifies both.

- **RevenueCat** as abstraction layer (already used in another Capacitor app — same dashboard, separate project/keys).
- **Web**: Stripe Checkout via `@revenuecat/purchases-js`.
- **iOS**: StoreKit via `react-native-purchases` Expo SDK.
- Single entitlement model (e.g. `pro`). RevenueCat webhook → worker → D1 (worker = source of truth, RC = cache/fallback).
- Free up to $2.5k MTR, then 1% of tracked revenue.
- **Lands in Phase 1 (auth)**: `Purchases.configure` at boot, `Purchases.logIn(userId)` in same callback as session set. No products defined yet — just SDK + dashboard shell.
- Products + paywall UI: deferred to a later phase (post-Phase-2, after read-only route view ships).

---

## Magic Link (auth)

Universal fallback. Critical for friction-free shared-tour-board access (clients shouldn't have to OAuth) and account recovery.

- User enters email → server signs short-lived URL → email it.
- Click → server verifies signature + expiry → set session cookie or JWT.
- Same backend endpoint serves web and native (deep link on native).
- ~150 LOC of glue. Stable maintenance: budget half a day every ~18 months.

---

## App Clip

iOS instant-launch (<10MB) version. Tap a link / scan QR → loads in 2s, no install.

Critical for shared client tour board: clients see route, ❤️ properties, drop links, voice annotate — zero install friction. Apple prompts full-app upgrade after use. Without it, you lose half your clients at "download our app."

Android equivalent: Instant Apps (less polished). iOS-first is right.

Shipped via Expo config plugin → separate bundle target sharing code with the main app.

---

## Slash Commands (in `.claude/commands/`)

- `/north-star` — agent re-reads pinned docs, summarizes direction + this week's focus + last decisions + next steps.
- `/handoff` — agent writes session state to `memory-bank/active-context.md` + appends to `memory-bank/progress.md`.
- `/contrarian` — agent argues against the current plan, finds blind spots, proposes alternatives.
- `/hygiene` — agent confirms worktree / spec / demo / acceptance criteria before any work.

Plus existing: `/ultrareview` (cloud branch review), `/loop`, `/schedule`, `/init`, `/security-review`, etc.

---

## Tracking ritual (lightweight)

Files in `memory-bank/`:
- `active-context.md` — where I left off, next 1–3 steps, blockers. Updated by `/handoff`.
- `progress.md` — append-only dated log. Updated by `/handoff`.
- `ideas.md` — parking lot. Triaged weekly.
- `expo-migration-plan.md` — the active spec for the Expo build-out.
- `<feature>.md` — written BEFORE agent kick-off. In-scope / out-of-scope explicit. Demo script.

**Friday 30-min review**: re-read NORTH_STAR.md, re-shuffle 60/90/180, triage `ideas.md`, close half-built tabs.

---

## Anti-sprawl rules

1. ONE primary feature per 60-day window. Everything else parked.
2. Demo-script before code. Can't write the demo aloud → not ready.
3. Slices, not layers. Feature end-to-end, ship, internal-use a week, then next.
4. Internal user (real RE agent friend) using it weekly inside 30 days of v1.
5. Time-box exploration: 1 day, then commit or park.
6. Every idea → `memory-bank/ideas.md`. Never in head, never in chat threads.
7. Commit before agent kicks off. Worktree per feature. Easy clawback via branch throwaway.
8. `/handoff` ends every session. `/north-star` starts every session. Non-negotiable.
