# Active Context

Last updated: 2026-04-27

## Current focus

Design directions locked for Expo v1. Next: pre-Phase-0 web refactors (dock-collapse → homepage-decompose), then Expo Phase 0.

## What was decided this session (2026-04-27)

- **Billing**: Stripe (web) + StoreKit (iOS) via **RevenueCat**. Free <$2.5k MTR then 1%. RC dashboard = separate project from existing Capacitor app, shared account. Lands in **Phase 1 (auth)** — SDK wired + `Purchases.logIn` in auth callback + webhook stub. No products defined yet. Paywall UI deferred to post-Phase-2. Recorded in `NORTH_STAR.md` (new "Billing" section) + `expo-migration-plan.md` Phase 1.
- **Expo parallelism**: Phase 0 can run alongside in-progress dock-collapse + homepage-decompose refactors. Phase 0 only touches new `apps/native/` + uses existing worker endpoints. Rebase Expo work later if refactors expose shared types/server-fns.

## What was decided previously

- `/design-review` run. Picks saved to `memory-bank/design-directions.md`.
- **Surface 1 (mobile planning)**: Direction 1A — Things-spine + Cron time-gutter + Linear status pills. One list, no side panel.
- **Surface 2 (mobile day-of)**: Direction 2A — Now/Next stack. Voice mic = placeholder for v1 ("Add note" → text formSheet); architect now, ship voice later.
- **Surface 3 (desktop)**: Direction 3A — Linear tri-column (Routes / Properties / Detail) + Cmd+K paste. Kill phone-shim.
- **Cascade-conflict UI is load-bearing, NOT parked** — inline red gutter rule + single-tap fix when lock + travel break a downstream time. This IS the timing-correctness story Jane asked for.
- **Status pills**: `unconfirmed` + `locked` only for v1; default state has no pill (Linear discipline). `geocoded`/`scouted`/etc. parked.
- **Side-panel autopsy**: failed because it forced two mental models (palette vs route). Mobile resolution = transient bottom sheet for paste. Desktop future = inline list w/ "pending" zone.
- **Expo primitive mapping done** (in `design-directions.md`): Stack `headerLargeTitle` for route name, `formSheet` w/ `sheetAllowedDetents` for paste + duration edit, SF Symbols via `expo-image source="sf:..."`, `Link.Menu` for context actions over swipe (v1 a11y), `expo-haptics` on lock + reflow.
- **Capabilities parking lot expanded** in `ideas.md`: pre-flight checklist, templates, route variations, showing-window hatched bands, visible undo stack, extended status pills, map-as-primary-surface, Cmd+K-as-search.

## Next steps (in order)

**Pre-Phase-0 web-side refactors** (BEFORE native — inventory flagged as blockers):

1. **`memory-bank/dock-collapse.md`** — collapse dock-bridge `window`-event pub/sub into single React tree w/ Context. No native analog. Pure web refactor, no behavior change. Worktree: `git worktree add .claude/worktrees/dock-collapse -b refactor/dock-collapse`.
2. **`memory-bank/homepage-decompose.md`** — split 530-line `HomePage.tsx` into orchestrator + sections (≤80 + ≤200 lines each). Pure refactor. Do AFTER dock-collapse. Worktree: `.claude/worktrees/homepage-decompose -b refactor/homepage-decompose`.
3. **Expo Phase 0** per `memory-bank/expo-migration-plan.md`. `/hygiene` first. Worktree: `git worktree add .claude/worktrees/expo-phase-0 -b expo/phase-0`. Acceptance: phone shows app via Expo Go, hot-reload works, fetch to `/api/health` returns 200.

Note on doc placement (per CLAUDE.md update): `dock-collapse.md` and `homepage-decompose.md` may need conversion to `.choo-choo-ralph/<name>.spec.md` format if executed via Ralph. Current memory-bank versions are drafts/staging — confirm w/ user before pouring beads.

## Open questions

- Timing: when does the first real RE-agent friend start using v1?
- Stripe/IAP: iOS in-app purchase vs web Stripe — concrete plan needed before Expo Phase 1 (auth).
- `/share` page is a stub — drop it or build it before native scope is set?
- Property/Route data is JSON-in-TEXT in D1 — schema change needed before search/filter work.
- Should `dock-collapse.md` + `homepage-decompose.md` be converted to Ralph specs (`.choo-choo-ralph/`) before execution, or kept as memory-bank drafts?

## In-progress work

None. Queued specs:
- `memory-bank/dock-collapse.md` (do first)
- `memory-bank/homepage-decompose.md` (do second)
- `memory-bank/inventory.md` (reference for both, written 2026-04-26)
- `memory-bank/design-directions.md` (reference for all UI work going forward)
