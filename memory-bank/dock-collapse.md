# Spec: Collapse Dock-Bridge Into Single React Tree

**Status**: not started. Pre-Phase-0 of Expo migration. Pure web-side refactor.

**Why this matters**: The agent dock currently lives in a separate React-DOM root mounted via inline `<script>` on `<body>`, communicating with the page tree via `window` `CustomEvent` pub/sub (`src/addons/agent/dock-bridge.ts`). React Native has no analog for two roots glued by window events — this pattern must die before any native port. The refactor is also a quality win: easier to reason about, fewer edge cases around event timing.

---

## Goal

Single React tree. Dock state flows through Context (or Zustand if other state composition warrants). All `window`-event pub/sub deleted.

## Out of scope

- Changing dock visuals or behavior — must be visually and functionally identical when done.
- Migrating to RN. This is web-only refactor.
- Touching the agent's server-side code or tool definitions.
- VoiceProvider behavior changes — keep as-is, just relocate.

## Files affected

**Delete**:
- `src/addons/agent/dock-bridge.ts`
- `src/addons/agent/mount-dock.tsx`
- The inline `<script>` block in `src/app/Document.tsx` that mounts `mount-dock.tsx` (find via `grep -r "agent-dock-root" src/`)
- The `<div id="agent-dock-root">` in `Document.tsx`

**Create**:
- `src/addons/agent/DockProvider.tsx` — Context provider + hook
- (optional) `src/addons/agent/useDock.ts` — separate hook export if cleaner

**Modify**:
- `src/app/Document.tsx` — render `<DockProvider>` wrapping the page tree; render `<AgentDock />` inside it (no separate root)
- `src/addons/route-calculator/components/AppShell.tsx` — replace `setPrimaryAction` / `setSecondaryActions` calls with `useDock()` mutations; delete the `EVT_REQUEST_STATE` listener effect
- `src/addons/route-calculator/pages/HomePage.tsx` — replace the `setAgentIntegration` effect with a `useDock()` mutation; delete the `EVT_REQUEST_STATE` listener
- `src/addons/agent/components/AgentDock.tsx` — read state via `useDock()` instead of `getState()` + the `EVT_STATE_CHANGED` listener (find via `grep -rn "getState\|EVT_STATE_CHANGED" src/addons/agent/`)
- Any other consumers — find via `grep -rn "from.*dock-bridge" src/`

## Tasks

1. **Survey** consumers: `grep -rn "dock-bridge\|EVT_REQUEST_STATE\|EVT_STATE_CHANGED\|setPrimaryAction\|setSecondaryActions\|setAgentIntegration\|getState" src/` — list every site that touches the bridge.
2. **Design DockContext** — match the existing `BridgeState` shape exactly:
   ```ts
   {
     primary: PrimaryAction | null
     secondary: SecondaryAction[]
     integration: AgentIntegration
     setPrimary: (p: PrimaryAction | null) => void
     setSecondary: (s: SecondaryAction[]) => void
     setIntegration: (i: AgentIntegration) => void
   }
   ```
3. **Build `DockProvider.tsx`** with `useState` for each slice + memoized callbacks. Export `useDock()` hook that throws if called outside provider.
4. **Wire into `Document.tsx`**: `<DockProvider><PageTree /><AgentDock /></DockProvider>`. Move `<VoiceProvider>` inside `DockProvider` (or above it — match current ordering).
5. **Migrate `AgentDock.tsx`**: replace state read + window listener with `useDock()`. Drop the `requestState()` call (no longer needed — provider mounts before consumers).
6. **Migrate `AppShell.tsx`**: replace bridge calls in both `useEffect` blocks with `useDock()` mutations. Delete the `EVT_REQUEST_STATE` listener entirely. Cleanup-on-unmount stays (`setPrimary(null)`, `setSecondary([])`).
7. **Migrate `HomePage.tsx`**: replace `setAgentIntegration` effect with `useDock()` mutation. Delete the `EVT_REQUEST_STATE` listener.
8. **Migrate any other consumer** found in step 1 the same way.
9. **Delete** `dock-bridge.ts`, `mount-dock.tsx`, the inline `<script>` and `<div id="agent-dock-root">` in `Document.tsx`.
10. **Verify** `grep -r "dock-bridge\|EVT_REQUEST_STATE\|EVT_STATE_CHANGED\|agent-dock-root" src/` returns zero hits.
11. **Manual smoke test** — see Demo below.

## Acceptance

- `grep` for any of the deleted symbols returns zero hits
- TypeScript: `pnpm run types` passes
- Lint: `pnpm run lint` passes
- Dock visually identical: same position, same primary button label/state, same secondary `⋯` menu
- Calculate button works from the dock, paste action works from the dock
- Agent's `addPropertyToRoute` server tool still adds properties to the route page's list
- Navigating between `/route/` and other pages: dock state resets correctly when leaving route page (no stale primary action shown on, e.g., `/account`)
- No new console errors in dev

## Demo

1. Run `pnpm run dev`, open `/route/`.
2. Confirm Calculate button is visible in dock, disabled (no properties).
3. Click "📋 Paste address" in dock — state should cycle through pasting → added/invalid (works as before).
4. Add 2 properties via paste or input box.
5. Click Calculate in dock — route renders.
6. Open agent chat (whatever the current trigger is), say "add 123 Main Street, Anytown CA as a property" — confirm property appears in list.
7. Navigate to `/account` — confirm dock primary action no longer shows the route-page Calculate (or matches whatever the current behavior is on non-route pages).
8. Navigate back to `/route/` — confirm dock re-populates with current state correctly.

## UI/UX checkpoints

None. Pure refactor. If you find yourself wanting to "improve" the dock UI mid-refactor, **stop** — file an idea in `memory-bank/ideas.md`, ship the refactor as-is.

## Risks / known traps

- **Provider ordering** matters: `DockProvider` must wrap both the page tree AND `<AgentDock />`, or the dock can't read state.
- **VoiceProvider** wraps `AgentDock` currently. If voice context is also used by page-tree components, hoist it above `DockProvider`. Verify before moving.
- **SSR**: existing `getBridge()` has a `typeof window === "undefined"` guard. Provider needs equivalent — make sure server-rendered tree doesn't crash. React Context is fine on server; just ensure the provider's initial state is SSR-safe.
- **Hydration mismatch**: if dock previously mounted post-hydration via inline script, dock contents may now appear earlier. Watch for hydration warnings on first load. Likely fine since dock starts empty.
- **`requestState()` was a workaround** for "dock mounts after page tree." With single tree, providers always mount before consumers — drop the call. But verify no consumer relied on the request-state callback for any other purpose.

## When done

- `/handoff` to update `memory-bank/active-context.md`
- Append progress to `memory-bank/progress.md`
- Then move on to `homepage-decompose.md`
