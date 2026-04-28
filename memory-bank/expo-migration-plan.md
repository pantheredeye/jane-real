# Expo Migration Plan

Phased. Each phase: goal, out-of-scope, tasks, acceptance, demo, UI/UX checkpoints.

Status: Phase 0 in progress (worktree `expo-phase-0`).

**Operating rules**:
- One phase active at a time. Worktree per phase: `.claude/worktrees/expo-phase-N`.
- `/hygiene` before any phase kick-off.
- `/handoff` at session end inside any phase.
- UI/UX checkpoints HALT the agent — wait for user pick before continuing.
- Demo script must run cleanly before phase is "done."

---

## Foundations & Modern-Path Defaults

These apply to every phase. Set up at Phase 0; never deviate. No patching later — these are why we're doing greenfield instead of porting RWSDK patterns.

**Build & runtime**
- Expo SDK 55+. New Architecture default — don't set `newArchEnabled` (removed).
- React 19 idioms: `React.use()` not `useContext`; `<Context>` not `<Context.Provider>`; ref-as-prop, no `forwardRef`.
- React Compiler on (`experiments.reactCompiler: true`). No manual `useMemo` / `useCallback` discipline.
- `expo-router` typed routes on (`experiments.typedRoutes: true`).
- `app.config.ts` not `app.json` (TS = type checks + comments).
- TypeScript path aliases (`@/*` → `apps/native/src/*`). No relative imports across feature dirs.
- Kebab-case filenames (`property-card.tsx`).
- Routes in `app/` only. Components / utils / types live in `apps/native/src/` — never co-located in `app/`.

**Workflow**
- **Dev client from day zero.** Expo Go is for curiosity, not the workflow.
- `eas.json` with `development` + `production` profiles. `appVersionSource: "remote"`. `developmentClient: true` on dev profile.
- EAS Update channels (`development`, `production`) configured at Phase 0 — OTA JS fixes ship without rebuild.
- EAS Workflows YAML (`.eas/workflows/`) when production-ready. Deferred.

**UI primitives**
- `<NativeTabs>` SDK 55 API: `NativeTabs.Trigger` w/ child `<Icon sf="..." />` + `<Label />`. `role="search"` for search tabs.
- `<Stack>` w/ `headerLargeTitle: true` + `headerTransparent: true` for Things-style large titles.
- Form sheets via `presentation: "formSheet"` + `sheetGrabberVisible` + `sheetAllowedDetents`. `contentStyle.backgroundColor: "transparent"` → liquid glass on iOS 26+.
- `<Link.Preview>` + `<Link.Menu>` for context menus everywhere — matches `design-directions.md` 1A pick.
- `expo-image` w/ `source="sf:name"` for ALL icons. Not `@expo/vector-icons`. Not `expo-symbols`.
- `expo-glass-effect` for liquid glass backdrops.
- `ScrollView` / `FlatList` w/ `contentInsetAdjustmentBehavior="automatic"`. Not `<SafeAreaView>`.
- `react-native-safe-area-context` not RN's SafeAreaView.

**Data & state**
- `expo-secure-store` for session/auth tokens.
- `expo-sqlite` (and `expo-sqlite/localStorage/install` for k/v) — never AsyncStorage.
- React Query for server state + optimistic UI.

**Native modules**
- `expo-audio` (not `expo-av` — deprecated). `useAudioRecorder` / `useAudioPlayer`.
- `expo-video` (not `expo-av`).
- `expo-haptics` conditionally on iOS.
- `react-native-reanimated` (4) + `react-native-worklets` (mandatory since SDK 54) + `react-native-gesture-handler`.

**Apple targets (Phase 4 + 7)**
- `@bacons/apple-targets` config plugin — author Swift targets in-repo (`apps/native/targets/<name>/`), plugin wires them into the Xcode project at prebuild.
- One plugin covers Share Extension + App Clip + future Widgets / Watch.
- App groups (`group.com.routefast.shared`) for cross-target data sharing.

**Web bridge**
- `@revenuecat/purchases-js` on RWSDK web side — same RC project as native.
- Magic-link verifies via universal links (associated domains entitlement set up alongside Apple targets).

