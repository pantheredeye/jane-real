# Expo Migration Plan

Phased. Each phase: goal, out-of-scope, tasks, acceptance, demo, UI/UX checkpoints.

Status: not started. Phase 0 next.

**Operating rules**:
- One phase active at a time. Worktree per phase: `.claude/worktrees/expo-phase-N`.
- `/hygiene` before any phase kick-off.
- `/handoff` at session end inside any phase.
- UI/UX checkpoints HALT the agent — wait for user pick before continuing.
- Demo script must run cleanly before phase is "done."

---

## Phase 0 — Foundations (~1 day)

**Goal**: Empty Expo skeleton boots in `apps/native/`, talks to existing Cloudflare worker.

**Out of scope**: auth, real screens, real data.

**Tasks**:
- Create `apps/native/` via `npx create-expo-app` (Expo Router template, TypeScript).
- Add NativeWind. Configure Tailwind. Confirm a styled `<View>` renders.
- Add fetch wrapper pointing at existing worker URL (env var via `expo-constants`).
- Verify dev: `cd apps/native && npx expo start`, scan QR with Expo Go on iPhone, see "Hello RouteFast" screen.
- Add `apps/native/README.md` with run commands.

**Acceptance**: phone shows app via Expo Go, hot-reload works, fetch to existing worker `/api/health` returns 200.

**Demo**: "I open Expo Go, scan QR, see the app, edit a string, see it update on phone."

**UI/UX checkpoints**: app icon? (defer). splash color? (defer, neutral).

---

## Phase 1 — Auth + RevenueCat shell (~2–3 days)

**Goal**: Jane signs in via Sign in with Apple on iOS; magic link as fallback. RevenueCat SDK wired (no products yet).

**Out of scope**: Google sign-in (Android-first feature, defer to Phase 1.5), passkey, paywall UI, product definitions.

**Tasks**:
- `expo-apple-authentication` install + iOS capability config.
- Server endpoints: `POST /auth/apple` (verifies Apple identity token, finds-or-creates user, returns session JWT) + `POST /auth/magic-link/request` + `GET /auth/magic-link/verify`.
- Native auth state store (Zustand or React Query) + session in `expo-secure-store`.
- Login screen — single tap "Sign in with Apple" + "Email me a link" fallback.
- Auto-redirect on auth state.
- **RevenueCat**: create RC project (separate from Capacitor app, shared account). Install `react-native-purchases` + Expo config plugin. `Purchases.configure({ apiKey })` at app boot. `Purchases.logIn(userId)` in auth callback alongside session set. Webhook endpoint stub on worker (`POST /webhooks/revenuecat`) — accepts payload, logs only for now.
- Web side: install `@revenuecat/purchases-js`, configure with same RC project, web API key.

**Acceptance**: cold-launch → tap Apple → land on home with valid session. Kill app, relaunch → still signed in. RC dashboard shows the user as identified after first sign-in.

**Demo**: "I tap Sign in with Apple, see Face ID prompt, land on home."

**UI/UX checkpoints**:
- **PAUSE**: login screen layout — full-bleed brand vs. minimal?
- **PAUSE**: magic-link email copy + branding?

---

## Phase 2 — Read-only route view (~3–5 days)

**Goal**: Existing routes render natively. Tap a route → see properties + ETAs.

**Out of scope**: editing, voice, sharing.

**Tasks**:
- Server endpoints: `GET /api/routes` (list), `GET /api/routes/:id` (detail).
- Native screens: route list + route detail.
- Native map view (`react-native-maps`) showing route line + numbered pins.
- Property list (Things-style — typography-driven, swipe affordances visible).

**Acceptance**: route created on web appears on native, with map + property list + ETAs matching web.

**Demo**: "I create a route on web, open the app, see the same route with map."

**UI/UX checkpoints**:
- **PAUSE**: route list cell layout — what info per row?
- **PAUSE**: property list item — Things vs. Linear vs. hybrid? (3 mocked options)
- **PAUSE**: map style — vanilla Apple Maps vs. custom style?

---

## Phase 3 — Add property via paste (~2 days)

**Goal**: Jane pastes a Zillow URL or address, property added to route.

**Tasks**:
- Extract `parsePropertyInput` + URL parsers from `src/addons/route-calculator/utils/` into `packages/parsers/`.
- Web app + native app both consume `packages/parsers/`.
- Native: paste field on route detail screen, "Add" button, optimistic insert.

**Acceptance**: paste a Zillow URL on native → property appears in route < 2s.

**Demo**: "I paste a Zillow link from clipboard, the property is in the route."

**UI/UX checkpoints**:
- **PAUSE**: paste UI placement — bottom sheet, inline header field, FAB?

---

## Phase 4 — iOS Share Extension (~3–5 days)

**Goal**: Jane shares a Zillow URL from Messages → it lands on a route in RouteFast.

