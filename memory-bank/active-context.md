# Active Context

Last updated: 2026-04-28

## Current focus

Dock-collapse refactor SHIPPED (smoke passed, 3 commits on `worktree-refactor+dock-collapse`, ready to merge into `ai-agent`). Two other worktrees still in flight: `refactor+homepage-decompose`, `expo-phase-0`.

## What was decided this session (2026-04-28)

- **dock-collapse executed via Ralph**: 3 epics poured (`routefast-mol-0xc` provider / `-cnr` cutover / `-kp9` verify), all CLOSED. Spec archived to `.choo-choo-ralph/archive/dock-collapse.spec.md`.
- **Provider design**: re-export `PrimaryAction`/`SecondaryAction`/`AgentIntegration` from `DockProvider.tsx`, no rename. Skipped `useOptionalDock` per YAGNI.
- **Always-mount provider**: gating only `<AgentDock />` on `showChat`, not the whole `<DockProvider>`, to avoid throw-if-no-provider edge case. Skipped useOptionalDock entirely.
- **Worktree branched off main, not ai-agent — Ralph caught it**. First iteration blocked. Fast-forwarded `worktree-refactor+dock-collapse` to `ai-agent` HEAD before re-running Ralph. **LEARNING for future worktrees**: when the spec assumes branch state beyond `main`, base the worktree on that branch, not from `main`.
- **rwsdk hydration trap (CRITICAL learning)**: `<div id="root">` is the only thing rwsdk hydrates. Sibling client components in `Document.tsx` (even inside `<div id="root">`) SSR but get NO React fibers — buttons render but `onClick` never fires. Fix: wrap routes with rwsdk's `layout(LayoutComponent, [routes])` from `rwsdk/router`. The layout (RSC) renders a `'use client'` wrapper that becomes part of the route's hydrated tree. Implemented as `src/app/ChatLayout.tsx` (RSC, reads `requestInfo.ctx.user`) → `src/app/ChatShell.tsx` (`"use client"`, providers + AgentDock).
- **`useFoo` hooks that throw on missing provider break rwsdk SSR pass for client subtrees** — provide a no-op default context value instead. Applied to `useDock`. (`useVoice` still throws — fix if it ever surfaces.)
- Logged [LEARNING] comment on `routefast-mol-kp9` for future Ralph harvest.

## Next steps (in order)

1. **Merge worktree → ai-agent + tear down**:
   ```bash
   cd /home/ptre/code/github/routefast
   git checkout ai-agent
   git merge --ff-only worktree-refactor+dock-collapse
   git worktree remove .claude/worktrees/refactor+dock-collapse
   git branch -d worktree-refactor+dock-collapse
   ```
2. **Pour remaining refactors**: convert `memory-bank/homepage-decompose.md` → Ralph spec → pour → run Ralph. Same flow for `expo-phase-0` (still no spec).
3. **Verify `useVoice` SSR safety** (preventive): same pattern as `useDock` — currently throws if no provider. Low priority since AgentDock is always inside VoiceProvider in ChatShell.

## Open questions

- Spec format: still no answer on Ralph spec vs memory-bank-draft for Phase 0 + remaining refactor.
- Add `.claude/scheduled_tasks.lock` and `.claude/worktrees/` to `.gitignore`?
- Pre-existing geocoding env type drift (`GOOGLE_MAPS_API_KEY` not in Env type) — still unresolved, blocks calculate-route end-to-end test in some envs.
- Cloudflare edge-preview API noise on `pnpm run dev` — harmless but distracting (separate from Wrangler login expiry).

## In-progress work

- **Worktree `refactor+dock-collapse`** (branch `worktree-refactor+dock-collapse`, HEAD `b3b9203`) — DONE, awaiting merge. 3 commits ahead of `ai-agent`: `cd96d98` provider, `6e8adba` collapse, `b3b9203` layout/SSR fix.
- **Worktree `refactor+homepage-decompose`** (branch `refactor/homepage-decompose`, HEAD `686289a`) — untouched this session.
- **Worktree `expo-phase-0`** (branch `worktree-expo-phase-0`, HEAD `d1e704f`) — untouched; no Ralph spec yet.

Reference docs (no edits needed):
- `memory-bank/inventory.md` — current-app audit
- `memory-bank/design-directions.md` — UI work
- `memory-bank/expo-migration-plan.md` — Phase 1 includes RevenueCat shell
- `.choo-choo-ralph/archive/dock-collapse.spec.md` — completed spec w/ poured bead IDs (for harvest reference)
