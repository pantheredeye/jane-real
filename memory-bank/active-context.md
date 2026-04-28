# Active Context

Last updated: 2026-04-28 (night)

## Current focus

Expo Phase 0 code COMPLETE. Two runtime gates left: manual staging deploy + acceptance demo on phone. Then Phase 1 (auth + RevenueCat boot).

## What was decided this session (2026-04-28, night)

- **Phase 0 P1 tasks all done** in worktree `expo-phase-0` (branch `worktree-expo-phase-0`). Two new commits on top of prior P0 work:
  - `d677b1b` chore(ralph): track expo-phase-0 spec
  - `34cbc8f` feat(native): NativeWind v5, env+api client, Hello+health screen
- **Scaffold trimmed** — deleted `(tabs)/`, themed nav demo files, `modal.tsx`, `parallax-scroll-view`, `hello-wave`, etc. Single Stack screen per spec ("don't add second tab in Phase 0"). Will re-introduce tabs in Phase 2 with proper structure.
- **`lightningcss` pin required two places**: root `pnpm.overrides` AND explicit `lightningcss@1.30.1` dep in `apps/native/package.json`. Override alone didn't satisfy `react-native-css`'s auto-resolved peer (pnpm injected 1.32.0 nested under it). Adding it as a direct dep let pnpm dedupe.
- **LAN IP auto-detect** approach (user request): `apps/native/scripts/detect-lan-ip.mjs` writes `.env.development.local` from active `wlp*`/`eth*` IPv4. `prestart`/`preandroid`/`preios` hooks invoke it. Expo loads `.env.{ENV}.local` with highest priority.
- **3 `@ts-expect-error` lines** in `src/tw/{index,image}.tsx` for Reanimated deep-generic explosion. Recipe verbatim from `expo:expo-tailwind-setup` wouldn't pass strict tsc; minimal escape hatches added at `useCssElement(Animated.ScrollView, ...)` + `useCssElement(CSSImage, ...)` + `underlayColor` cast.
- **`tsc --noEmit` clean** in `apps/native/`.
- **Ralph archive folder**: `.choo-choo-ralph/archive/` was already tracked (committed in earlier wip). Only `.choo-choo-ralph/expo-phase-0.spec.md` was untracked — now committed.

## Next steps (in order)

1. **Manual staging deploy** (user-only — harness denies autonomous CF deploy):
   ```
   cd /home/ptre/code/github/routefast
   CLOUDFLARE_ENV=staging pnpm release
   ```
   Capture deployed URL, paste into `.claude/worktrees/expo-phase-0/apps/native/.env.production` replacing the empty `EXPO_PUBLIC_API_URL=`.
2. **Acceptance demo** on phone (Phase 0 acceptance bead `routefast-mol-psu`):
   ```
   cd /home/ptre/code/github/routefast/.claude/worktrees/expo-phase-0/apps/native
   pnpm start
   ```
   Scan QR with Expo Go on iPhone (same wifi). Verify: (a) large-title "RouteFast" header, (b) "Hello RouteFast" Tailwind-styled, (c) blue "Check health" button → `{"ok":true}` renders, (d) edit a string → hot-reloads <2s, (e) flip to production env (`NODE_ENV=production npx expo start --no-dev` or set staging URL in `.env.development.local`) and verify staging URL works.
3. **Merge worktree** — once acceptance passes:
   ```
   git checkout main
   git merge worktree-expo-phase-0
   git worktree remove .claude/worktrees/expo-phase-0
   git branch -d worktree-expo-phase-0
   ```
   Or PR if user prefers review path.

## Open questions

- LAN IP: current detect script picks first non-internal IPv4 ignoring `lo|docker|br-|veth|tun|tap`. On dev machine returned `192.168.4.170` (wifi). Robust enough or want manual override flag?
- `.env.production` filled from staging deploy URL — should `.env.example` document the format or stay placeholder?
- Stale homepage-decompose bead `routefast-mol-3lu` — still unresolved. `bd close --reason superseded` or reset?
- Phase 1 kickoff: spec the auth flow (Apple/Google/magic-link) before pouring? Spec includes RevenueCat `Purchases.configure` boot per NORTH_STAR.

## In-progress work

- **Worktree `expo-phase-0`** (branch `worktree-expo-phase-0`) — code complete, runtime gates pending. Spec at `.choo-choo-ralph/expo-phase-0.spec.md` still has open `<review>` blocks and `mol-psu` bead is OPEN.
  - Last commit: `34cbc8f`. Path: `/home/ptre/code/github/routefast/.claude/worktrees/expo-phase-0/`
  - Files of note: `apps/native/{metro.config.js,postcss.config.mjs,scripts/detect-lan-ip.mjs}`, `apps/native/src/{global.css,tw/,api/client.ts}`, `apps/native/app/{_layout.tsx,index.tsx}`, `apps/native/types/env.d.ts`.
- **Worktree `refactor+homepage-decompose`** (branch `refactor/homepage-decompose`, HEAD `93c889c`) — still 8 commits, demo gauntlet + rebase pending. Stale bead `mol-3lu` blocks `mol-9k1`.
- **`ai-agent`** (HEAD `d9d1e40`, pushed) — clean.

Reference docs:
- `.choo-choo-ralph/expo-phase-0.spec.md` — Phase 0 spec (still active)
- `.choo-choo-ralph/archive/{ai-agent,use-server,dock-collapse,homepage-decompose}.spec.md`
- `memory-bank/{inventory,design-directions,expo-migration-plan}.md`
- Persistent memory: `project_homepage_decompose_dock_integration.md` (useDock touchpoint)
