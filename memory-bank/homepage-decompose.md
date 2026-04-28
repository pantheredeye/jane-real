# Spec: Decompose HomePage.tsx Into Screen-Shaped Pieces

**Status**: not started. Pre-Phase-0 of Expo migration. Do AFTER `dock-collapse.md`. Pure web-side refactor.

**Why this matters**: `src/addons/route-calculator/pages/HomePage.tsx` is 530 lines composing 7 hooks + 4 dialogs + agent integration + a giant JSX tree. It's effectively the entire app in one file. If ported 1:1 to React Native, it ships the same monolith. Decomposing into screen-shaped subcomponents now makes Phase 2 of the Expo migration tractable — each subcomponent maps cleanly to a native screen or composable section.

---

## Goal

Split `HomePage.tsx` into a thin orchestrator (≤ 80 lines) plus 4–6 section components, each ≤ 200 lines, each with a single clear responsibility.

## Out of scope

- Changing behavior. User-visible flows must be byte-for-byte identical.
- Redesigning UI. No styling changes.
- Modifying hooks (`useRouteManager`, `usePropertyList`, `useRouteCalculation`, `useRoutePersistence`, `useDemoImport`, `useStartLocation`).
- Touching `AppShell.tsx` (already small enough).
- Extracting to `packages/`. That's a separate phase.

## Files affected

**Modify**:
- `src/addons/route-calculator/pages/HomePage.tsx` — slim orchestrator (≤ 80 lines)

**Create** (new files in `src/addons/route-calculator/pages/sections/` or `components/sections/` — pick one and stick with it):
- `useHomePageState.ts` — composes all 7 hooks + state, returns a single object consumed by sections
- `DemoImportBanner.tsx` — the inline `🎉 Continue from Demo?` block
- `RoutePlannerSection.tsx` — `PropertyInputBox` + `RouteOptionsCard` + `PropertyList` + `StartingLocationCard` + inline Calculate button + validation error + empty state hint
- `RouteResultsSection.tsx` — `RouteSummary` + itinerary list (`StartingLocationResultCard` + `DriveTimeConnector` + `PropertyCard` x N) + `CopyButtons`
- `SavedRoutesPanel.tsx` — `SavedRoutesSection` (already a component, just owning the wrapper section here)
- `HomePageDialogs.tsx` — all 4 dialogs (`SaveRouteDialog`, `ErrorModal`, `ConfirmDialog` x3) driven by props from `useHomePageState`

## Tasks

1. **Identify seams** — confirm the proposed split matches natural boundaries by reading current `HomePage.tsx` end-to-end. Adjust if a different split is cleaner. Discuss with user if unsure.
2. **Pick directory** — `pages/sections/` vs. `components/sections/`. Whichever the project already leans toward; check `grep -rn "sections" src/`. Default: `pages/sections/`.
3. **Build `useHomePageState.ts`** first. Move all `useState` + all hook calls + all derived values + all handlers (`handlePaste`, `handleStateRestore`, `handleClearRoute`, `handleRequestNewRoute`, `handleConfirmNewRoute`, `handleOpenRoute`) out of `HomePage.tsx` into this hook. Returns a single object: `{ state, actions, hooks: { propertyList, startLocation, routeCalculation, routePersistence, demoImport, calculatedRoute } }` — pick a shape that's tolerable to read at call sites.
4. **Build `HomePageDialogs.tsx`** — props are the dialog open-states + their callbacks. Pure presentational composition.
5. **Build `RoutePlannerSection.tsx`** — props are everything the planner needs from state (property list, start location, calculate handler, expanded card state).
6. **Build `RouteResultsSection.tsx`** — props are `calculatedRoute` + start location info + the 3 update callbacks.
7. **Build `SavedRoutesPanel.tsx`** — thin wrapper around existing `SavedRoutesSection`.
8. **Build `DemoImportBanner.tsx`** — props from `demoImport` hook.
9. **Slim `HomePage.tsx`** — should be ~50–80 lines: call `useHomePageState`, render `<AppShell>` with sections inside in current order, plus `<HomePageDialogs>` and `<StateManager>`.
10. **Verify** line counts: `wc -l src/addons/route-calculator/pages/HomePage.tsx` should be ≤ 80; each section file ≤ 200.
11. **Manual smoke test** — see Demo below. Test EVERY flow.

