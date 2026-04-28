# Progress Log

Append-only. Newest at top. Read only the bottom (oldest) entries when archaeology needed.

---

## 2026-04-28 (night, Expo Phase 0 P1 land)

- **Phase 0 P1 (9 tasks) shipped** in `worktree-expo-phase-0`: tsconfig `@/*` alias, NativeWind v5 + Tailwind v4 stack, `metro.config.js` + `postcss.config.mjs` + `src/global.css`, `src/tw/{index,image,animated}.tsx`, env config + LAN auto-detect, `src/api/client.ts`, root Stack large-title, `app/index.tsx` Hello+health, README. Two commits: `d677b1b` (spec track), `34cbc8f` (feat).
- **lightningcss pin needed BOTH** root `pnpm.overrides` AND explicit `lightningcss@1.30.1` dep in `apps/native/package.json` — override alone didn't reach `react-native-css`'s auto-resolved peer.
- **LAN IP auto-detect** via `apps/native/scripts/detect-lan-ip.mjs` + `prestart` hook → `.env.development.local`. Picks first non-internal IPv4 (skipping docker/veth/tun).
- **Scaffold trimmed** to single Stack + Hello screen. `(tabs)/`, themed demos, modal, reset-project deleted. Phase 2 reintroduces tabs.
- **3 `@ts-expect-error`** added in `src/tw/{index,image}.tsx` for Reanimated deep-generic + `underlayColor` typing. `tsc --noEmit` passes.
- Phase 0 runtime gates remain: `CLOUDFLARE_ENV=staging pnpm release` (manual) + acceptance demo on phone (`mol-psu` bead).

---

## 2026-04-28 (late, Expo Phase 0 pour)

- **Expo Phase 0 spec authored** at `.choo-choo-ralph/expo-phase-0.spec.md` (14 tasks, iteration 1) — refined via Expo skills (NativeWind v5 + Tailwind v4 CSS-first, no babel for tailwind, lightningcss pin, `EXPO_PUBLIC_*` env, default template ships NativeTabs).
- **4 of 5 P0 beads poured + assigned ralph**: `mol-l6l` workspace, `mol-gll` scaffold, `mol-dga` worker-health, `mol-psu` acceptance. 5th bead (staging deploy) NOT poured — harness denied autonomous deploy; user runs manually.
- **3 of 4 poured beads CLOSED via ralph** before pause: `pnpm-workspace.yaml` shipped, `apps/native/` Expo template scaffolded, `route("/api/health", ...)` added at `src/worker.tsx:92`.
- **Acceptance bead (`mol-psu`) correctly recognizes prereqs unmet** — exits each iteration without claiming. Confirmed Ralph stop/resume preserves state on closed beads.
- **Pre-existing stale bead identified**: `routefast-mol-3lu` (homepage-decompose chain) `in_progress` w/ assignee `ralph-subagent-bearings` — staleness pattern user flagged. Left alone (out of Phase 0 scope).
- Skip decisions: react-native-reusables (defer Phase 2), `expo-constants` (use `EXPO_PUBLIC_*` instead).

---

## 2026-04-28 (PM, late)

- **Dock-collapse merged + pushed** to `ai-agent` (`1cf7878..d9d1e40`). Linear history: provider → collapse → rwsdk-layout fix.
- Two post-Ralph bugs fixed during browser smoke: (1) `useDock` hard-throw → no-op default context (rwsdk SSR pass for client subtrees breaks otherwise); (2) `<DockProvider>` in `Document.tsx` had no fibers — moved into `layout(ChatLayout, [routes])` from `rwsdk/router`. New: `src/app/ChatLayout.tsx` + `src/app/ChatShell.tsx`.
- Worktree `worktree-refactor+dock-collapse` torn down + branch deleted.
- rwsdk hydration trap captured as `[LEARNING]` on `routefast-mol-kp9` for harvest.

---

## 2026-04-28 (PM)

