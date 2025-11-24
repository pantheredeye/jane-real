# Route Workspace UX Refactor

## Context

Refactoring AddSheet into a "Route Workspace" concept for better mobile UX.

### Problem
- Input/buttons move as property list grows (frustrating on mobile)
- Settings in separate sheet
- Can't calculate without closing sheet
- No route save/load workflow
- PropertyList duplicated in main content and sheet

### Solution
- Partial sheet overlay keeps bottom bar visible (Calculate always accessible)
- Fixed regions: top (route name), middle (scrollable list), bottom (input/settings/actions)
- Merge settings into workspace sheet
- Add hamburger menu for route management
- localStorage draft state with dirty indicator

### Architecture
```
Main Content = Route Results (optimized order, rich property details)
Route Workspace Sheet = Input (properties, settings, route name)
Bottom Bar = [Workspace] [Calculate] - always visible
Hamburger = New/Open/Save Route, Account, Legal
```

### Start From Options
- Current location (GPS, default on mobile)
- First property in list
- Custom address

### State Model
- DB: Saved routes (source of truth)
- localStorage draft: Auto-saves changes, survives close
- Dirty indicator: Shows when draft differs from saved

---

## Phase 1: Layout Restructure

- [ ] **1.1 Partial sheet CSS** (`mobile-layout.css`)
  - Add styles for sheet to stop above bottom bar (~80px)
  - Overlay stops at bottom bar height
  - Test with Vaul snapPoints or max-height

- [ ] **1.2 Remove PropertyList from main viewport** (`AppShell.tsx`)
  - Delete PropertyList from MainViewport section
  - Add empty state placeholder (e.g., "Add properties and calculate to see route")
  - Main content only shows calculated route results

- [ ] **1.3 Rename AddSheet → RouteWorkspace**
  - Rename `AddSheet.tsx` to `RouteWorkspace.tsx`
  - Update all imports in `AppShell.tsx`
  - Update prop names if needed

- [ ] **1.4 Update BottomBar** (`BottomBar.tsx`)
  - Change "ADD" button to "WORKSPACE" or route list icon
  - Remove "SETTINGS" button (moving to workspace)
  - Keep "CALCULATE" button

---

## Phase 2: Route Workspace Fixed Regions

- [ ] **2.1 Restructure RouteWorkspace layout** (`RouteWorkspace.tsx`)
  - Fixed top: Route name with inline edit + dirty indicator
  - Scrollable middle: PropertyList (flex-grow, overflow-y scroll)
  - Fixed bottom: Input, settings, clear button

- [ ] **2.2 Move settings into workspace**
  - Add collapsible "Settings" section in fixed bottom
  - Include: Start from selector, Duration selector
  - Expand/collapse with chevron toggle

- [ ] **2.3 Delete SettingsSheet**
  - Remove `SettingsSheet.tsx`
  - Remove from AppShell imports and state
  - Remove settings button handler

- [ ] **2.4 Inline route name editing**
  - Tap name to enter edit mode
  - Blur or enter to save
  - Placeholder: "[New Route]" for unsaved routes
  - Show dirty indicator (• or *) after name when unsaved changes

- [ ] **2.5 Start From selector UI**
  - Radio buttons: Current location / First property / Custom
  - Custom shows text input for address
  - Default to "Current location" on mobile

---

## Phase 3: State Management

- [ ] **3.1 Add isDirty state** (`HomePage.tsx`)
  - Track when current state differs from last saved
  - Pass to RouteWorkspace for indicator display

- [ ] **3.2 Enhance StateManager** (`StateManager.tsx`)
  - Separate localStorage keys for draft vs saved route reference
  - Key: `routeCalculatorDraft` for current working state
  - Key: `routeCalculatorSavedId` for which saved route is loaded

- [ ] **3.3 Clear behavior with prompts** (`HomePage.tsx`)
  - If saved route with changes: "Save changes to [Name]?" → Save & Clear / Discard & Clear / Cancel
  - If unsaved route: simple confirm dialog
  - Clear → fresh unsaved route

- [ ] **3.4 Route name state**
  - Add `routeName` state to HomePage
  - Add `savedRouteId` state (null for unsaved)
  - Pass to RouteWorkspace

---

## Phase 4: Hamburger Menu

- [ ] **4.1 Create MenuSheet** (`components/MenuSheet.tsx`)
  - Vaul drawer like other sheets
  - Sections:
    - Route Management: New Route, Open Route, Save Route
    - Account: Account Settings, Share & Earn
    - Legal: Privacy Policy, Terms of Service

- [ ] **4.2 Wire MenuSheet in AppShell**
  - Add menuOpen state
  - Hamburger button opens MenuSheet
  - Pass handlers from HomePage

- [ ] **4.3 Route management handlers** (`HomePage.tsx`)
  - `handleNewRoute`: Prompt save if dirty → clear state
  - `handleSaveRoute`: Call saveRoute server function, clear draft, update savedRouteId
  - `handleLoadRoute`: Call getRoute server function, restore state, set savedRouteId

- [ ] **4.4 Open Route UI**
  - Simple list in MenuSheet showing saved routes
  - Tap to load, shows loading state
  - Can enhance later with search/filter

- [ ] **4.5 Legal pages**
  - Create Privacy Policy route/page
  - Create Terms of Service route/page
  - Link from MenuSheet

---

## Phase 5: Start Location Enhancement

- [ ] **5.1 Add geolocation** (`HomePage.tsx`)
  - Request geolocation permission when "Current location" selected
  - Store coords in state: `currentLocation: {lat, lng} | null`
  - Handle permission denied gracefully

- [ ] **5.2 Pass start location to calculate**
  - Modify calculateRoute call to accept start location type
  - If current location: pass GPS coords
  - If first property: use first in list
  - If custom: geocode the custom address

- [ ] **5.3 Update calculateRoute server function** (if needed)
  - Accept optional startCoords parameter
  - Use as origin for route optimization

---

## Files Reference

### Modified
- `src/addons/route-calculator/mobile-layout.css` - partial sheet styles
- `src/addons/route-calculator/components/AppShell.tsx` - remove PropertyList, add MenuSheet
- `src/addons/route-calculator/components/BottomBar.tsx` - update buttons
- `src/addons/route-calculator/components/AddSheet.tsx` → `RouteWorkspace.tsx` - complete restructure
- `src/addons/route-calculator/components/StateManager.tsx` - draft persistence
- `src/addons/route-calculator/pages/HomePage.tsx` - route management, geolocation, isDirty

### Deleted
- `src/addons/route-calculator/components/SettingsSheet.tsx`

### New
- `src/addons/route-calculator/components/MenuSheet.tsx`
- Privacy Policy page (location TBD)
- Terms of Service page (location TBD)

---

## Decisions to Make During Build

- [ ] Exact sheet snap point height (60%? 70%? test on device)
- [ ] Empty state text for main content before calculation
- [ ] Debounce timing for auto-draft saves (300ms? 500ms?)
- [ ] "Open Route" - inline list vs separate screen (start inline)
- [ ] Dirty indicator style (• dot vs * asterisk vs different color)