## Acceptance

- `HomePage.tsx` ≤ 80 lines
- Each new section file ≤ 200 lines
- TypeScript: `pnpm run types` passes
- Lint: `pnpm run lint` passes
- All flows behave identically to before (no visual or functional regression)
- localStorage persistence still works (refresh page mid-route, state restores)
- All 4 dialogs still render at correct times with correct props
- Agent integration still works (agent adds property → property list updates)
- Dock primary/secondary actions still drive Calculate + Paste correctly

## Demo

Full end-to-end smoke test in this order — any failure blocks acceptance:

1. **Empty state**: load `/route/` clean, see empty-state hint, dock disabled.
2. **Add via input**: type address into PropertyInputBox, hit add, property appears.
3. **Add via paste**: copy a Zillow URL, paste from dock, property appears with thumbnail (when fetch succeeds).
4. **Add via agent**: open agent, "add 456 Oak St", property appears.
5. **Edit property**: edit an existing property, change reflects.
6. **Delete property**: delete one, list shrinks.
7. **Clear all**: trigger clear all, confirmation dialog appears, confirm, list empties.
8. **Configure**: set start time, set duration, set start-from type (current location / address / property), expand/collapse cards.
9. **Calculate**: with 2+ properties, Calculate button enabled, click → route renders with summary, drive times, property cards.
10. **Edit appointment time**: change time on a property card, downstream cascade.
11. **Lock time**: freeze a property's time, confirm UI reflects locked state.
12. **Copy buttons**: client and detailed copy work.
13. **Save route**: open save dialog, set name + date, save, route appears in saved routes section.
14. **Persistence**: refresh the page, state restores from localStorage.
15. **New route**: with dirty state, click new route, discard-changes dialog appears, confirm, state clears.
16. **Demo import**: trigger demo import flow (whatever the path is — check `useDemoImport`), banner appears, import works.
17. **Error path**: force a calculation error (e.g., remove API key), error modal appears, retry works.
18. **Delete saved route**: from saved routes section, trigger delete, confirmation dialog, confirm, gone.

## UI/UX checkpoints

None. Pure refactor.

## Risks / known traps

- **Prop drilling explosion**: if section components need 15+ props each, that's a smell. Consider colocating subsection state in section-local hooks where it doesn't cross boundaries (e.g., `expandedCard` state could live in `RoutePlannerSection` since only it cares).
- **Stale closures**: `useRouteCalculation` reads `addressList`, `sourceUrlList`, etc. from `propertyList` — make sure when these are passed across section boundaries, references don't become stale. Probably fine because hooks compose at the top level, but verify.
- **Effect ordering**: HomePage's `useEffect` for agent integration runs once on mount. After refactor that effect lives in `useHomePageState` — verify it still runs at the right time (before agent could fire `addPropertyToRoute`).
- **`handleAddPropertyRef` ref pattern**: the current code uses `useRef` to avoid stale closures in the agent integration effect. Preserve this pattern in `useHomePageState` exactly.
- **CSS class names** (`inline-input-section`, `inline-list-section`, `viewport-empty`, etc.) — preserve exactly. They drive layout.
- **Don't refactor the inline `<div style={{...}}>` blocks** in `DemoImportBanner` to anything fancier. Just lift them as-is. Cleanup is a separate concern.

## When done

- `/handoff` to update `memory-bank/active-context.md`
- Append progress to `memory-bank/progress.md`
- Now both pre-Phase-0 refactors are done — `/north-star` and proceed to Phase 0 of `expo-migration-plan.md`.