- **Homepage-decompose SHIPPED** on `refactor/homepage-decompose` (8 commits, awaiting demo gauntlet + merge). HomePage 530 → 80 lines.
- 6 Ralph beads CLOSED via `./ralph.sh`: `h7j` hook / `16q` dialogs / `pdq` banner / `jj0` planner / `7fg` results / `wc3` verify-trim. Spec archived.
- **Ralph crashed mid-verify-trim** ~21:08 — finished manually. State-prop pattern ralph wrote was reverted to focused props per spec (`93c889c`). Pure scope creep on `useHomePageState.ts` Type → `useDock()` swap deferred to dock-collapse integration.
- New: `pages/sections/{DemoImportBanner,HomePageDialogs,RoutePlannerSection,RouteResultsSection,useHomePageState}.tsx` + `utils/pasteFromClipboard.ts`.
- Drift commit `3fe1f2d` (`pnpm-workspace.yaml`) NOT scope creep — separately-poured P0 bead `routefast-mol-l6l` swept up by unfiltered ralph drain. Pending decision.
- Logged dock-collapse integration touchpoint as bead comments + persistent memory.

---

## 2026-04-28

- **Dock-collapse refactor SHIPPED** — bridge eliminated, single React tree, browser smoke passed.
- 3 Ralph epics CLOSED (`routefast-mol-0xc` DockProvider / `-cnr` atomic cutover / `-kp9` verify). Net −164 LOC across the cutover commit alone.
- 3 commits on `worktree-refactor+dock-collapse`: `cd96d98` provider, `6e8adba` collapse, `b3b9203` rwsdk-layout + SSR-safe useDock. Ready to fast-forward `ai-agent`.
- **Hydration learning**: rwsdk only hydrates `<div id="root">`'s page tree — siblings in `Document.tsx` get no fibers. Fix is `layout(ChatLayout, [routes])` from `rwsdk/router`. Logged as `[LEARNING]` on `routefast-mol-kp9`.
- Spec archived: `.choo-choo-ralph/archive/dock-collapse.spec.md` w/ poured bead IDs.
- New files: `src/app/ChatLayout.tsx` (RSC, reads ctx) + `src/app/ChatShell.tsx` (`"use client"`, providers + AgentDock).

---

## 2026-04-27

- **Billing decided**: Stripe (web) + StoreKit (iOS) via RevenueCat. Lands in Phase 1 alongside auth.
- Updated `NORTH_STAR.md` (new Billing section) + `expo-migration-plan.md` Phase 1 → "Auth + RevenueCat shell" (added SDK install, `Purchases.logIn`, webhook stub, web `@revenuecat/purchases-js`).
- Confirmed Expo Phase 0 can run in parallel with dock-collapse + homepage-decompose refactors.
- Spun up three worktrees: `expo-phase-0`, `refactor+dock-collapse`, `refactor+homepage-decompose`.
- Committed scaffolding to `ai-agent` as `74848df`: NORTH_STAR + memory-bank/* + slash commands (north-star/handoff/contrarian/hygiene/design-review) + routefast-inventory subagent + .claude/settings.json + beads sync. 18 files, 1497 insertions.
- Open: Ralph-spec vs memory-bank-draft format for Phase 0 + refactors. Add `.claude/worktrees/` + `scheduled_tasks.lock` to `.gitignore`?

---

## 2026-04-26 (PM)

- Ran `/design-review`. Picks: 1A mobile list / 2A Now-Next day-of / 3A desktop tri-column + Cmd+K.
- Wrote `memory-bank/design-directions.md` — picks reconciled w/ Expo Router primitives (Stack `headerLargeTitle`, `formSheet`, SF Symbols via `expo-image`, `Link.Menu` over swipe). Explicit v1 cut-line + side-panel autopsy.
- Cascade-conflict UI flagged as load-bearing (NOT parked) — the timing-correctness story.
- Expanded `memory-bank/ideas.md` parking lot: pre-flight checklist, templates, route variations, showing-window hatched bands, visible undo stack, extended status pills, map-as-primary, Cmd+K-as-search.
- Resolved design-system open question in `active-context.md`.

---

## 2026-04-26

- Created `NORTH_STAR.md` — project vision, unfair advantages, 60/90/180, architecture, Expo testing notes, UI/UX checkpoint policy.
- Web-searched current agentic-flow tracking practices (April 2026) — confirmed memory bank + spec-driven + worktree isolation are mainstream.
- Decided: no new repo, in-place monorepo additions (`apps/native/`, `packages/`).
- Created `memory-bank/` with active-context, progress, ideas, expo-migration-plan.
- Created `.claude/commands/` with `/north-star`, `/handoff`, `/contrarian`, `/hygiene`.
- Updated `CLAUDE.md` with session hygiene + memory bank reading order + UI/UX checkpoint policy.
- No code changes to existing app.
