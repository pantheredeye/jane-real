---
title: "Decompose HomePage Into Section Components"
created: 2026-04-27
poured:
  - routefast-mol-h7j
  - routefast-mol-16q
  - routefast-mol-pdq
  - routefast-mol-jj0
  - routefast-mol-7fg
  - routefast-mol-wc3
iteration: 1
auto_discovery: false
auto_learnings: false
---
<project_specification>
<project_name>Decompose HomePage Into Section Components</project_name>

  <overview>
    src/addons/route-calculator/pages/HomePage.tsx is 530 lines composing 6 hooks
    + 4 dialogs + agent integration + a giant JSX tree. It is effectively the entire
    app in one file. Pre-Phase-0 of the Expo migration. If ported 1:1 to React
    Native, it ships the same monolith. Decomposing into screen-shaped subcomponents
    now makes Phase 2 of the Expo migration tractable — each subcomponent maps
    cleanly to a native screen or composable section. Pure web-side refactor:
    visually and functionally identical when done. Goal: thin orchestrator (≤ 80
    lines) + 4 section components (≤ 200 lines each) + a composing `useHomePageState`
    hook.

    Coordination with dock-collapse: this refactor moves HomePage.tsx lines 216–230
    (agent integration useEffect using `setAgentIntegration` / `EVT_REQUEST_STATE`
    from `../../agent/dock-bridge`) verbatim into `useHomePageState.ts`. The
    dock-collapse refactor will later swap those bridge symbols for `useDock()` —
    that is a small mechanical update; this refactor preserves the existing pattern
    as-is so the two efforts can land in either order.
  </overview>

  <context>
    <existing_patterns>
      - All client-side files start with `'use client'` directive at top.
      - Existing hooks (useRouteManager, usePropertyList, useRouteCalculation,
        useRoutePersistence, useDemoImport, useStartLocation) live in
        `src/addons/route-calculator/hooks/` and return flat objects bundling state
        + derived values + handlers. Mirror this for `useHomePageState`.
      - HomePage already imports + composes hooks at the top of its body; this
        refactor moves that composition into a single hook.
      - Inline `<div style={{...}}>` blocks (e.g. demo banner) — preserved
        verbatim. Cleanup is out of scope.
      - 50s retro design system uses className strings like `inline-input-section`,
        `inline-list-section`, `viewport-empty`, `results-section`, `section-title`,
        `section-description`, `itinerary-container`, `itinerary-list` — load-bearing,
        copied verbatim into section files.
      - `useRef` pattern guards stale closures in the agent integration effect
        (HomePage.tsx:213–214). Preserved exactly inside `useHomePageState`.
      - Section files are new; no `pages/sections/` or `components/sections/`
        directory exists yet — clean slate.
    </existing_patterns>
    <integration_points>
      - `src/addons/route-calculator/pages/HomePage.tsx` (530 lines) — the only
        file modified. Slimmed to ≤ 80 lines. All imports of hooks +
        server-functions + utils + dock-bridge move into `useHomePageState`.
      - Hooks consumed (no changes to them):
        `src/addons/route-calculator/hooks/useRouteManager.ts`,
        `usePropertyList.ts`, `useRouteCalculation.ts`, `useRoutePersistence.ts`,
        `useDemoImport.ts`, `useStartLocation.ts`.
      - Server functions consumed (no changes):
        `src/addons/route-calculator/server-functions/getUserCredits.ts`,
        `fetchOgImage.ts`.
      - Utils consumed (no changes):
        `src/addons/route-calculator/utils/parsePropertyInput.ts` (`parsePropertyInput`,
        `validatePropertyInput`).
      - Components consumed (no changes — moved into appropriate section files):
        - Planner section: `PropertyInputBox`, `RouteOptionsCard`, `PropertyList`,
          `StartingLocationCard`.
        - Results section: `RouteSummary`, `StartingLocationResultCard`,
          `DriveTimeConnector`, `PropertyCard`, `CopyButtons`.
        - Dialogs: `SaveRouteDialog`, `ErrorModal`, `ConfirmDialog`.
        - Untouched in HomePage: `AppShell` (orchestrator wrap), `StateManager`
          (sibling), `SavedRoutesSection` (rendered inline by orchestrator).
      - `src/addons/agent/dock-bridge.ts` — imported by `useHomePageState` for the
        agent integration useEffect. Imports preserved verbatim (`setAgentIntegration`,
        `EVT_REQUEST_STATE`). Will be replaced by `useDock()` when dock-collapse
        merges.
      - `src/addons/route-calculator/components/AppShell.tsx` — NOT TOUCHED.
        Continues to receive its current prop set from HomePage.tsx (now plumbed
        from `useHomePageState`).
      - HomePage seam map (verified by reading current HomePage.tsx end to end):
        - lines 1–30: imports — move with their consumers
        - lines 31–44: 8 useState — move into `useHomePageState`
          (except `expandedCard` → relocated into `RoutePlannerSection` local state)
        - lines 46–109: 6 hook calls + `fetchUserCredits` + `calculateStateFingerprint`
          + `currentFingerprint` — move into `useHomePageState`
        - lines 111–208: 6 handlers (`handleStateRestore`, `handleClearRoute`,
          `handleRequestNewRoute`, `handleConfirmNewRoute`, `handleOpenRoute`,
          `handlePaste`) + `isCalculationDirty` derived — move into `useHomePageState`
        - lines 210–230: agent integration useEffect + `handleAddPropertyRef` —
          move into `useHomePageState` verbatim
        - lines 232–254: `<AppShell>` open + props — stays in HomePage orchestrator
        - lines 255–263: `<StateManager>` — stays in HomePage orchestrator
        - lines 265–315: demo banner inline JSX (51 lines) → `DemoImportBanner.tsx`
        - lines 317–402: planner JSX (~86 lines) → `RoutePlannerSection.tsx`
          (owns `expandedCard` local state)
        - lines 404–463: results JSX (~60 lines) → `RouteResultsSection.tsx`
        - lines 465–470: `<SavedRoutesSection>` — stays in HomePage orchestrator
          inline (no SavedRoutesPanel wrapper — would be ceremony)
        - lines 472–527: 4 dialogs (~56 lines) → `HomePageDialogs.tsx`
    </integration_points>
    <new_technologies>
      - None. Pure refactor. No new deps, no new patterns.
    </new_technologies>
    <conventions>
      - Section files live in `src/addons/route-calculator/pages/sections/`.
        `useHomePageState.ts` lives in the same directory (it is the page
        orchestrator's composing hook, bound 1:1 to HomePage and its sections).
      - One default export per section file.
      - Section file ≤ 200 lines. Orchestrator (HomePage.tsx) ≤ 80 lines.
      - `useHomePageState` returns a flat object: state values, setters, hook
        return objects (passed whole — `propertyList`, `startLocation`,
        `routeCalculation`, `routePersistence`, `demoImport`), `calculatedRoute`
        + its mutators, derived values (`currentFingerprint`,
        `isCalculationDirty`, `userCredits`), handlers. Sections destructure what
        they need.
      - `'use client'` directive at the top of every new section file and
        `useHomePageState.ts`.
      - No styling, no copy, no behavior changes. ClassName strings copied
        verbatim. Inline style objects copied verbatim.
      - `expandedCard` state is colocated in `RoutePlannerSection` because it is
        only consumed there. Reduces orchestrator state by 1 useState.
    </conventions>
  </context>

  <tasks>
    <task id="extract-use-homepage-state" priority="1" category="infrastructure">
      <title>Extract all state, hooks, handlers, and effects into useHomePageState</title>
      <description>
        Create `src/addons/route-calculator/pages/sections/useHomePageState.ts`
        containing all useState calls (except `expandedCard`), all 6 hook calls,
        the `fetchUserCredits` helper, `calculateStateFingerprint` +
        `currentFingerprint`, all 6 handlers, `isCalculationDirty`, and the agent
        integration useEffect with its ref. Returns a flat object. Replace the
        equivalent blocks in HomePage.tsx with a single `useHomePageState(props)`
        call and destructuring. HomePage.tsx remains functional and visually
        identical; it is just shorter and the inlined logic now lives in the hook.
        Sections are NOT yet extracted in this bead.
      </description>
      <steps>
        - Create `src/addons/route-calculator/pages/sections/useHomePageState.ts`
        - Top of file: `'use client'`
        - Imports: `useEffect`, `useRef`, `useState` from 'react';
          `setAgentIntegration`, `EVT_REQUEST_STATE` from
          '../../../agent/dock-bridge'; `useRouteManager` from
          '../../hooks/useRouteManager'; `usePropertyList` from
          '../../hooks/usePropertyList'; `useRouteCalculation` from
          '../../hooks/useRouteCalculation'; `useRoutePersistence` from
          '../../hooks/useRoutePersistence'; `useDemoImport` from
          '../../hooks/useDemoImport'; `useStartLocation` from
          '../../hooks/useStartLocation'; `getUserCredits`, `UserCreditsData`
          from '../../server-functions/getUserCredits'; `parsePropertyInput`,
          `validatePropertyInput` from '../../utils/parsePropertyInput';
          `fetchOgImage` from '../../server-functions/fetchOgImage'; types
          `OptimizedRoute`, `PropertyInput`, `SavedRoute` from '../../types'.
        - Export type for hook props:
          `{ initialCredits: UserCreditsData | null; initialSavedRoutes: SavedRoute[] }`.
        - Move the 8 useState declarations (HomePage.tsx:37–44) — EXCLUDE
          `expandedCard` (it stays in HomePage temporarily; relocates to
          RoutePlannerSection in the planner-extraction bead).
        - Move `useRouteManager(null)` call (HomePage.tsx:46–52) and destructure
          identically.
        - Move `useStartLocation` (HomePage.tsx:55–57) BEFORE `usePropertyList` —
          ordering matters because `usePropertyList` reads
          `startLocation.startingPropertyIndex`.
        - Move `usePropertyList` (HomePage.tsx:60–65) preserving callback wiring.
        - Move `fetchUserCredits` helper (HomePage.tsx:68–71).
        - Move `calculateStateFingerprint` + `currentFingerprint`
          (HomePage.tsx:74–82). Do NOT memoize.
        - Move `useRouteCalculation` (HomePage.tsx:85–99).
        - Move `useRoutePersistence` (HomePage.tsx:102–104).
        - Move `useDemoImport` (HomePage.tsx:107–109).
        - Move all 6 handlers verbatim (HomePage.tsx:111–206):
          `handleStateRestore`, `handleClearRoute`, `handleRequestNewRoute`,
          `handleConfirmNewRoute`, `handleOpenRoute`, `handlePaste`.
        - Move `isCalculationDirty` (HomePage.tsx:208).
        - Move `handleAddPropertyRef` + ref assignment (HomePage.tsx:213–214) and
          the agent integration `useEffect` (HomePage.tsx:216–230). Empty deps
          array `[]` MUST be preserved — adding hooks-as-deps would double-register.
        - Return a flat object containing every value referenced from
          HomePage.tsx's JSX (`startTime`, `setStartTime`, `selectedDuration`,
          `setSelectedDuration`, `routeName`, `setRouteName`, `isDirty`, `setIsDirty`,
          `lastCalculatedFingerprint`, `setLastCalculatedFingerprint`, `userCredits`,
          `showDiscardConfirm`, `setShowDiscardConfirm`, `calculatedRoute`,
          `updateAppointmentTime`, `updateShowingDuration`,
          `toggleFreezeAppointment`, `setInitialRoute`, `propertyList`,
          `startLocation`, `routeCalculation`, `routePersistence`, `demoImport`,
          `currentFingerprint`, `isCalculationDirty`, `handleStateRestore`,
          `handleClearRoute`, `handleRequestNewRoute`, `handleConfirmNewRoute`,
          `handleOpenRoute`, `handlePaste`).
        - In `HomePage.tsx`: replace the 200+ lines of state/hooks/handlers/effects
          (lines 31–230) with a single `useHomePageState({ initialCredits,
          initialSavedRoutes })` call and a destructure of everything used by JSX.
          Keep the `expandedCard` useState in HomePage for now (will move next bead).
          Keep all imports that the JSX still references; remove imports now only
          used inside the hook (dock-bridge, hooks/*, getUserCredits,
          parsePropertyInput, fetchOgImage, useRouteManager).
        - Verify HomePage.tsx still compiles + renders identical JSX output. Line
          count not yet ≤ 80; that lands when sections extract.
      </steps>
      <test_steps>
        1. `pnpm run types` — no errors.
        2. `pnpm run lint` — no errors.
        3. `pnpm run dev` — server starts, /route loads.
        4. Smoke: load page, see empty state. Add a property via input box. Add a
           property via clipboard paste (dock paste action). Calculate route with
           2+ properties — itinerary renders. Refresh page — state restores from
           localStorage. New route flow with dirty state — discard dialog appears.
        5. Agent smoke: open agent, "add 456 Oak St" — property appears
           (verifies agent integration useEffect still registers correctly).
        6. `wc -l src/addons/route-calculator/pages/HomePage.tsx` — should be in
           the 280–330 range (full JSX still inline; sections not yet extracted).
      </test_steps>
      <review></review>
    </task>

    <task id="extract-home-page-dialogs" priority="2" category="functional">
      <title>Extract 4 dialogs into HomePageDialogs.tsx</title>
      <description>
        Move the 4 dialog elements (HomePage.tsx:472–527 of the pre-refactor file
        — re-locate by JSX after the use-state extraction) into a single section
        component `HomePageDialogs.tsx`. Pure presentational composition driven by
        props from `useHomePageState`. No behavior changes.
      </description>
      <steps>
        - Create `src/addons/route-calculator/pages/sections/HomePageDialogs.tsx`.
        - Top of file: `'use client'`.
        - Imports: `SaveRouteDialog` from '../../components/SaveRouteDialog';
          `ErrorModal` from '../../components/ErrorModal'; `ConfirmDialog` from
          '../../components/ConfirmDialog'; type `OptimizedRoute` from '../../types';
          plus types for the relevant hook return shapes (or accept handler
          props directly — cleaner).
        - Define props interface receiving exactly what the 4 dialogs need:
          - `routePersistence`: showSaveDialog, setShowSaveDialog, routeDate,
            setRouteDate, isSaving, handleSaveRoute, routeToDelete, isDeleting,
            handleConfirmDelete, handleCancelDelete.
          - `routeCalculation`: showErrorModal, calculationError,
            handleCloseErrorModal, handleRetryCalculation.
          - `propertyList`: propertyList (for count), showClearConfirm,
            handleConfirmClearAll, handleCancelClearAll.
          - Discard flow: showDiscardConfirm, setShowDiscardConfirm,
            handleConfirmNewRoute.
          - `routeName`, `setRouteName`, `startTime`, `calculatedRoute` (for
            `handleSaveRoute` invocation).
          - Simplest viable shape: pass `state` returned by `useHomePageState`
            whole, OR define a focused props type. Pick the focused props type
            (better discoverability, smaller surface).
        - Move JSX block: 4 dialog elements verbatim. Wrap in a fragment.
        - Default export.
        - In HomePage.tsx: import `HomePageDialogs` from './sections/HomePageDialogs',
          replace the 4 dialog blocks with `<HomePageDialogs ... />` passing the
          required props.
      </steps>
      <test_steps>
        1. `pnpm run types`, `pnpm run lint` — clean.
        2. `pnpm run dev` — server starts.
        3. Smoke each dialog:
           - Save dialog: with calculated route, click Save in dock menu →
             dialog opens; set name + date → save → dialog closes, route appears
             in saved routes.
           - Error modal: force calc error (clear API key in dev or use bad
             address) → error modal appears; click retry → retries; click close
             → dismisses.
           - Clear all dialog: with properties present, trigger clear all →
             confirm dialog appears; cancel → list intact; confirm → list empty.
           - Delete saved route dialog: from saved routes section, delete →
             confirm dialog appears; cancel → list intact; confirm → route gone.
           - Discard dialog: with dirty state, click new route → discard dialog;
             cancel → state intact; confirm → state cleared.
        4. `wc -l src/addons/route-calculator/pages/HomePage.tsx` — should drop
           by ~55 lines.
        5. `wc -l src/addons/route-calculator/pages/sections/HomePageDialogs.tsx`
           — ≤ 200.
      </test_steps>
      <review></review>
    </task>

    <task id="extract-demo-import-banner" priority="2" category="functional">
      <title>Extract demo import banner into DemoImportBanner.tsx</title>
      <description>
        Move the inline demo banner (HomePage.tsx:265–315 pre-refactor — the
        `🎉 Continue from Demo?` block) into `DemoImportBanner.tsx`. Inline
        `<div style={{...}}>` blocks copied verbatim. Driven by props from the
        `demoImport` hook return object.
      </description>
      <steps>
        - Create `src/addons/route-calculator/pages/sections/DemoImportBanner.tsx`.
        - Top of file: `'use client'`.
        - Props interface accepts the `demoImport` hook return — destructure
          `showDemoImportBanner`, `demoProperties`, `handleDismissDemoImport`,
          `handleImportDemoProperties` (or accept the whole object for
          simplicity).
        - Move JSX verbatim. Inline styles preserved exactly (no extraction to
          CSS, no prettifying).
        - Early return null when `!showDemoImportBanner || !demoProperties`.
        - Default export.
        - In HomePage.tsx: import, replace the inline conditional banner block
          with `<DemoImportBanner demoImport={demoImport} />`.
      </steps>
      <test_steps>
        1. `pnpm run types`, `pnpm run lint`.
        2. `pnpm run dev`.
        3. Smoke: trigger demo import flow (the path exposed by `useDemoImport`
           — `?demo=...` param or stored demoState — verify in source). Banner
           appears with property count. Click "No Thanks" → banner disappears.
           Re-trigger → banner reappears. Click "Import" → properties imported,
           banner disappears.
        4. Visual inspection: banner styling identical to before (same blue tint,
           same layout, same font sizes).
        5. `wc -l ... DemoImportBanner.tsx` — ≤ 200.
      </test_steps>
      <review></review>
    </task>

    <task id="extract-route-planner-section" priority="2" category="functional">
      <title>Extract planner section into RoutePlannerSection.tsx (owns expandedCard)</title>
      <description>
        Move the planner JSX block (PropertyInputBox + RouteOptionsCard +
        PropertyList + StartingLocationCard + inline Calculate button +
        validation error + empty state hint) into `RoutePlannerSection.tsx`.
        Relocate `expandedCard` local state from HomePage into this section since
        only this section consumes it. Driven by props from `useHomePageState`.
      </description>
      <steps>
        - Create `src/addons/route-calculator/pages/sections/RoutePlannerSection.tsx`.
        - Top of file: `'use client'`.
        - Imports: `useState` from 'react'; section components from
          '../../components/' (PropertyInputBox, RouteOptionsCard, PropertyList,
          StartingLocationCard).
        - Move `expandedCard` useState into this component (delete from
          HomePage.tsx — also remove its setter from `useHomePageState` if it
          was placed there earlier; per bead 1 it stayed in HomePage, so just
          delete the line).
        - Props: `propertyList`, `startLocation`, `routeCalculation`, `startTime`,
          `setStartTime`, `selectedDuration`, `setSelectedDuration`, `setIsDirty`,
          `calculatedRoute` (for empty-state check).
        - Move JSX verbatim: input section + options card + property list +
          starting location card + calculate button + validation error + empty
          state. Keep the `propertyList.propertyList.length` conditionals exactly
          as written.
        - The inline handlers `(time) => { setStartTime(time); setIsDirty(true);
          routeCalculation.resetSuccessState() }` etc. preserved verbatim.
        - Default export.
        - In HomePage.tsx: import, replace the planner JSX block with
          `<RoutePlannerSection ... />`.
      </steps>
      <test_steps>
        1. `pnpm run types`, `pnpm run lint`.
        2. `pnpm run dev`.
        3. Smoke planner flows:
           - Empty state hint shows when no properties + no calculated route.
           - Add property via input box.
           - Toggle Route Options card expanded/collapsed.
           - Toggle Starting Location card expanded/collapsed.
           - Set start time, duration, start-from type (current location /
             address / property index). Verify dirty marker.
           - Calculate button: disabled with < 2 properties, enabled with ≥ 2.
           - Validation error displays inline when present.
           - Edit + delete property from list.
        4. `wc -l ... RoutePlannerSection.tsx` — ≤ 200.
      </test_steps>
      <review></review>
    </task>

    <task id="extract-route-results-section" priority="2" category="functional">
      <title>Extract results section into RouteResultsSection.tsx</title>
      <description>
        Move the calculated-route JSX block (RouteSummary + StartingLocationResultCard
        + DriveTimeConnector + PropertyCard map + CopyButtons) into
        `RouteResultsSection.tsx`. Driven by props from `useHomePageState`.
        Renders nothing when `calculatedRoute` is null.
      </description>
      <steps>
        - Create `src/addons/route-calculator/pages/sections/RouteResultsSection.tsx`.
        - Top of file: `'use client'`.
        - Imports: `RouteSummary`, `StartingLocationResultCard`,
          `DriveTimeConnector`, `PropertyCard`, `CopyButtons` from
          '../../components/'; type `OptimizedRoute`, `PropertyInput` from
          '../../types'; type for startLocation hook shape.
        - Props: `calculatedRoute`, `startLocation`, `propertyList`,
          `updateAppointmentTime`, `updateShowingDuration`,
          `toggleFreezeAppointment`.
        - Early return null if `!calculatedRoute`.
        - Move JSX verbatim including the `<section className="results-section">`
          wrapper, the `RouteSummary`, the itinerary container, the starting
          location card, the drive time from start, the `.items.map` block, and
          `CopyButtons`.
        - Default export.
        - In HomePage.tsx: import, replace the results JSX block with
          `<RouteResultsSection ... />`.
      </steps>
      <test_steps>
        1. `pnpm run types`, `pnpm run lint`.
        2. `pnpm run dev`.
        3. Smoke results flows:
           - Calculate route with 2+ properties.
           - Itinerary renders with starting location card, drive time
             connectors, property cards, summary stats.
           - Edit appointment time on a card → downstream cascade.
           - Lock (freeze) a property's time → UI reflects locked state.
           - Edit showing duration → cascade.
           - Copy client itinerary → button shows COPIED!.
           - Copy detailed itinerary → button shows COPIED!.
        4. `wc -l ... RouteResultsSection.tsx` — ≤ 200.
      </test_steps>
      <review></review>
    </task>

    <task id="verify-decomposition" priority="3" category="verification">
      <title>Verify line counts, types, lint, and full smoke test</title>
      <description>
        Final gate. HomePage.tsx must be ≤ 80 lines and read as a thin
        orchestrator. Every section ≤ 200 lines. All 18 demo flows pass with no
        visual or behavioral regression. localStorage persistence still works.
      </description>
      <steps>
        - `wc -l src/addons/route-calculator/pages/HomePage.tsx` — must be ≤ 80.
          If over, audit for accidentally retained logic; either move into
          `useHomePageState` or further split a section.
        - `wc -l src/addons/route-calculator/pages/sections/*.tsx
           src/addons/route-calculator/pages/sections/useHomePageState.ts` —
          each ≤ 200.
        - `pnpm run types` — clean.
        - `pnpm run lint` — clean.
        - `pnpm run dev` — server boots.
      </steps>
      <test_steps>
        Full demo gauntlet (any failure blocks acceptance):
        1. Empty state: load /route clean, see empty-state hint, dock disabled.
        2. Add via input: type address, hit add, property appears.
        3. Add via paste: copy a Zillow URL, paste from dock, property appears
           with thumbnail (when fetch succeeds).
        4. Add via agent: open agent, "add 456 Oak St", property appears.
        5. Edit property: edit existing, change reflects.
        6. Delete property: delete one, list shrinks.
        7. Clear all: trigger clear all, confirm dialog, confirm, list empties.
        8. Configure: set start time, duration, start-from type
           (current/address/property), expand/collapse cards.
        9. Calculate: with 2+ properties, click → route renders w/ summary,
           drive times, property cards.
        10. Edit appointment time: change time, downstream cascade.
        11. Lock time: freeze a property's time, UI reflects locked state.
        12. Copy buttons: client + detailed copy work.
        13. Save route: open save dialog, set name + date, save, route appears
            in saved routes.
        14. Persistence: refresh the page, state restores from localStorage.
        15. New route: with dirty state, click new route, discard dialog,
            confirm, state clears.
        16. Demo import: trigger demo import flow, banner appears, import works.
        17. Error path: force calc error (e.g. remove API key), error modal,
            retry works.
        18. Delete saved route: from saved routes section, trigger delete,
            confirm dialog, confirm, gone.
      </test_steps>
      <review></review>
    </task>
  </tasks>
</project_specification>