**Styling**
- NativeWind 5 (Tailwind v4 for RN). `react-native-reusables` (shadcn-for-Expo) for primitives.
- CSS `boxShadow` style prop — never legacy RN shadow / elevation.
- `borderCurve: 'continuous'` on rounded corners.
- Flex `gap` over margin / padding. Inline styles unless reused.

**Code idioms**
- `process.env.EXPO_OS` not `Platform.OS`.
- `useWindowDimensions` not `Dimensions.get()`.
- `<Text selectable />` on data / error text.
- `fontVariant: 'tabular-nums'` on counters.

---

## Phase 0 — Foundations (~1.5 days)

**Goal**: dev client installed on phone, talks to existing worker, all modern-path defaults wired. EAS Update OTA loop proven.

**Out of scope**: auth, real screens, real data.

**Tasks**:
- `npx create-expo-app apps/native -t default` (Expo Router + TypeScript template, SDK 55+).
- Replace generated `app.json` with `app.config.ts`. Set `experiments.reactCompiler: true`, `experiments.typedRoutes: true`. Bundle id, scheme, slug.
- `tsconfig.json` path aliases (`@/*` → `src/*`).
- Install: `nativewind` + `tailwindcss` + `react-native-reanimated` + `react-native-worklets` + `react-native-gesture-handler` + `expo-image` + `expo-haptics` + `expo-secure-store` + `react-native-safe-area-context` + `expo-dev-client`.
- Configure NativeWind v5 (Tailwind v4) per `expo:expo-tailwind-setup` skill.
- `expo-constants` env-var fetch wrapper pointing at existing worker URL.
- `eas.json` w/ `development` + `production` profiles, `appVersionSource: "remote"`, `developmentClient: true` on dev profile.
- `eas init` → first dev-client build via `eas build -p ios --profile development` (cloud) OR `--local` if Mac+Xcode ready.
- Install dev client on iPhone (TestFlight or direct), `npx expo start --dev-client`, scan QR.
- `eas update:configure`, channel `development` connected to dev profile.
- One Stack screen w/ `headerLargeTitle: true` rendering "Hello RouteFast", styled via NativeWind.
- `apps/native/README.md` w/ run commands + dev-client install steps.

**Acceptance**: dev client on phone, hot-reload works, `/api/health` fetch returns 200, `eas update --branch development` ships a JS-only change without rebuild.

**Demo**: "I open my dev client, see the app, edit a string, see it update on phone. Then I push an `eas update`, kill app, relaunch, see the OTA change."

**UI/UX checkpoints**: app icon? (defer). splash color? (defer, neutral).

---

## Phase 1 — Auth + RevenueCat shell (~2–3 days)

**Goal**: Jane signs in via Sign in with Apple on iOS; magic link as fallback. RevenueCat SDK wired (no products yet).

**Out of scope**: Google sign-in (Android-first feature, defer to Phase 1.5), passkey, paywall UI, product definitions.

**Note**: dev client already in place from Phase 0. RC + Apple Auth slot in via config plugins, no new build setup.

**Tasks**:
- `expo-apple-authentication` install + iOS capability via config plugin.
- Server endpoints: `POST /auth/apple` (verifies Apple identity token, finds-or-creates user, returns session JWT) + `POST /auth/magic-link/request` + `GET /auth/magic-link/verify`.
- Native auth state: Zustand or React Query + session in `expo-secure-store`.
- Login screen — "Sign in with Apple" + "Email me a link" fallback. Stack w/ `headerLargeTitle` for brand row, form sheet for magic-link entry.
- Auto-redirect on auth state via `expo-router` redirect.
- **RevenueCat**: create RC project (separate from Capacitor app, shared account). Install `react-native-purchases` Expo SDK (config plugin handles iOS capability). `Purchases.configure({ apiKey })` at app boot. `Purchases.logIn(userId)` in auth callback alongside session set. Webhook stub on worker (`POST /webhooks/revenuecat`) — accepts payload, logs only.
- Web side: install `@revenuecat/purchases-js`, configure with same RC project, web API key.
- Universal links: associated domains entitlement set up now (used for magic-link deep linking + future tour-board App Clip).