**Tasks**:
- Add Share Extension target via Expo config plugin (`expo-share-extension` or custom).
- Extension UI: "Add to: [Today's Route ▼] [Add]".
- Background fetch through worker to enrich + add property.
- App receives deep-link / open with new state.
- Requires development build (Expo Go won't work).

**Acceptance**: from Messages, long-press a Zillow URL → Share → "RouteFast" → property added → open app, see it on the route.

**Demo**: "I receive a text with a Zillow link, share it to RouteFast from Messages, open the app, it's on my route."

**UI/UX checkpoints**:
- **PAUSE**: extension UI — minimal "added!" toast vs. full picker for which route?

---

## Phase 5 — Editing: durations, locks, reorder (~5–7 days)

**Goal**: Jane edits route entirely on phone — change duration, lock a time, drag-reorder.

**Tasks**:
- Editable duration per property (Cron-style time picker).
- Lock toggle per property time. Cascade reflow on change.
- Drag-reorder via `react-native-reanimated` + `react-native-gesture-handler`.
- Re-optimize call to existing server function on edit.

**Acceptance**: make 3 edits on phone, route reflows correctly, persists to backend.

**Demo**: "I drag property B to first position, lock its time at 11am, see the rest reflow."

**UI/UX checkpoints**:
- **PAUSE**: lock affordance — icon, color, copy?
- **PAUSE**: drag handle visibility — always vs. on edit-mode?

---

## Phase 6 — Shared client tour board, web first (~5–7 days)

**Goal**: Jane shares a link with client; client sees route in browser without installing.

**Tasks**:
- Per-route share token (signed, expirable).
- RWSDK web route `/tour/:token` rendering route + properties.
- Token = auth (no email needed for client).
- Realtime via DO WebSocket: agent edits → client view updates live.
- Client-side: ❤️ button per property, "Add a property" paste field that goes to agent's pending pile.

**Acceptance**: send share link from native to a test phone in browser, see live updates from agent edits.

**Demo**: "I send the link via Messages, client opens it on their phone, hearts a property, I see the heart on my native app."

**UI/UX checkpoints**:
- **PAUSE**: client view layout vs. agent view — single design or two?
- **PAUSE**: agent-side pending-pile UX — separate tab, banner, modal?

---

## Phase 7 — App Clip for client tour board (~3 days)

**Goal**: Client taps share link → App Clip opens in 2s, no install.

**Tasks**:
- Add App Clip target via Expo config plugin.
- App Clip routes to a stripped client view (no agent features).
- Server: configure App Clip association file.
- Smart App Banner on web `/tour/:token` so iOS visitors get prompted.

**Acceptance**: from a fresh iPhone (no app installed), tap share link → App Clip card → tap → see route in <3s.

**Demo**: "I uninstall RouteFast, tap a tour link, see the App Clip card, tap it, see the tour."

**UI/UX checkpoints**:
- **PAUSE**: App Clip first-load screen — what's most important to see in <3s?

---

## Phase 8 — Voice annotation (~5–7 days)

**Goal**: Press-and-hold per property → record → transcribe → structure.

**Tasks**:
- `expo-av` install, audio session config.
- Press-and-hold mic on each property card.
- Upload to R2 via worker presigned URL.
- Workers AI Whisper transcription job.
- LLM (via AI Gateway → Anthropic) structures transcript into liked/disliked/follow-up/private buckets.
- Render structured notes back on property card.

**Acceptance**: hold mic on a property, speak 10s, see transcribed + structured notes within 5s.

**Demo**: "I press mic on 123 Oak, say 'great kitchen, basement smells funny, ask seller about HVAC age', see structured notes appear."

**UI/UX checkpoints**:
- **PAUSE**: press-and-hold UI affordance + recording state visualization?
- **PAUSE**: how notes render after structuring — list, columns, badges?

---

## Phase 9 — Post-tour recap (~3 days)

**Goal**: End of tour, draft email to client with structured recap.

**Tasks**:
- "End tour" button → triggers LLM agent.
- Agent reads all property notes for the route, photos, ETAs.
- Drafts email: per-property liked/disliked + photos + suggested next steps.
- Open native `mailto:` with body pre-filled, or send via SendGrid via worker.

**Acceptance**: end a tour with notes on 4 properties, see draft email with all 4 summarized.

**Demo**: "I tap End Tour, see a draft email to my client with each property summarized."

**UI/UX checkpoints**:
- **PAUSE**: email format — plain prose vs. structured headers vs. bullet points?
- **PAUSE**: send via mailto vs. send-from-RouteFast?

---

## After Phase 9

Re-read `NORTH_STAR.md`. The 60/90/180 should have shifted. Pick the next big arc (CarPlay, Watch, calendar, Twilio inbound, etc.) based on what users actually want.

`/contrarian` here. Stress-test before committing to the next arc.
