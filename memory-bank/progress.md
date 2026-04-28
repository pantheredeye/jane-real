# Progress Log

Append-only. Newest at top. Read only the bottom (oldest) entries when archaeology needed.

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