**Acceptance**: cold-launch → tap Apple → land on home with valid session. Kill app, relaunch → still signed in. RC dashboard shows the user as identified after first sign-in. Magic-link email click opens app via universal link.

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
- `<NativeTabs>` shell (SDK 55 API): Routes / Search (`role="search"`) / Profile.
- `<Stack>` inside each tab w/ `headerLargeTitle: true` + `headerTransparent: true`.
- Route list: `FlatList` w/ `contentInsetAdjustmentBehavior="automatic"`.
- Route detail: property list (Things-style typography-driven) + map below.
- Property rows wrapped in `<Link>` w/ `<Link.Preview>` + `<Link.Menu>` (modern context-menu, replaces swipe per `design-directions.md`).
- Native map view via `react-native-maps` showing route line + numbered pins.
- All icons via `expo-image` `source="sf:..."`.

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
- Native paste UI: form sheet route (`presentation: "formSheet"`, `sheetGrabberVisible: true`, `sheetAllowedDetents: [0.5, 1.0]`, transparent content style for liquid glass on iOS 26+).
- "Add" button, optimistic insert via React Query.

**Acceptance**: paste a Zillow URL on native → property appears in route < 2s.

**Demo**: "I paste a Zillow link from clipboard, the property is in the route."

**UI/UX checkpoints**:
- **PAUSE**: form-sheet detent — half + full, or single? Header w/ paste field vs. separate paste action?

---

## Phase 4 — iOS Share Extension (~3–5 days)

**Goal**: Jane shares a Zillow URL from Messages → it lands on a route in RouteFast.

**Tasks**:
- `@bacons/apple-targets` config plugin install. Author Share Extension as Swift target inside `apps/native/targets/share-extension/`.
- App group entitlement (`group.com.routefast.shared`) on both main app + extension target.
- Extension UI: "Add to: [Today's Route ▼] [Add]" — Swift + SwiftUI inside the target.
- Background fetch through worker to enrich + add property.
- Main app picks up new state via app-group hand-off + universal-link open.
- Rebuild dev client w/ new target → test on real device (simulator share-sheet from Messages doesn't surface extensions reliably).

**Acceptance**: from Messages, long-press a Zillow URL → Share → "RouteFast" → property added → open app, see it on the route.

**Demo**: "I receive a text with a Zillow link, share it to RouteFast from Messages, open the app, it's on my route."

**UI/UX checkpoints**:
- **PAUSE**: extension UI — minimal "added!" toast vs. full picker for which route?

---

## Phase 5 — Editing: durations, locks, reorder (~5–7 days)

**Goal**: Jane edits route entirely on phone — change duration, lock a time, drag-reorder.

**Tasks**:
- Editable duration per property — Cron-style time picker via `@react-native-community/datetimepicker`.
- Lock toggle per property time. Cascade reflow on change.
- Drag-reorder via `react-native-reanimated` (4) + `react-native-worklets` + `react-native-gesture-handler`. Layout animations for reflow.
- React Compiler handles drag-perf memoization automatically.
- Re-optimize call to existing server function on edit. Optimistic UI via React Query.

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
- `@bacons/apple-targets` — add App Clip target alongside existing Share Extension target. Same plugin, no new tooling.
- App Clip routes to a stripped client view (no agent features).
- Server: configure `.well-known/apple-app-site-association` w/ `appclips` block.
- Smart App Banner on web `/tour/:token` so iOS visitors get prompted.

**Acceptance**: from a fresh iPhone (no app installed), tap share link → App Clip card → tap → see route in <3s.

**Demo**: "I uninstall RouteFast, tap a tour link, see the App Clip card, tap it, see the tour."

**UI/UX checkpoints**:
- **PAUSE**: App Clip first-load screen — what's most important to see in <3s?

---

## Phase 8 — Voice annotation (~5–7 days)

**Goal**: Press-and-hold per property → record → transcribe → structure.

**Tasks**:
- `expo-audio` install (NOT `expo-av` — deprecated). `useAudioRecorder` hook for press-and-hold capture.
- Audio session config via `expo-audio`.
- Press-and-hold mic on each property card. Recording state visualized w/ Reanimated.
- Upload to R2 via worker presigned URL.
- Workers AI Whisper transcription job.
- LLM (via AI Gateway → Anthropic) structures transcript into liked / disliked / follow-up / private buckets.
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
- Drafts email: per-property liked / disliked + photos + suggested next steps.
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
