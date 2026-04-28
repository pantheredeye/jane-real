# Active Context

Last updated: 2026-04-28 (late)

## Current focus

Homepage-decompose SHIPPED to `ai-agent` (HEAD `2b35474`, pushed). Expo Phase 0 code complete in worktree from prior session, awaiting staging deploy + phone acceptance. Phase 1 (auth + RevenueCat) is the next pour.

## What was decided this session (2026-04-28, late)

- **Homepage-decompose merged + pushed**: cherry-picked squashed final state onto `ai-agent` (`1a11dcc` → `2b35474`). `d9d1e40..2b35474` on origin.
- **Rebase strategy**: created throwaway `refactor/homepage-decompose-rebased` from `origin/ai-agent`, overlaid section files from `93c889c`, swapped `setAgentIntegration`/`EVT_REQUEST_STATE` → `useDock().setIntegration` in `useHomePageState.ts`. Single squashed commit instead of 8-commit rebase (avoids 3 conflict resolutions).
- **Sections refactored to focused props** before merge — ralph's whole-state-prop pattern reverted per spec intent (Expo portability). `pasteFromClipboard.ts` util + useHomePageState trim kept. Final caps: HomePage 80, useHomePageState 144, sections ≤115. Types clean.
- **Demo gauntlet partial**: flows 1–8 (incl. flow 4 add-via-agent, the rebase-critical path) all passed in dev. Flows 9–17 blocked by pre-existing `GOOGLE_MAPS_API_KEY_SERVER` env drift — accepted out-of-scope (rebase didn't touch calculation path).
- **Worktree torn down**, branches `refactor/homepage-decompose` + `refactor/homepage-decompose-rebased` deleted. Original 8-commit branch preserved as audit trail until final cleanup.
- **`pnpm-workspace.yaml` carried forward** in `2b35474` — drift commit from earlier ralph drain (sweep of separately-poured P0 bead `routefast-mol-l6l`). Dangling until `apps/native/` lands.
- **dock-collapse integration touchpoint RESOLVED** in `2b35474` — `useHomePageState.ts` now uses `useDock()`. Persistent memory note `project_homepage_decompose_dock_integration.md` is historical now.
- Spec archived: `.choo-choo-ralph/archive/homepage-decompose.spec.md` (untracked).

## Next steps (in order)

1. **Resume Expo Phase 0 acceptance** (from prior session — unchanged):
   - Manual staging deploy: `cd /home/ptre/code/github/routefast && CLOUDFLARE_ENV=staging pnpm release`
   - Capture URL → `apps/native/.env.production` `EXPO_PUBLIC_API_URL=...`
   - Phone acceptance for bead `routefast-mol-psu`: `cd .claude/worktrees/expo-phase-0/apps/native && pnpm start`, scan QR, walk acceptance criteria a–e.
   - Merge `worktree-expo-phase-0` → `main` once green.
2. **Spec + pour Phase 1**: auth (Apple / Google / magic-link) + RevenueCat `Purchases.configure` boot. See NORTH_STAR.md Billing + Magic Link sections. New worktree per spec convention.
3. **Resolve stale bead** `routefast-mol-3lu` (orphaned bearings step of wc3 — completed manually): `bd close --reason superseded`.
4. **Geocoding env drift fix** (separate): `GOOGLE_MAPS_API_KEY_SERVER` not in Env type. Blocks calc-route + flows 9–17 of homepage-decompose gauntlet. Low-priority; pre-existing.

## Open questions

- LAN IP detect (Phase 0): robust enough or want manual override flag?
- `.env.production` URL — document format in `.env.example` or keep placeholder?
- `.claude/scheduled_tasks.lock` and `.claude/worktrees/` — add to `.gitignore`?
- Phase 1 kickoff: spec auth flow before pouring? Combine RevenueCat scaffold or separate spec?
- `pnpm-workspace.yaml` — keep on `ai-agent` now or revert until Phase 0 lands `apps/native/`?

## In-progress work

- **`ai-agent`** (HEAD `2b35474`, pushed) — homepage-decompose + memory-bank session-save merged. Clean.
- **Worktree `expo-phase-0`** (branch `worktree-expo-phase-0`, HEAD `34cbc8f`) — code complete, runtime gates pending. Spec `.choo-choo-ralph/expo-phase-0.spec.md` has open `<review>` blocks; bead `routefast-mol-psu` OPEN.
  - Path: `.claude/worktrees/expo-phase-0/`
  - Files of note: `apps/native/{metro.config.js,postcss.config.mjs,scripts/detect-lan-ip.mjs}`, `apps/native/src/{global.css,tw/,api/client.ts}`, `apps/native/app/{_layout.tsx,index.tsx}`, `apps/native/types/env.d.ts`.
- **Worktree `refactor+homepage-decompose`** — REMOVED.

Reference docs:
- `.choo-choo-ralph/expo-phase-0.spec.md` (active)
- `.choo-choo-ralph/archive/{ai-agent,use-server,dock-collapse,homepage-decompose}.spec.md`
- `memory-bank/{inventory,design-directions,expo-migration-plan}.md`
- Persistent memory: `project_homepage_decompose_dock_integration.md` — touchpoint resolved.
