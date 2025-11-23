# Mobile-First UI Refactor

## Overview
Refactor route calculator from monolithic page to mobile-first app-like UI with bottom sheet pattern, bottom navigation, and inline feedback.

## Architecture

```
┌─────────────────────────────┐
│  [≡]  "Untitled Route"  [?] │  ← Header: hamburger (sheet), inline-edit title, help
├─────────────────────────────┤
│                             │
│  [Viewport: List or Map]    │  ← Read-only display, max-width 500px
│                             │
├─────────────────────────────┤
│  [+ ADD] [SETTINGS] [CALC]  │  ← Bottom bar (fixed, chunky retro buttons)
└─────────────────────────────┘
```

**[+ ADD] sheet**: Property input + editable list (stays open during batch add)
**[SETTINGS] sheet**: Starting point, start time, duration
**[≡] hamburger sheet**: Saved routes, account, subscription, logout, share & earn

## Key Decisions

- **StateManager**: Keep in HomePage (future Zustand will absorb it)
- **Hamburger**: Sheet from bottom (consistent pattern, thumb-friendly)
- **Route title**: Inline edit (tap → focus → edit → blur saves)
- **Desktop**: Unified layout, max-width 500px centered, keyboard shortcuts + hover states
- **Calc button outside sheets**: Establishes precedent for future inline editing from main page

## Phase 1: Shell + Vaul (CURRENT)

**Goal**: New container with bottom bar + two sheets (Add, Settings)

### Tasks

- [ ] Create branch `feature/mobile-first-refactor`
- [ ] Install vaul: `pnpm add vaul`
- [ ] Create `BottomBar.tsx` ("use client")
  - Chunky retro buttons: `+ ADD`, `SETTINGS`, `CALCULATE`
  - Props: onAddPress, onSettingsPress, onCalculatePress, isCalculating
  - Fixed position, safe-area padding, 44px min touch targets
- [ ] Create `AppShell.tsx` ("use client")
  - Layout: header + main viewport + BottomBar
  - Owns sheet state: addSheetOpen, settingsSheetOpen
  - Max-width 500px centered
  - Header: hamburger (placeholder), editable route title, help button
- [ ] Create `SettingsSheet.tsx` ("use client")
  - Vaul drawer with snap points
  - Starting point dropdown, start time input, DurationSelector
  - Props: settings state + setters
  - Retro: thick borders, hard shadow up, no border-radius
- [ ] Create `AddSheet.tsx` ("use client")
  - Vaul drawer, stays open during batch add
  - PropertyInputBox + editable PropertyList
  - Props: properties, onAdd, onEdit, onDelete, onClearAll
  - Snap points: peek (input visible) + full
- [ ] Create `mobile-layout.css`
  - Bottom bar + button styles
  - Vaul overrides (retro aesthetic)
  - Header styles
  - Keyboard focus states, hover states
- [ ] Modify `HomePage.tsx`
  - Wrap in AppShell
  - Remove inline settings section
  - Main content = read-only property list
  - Keep all state + handlers, pass down via AppShell
  - StateManager stays here
- [ ] Add TODO annotations in code
  - Per-property duration in AddSheet (future)
  - Hamburger menu contents (future)

### Files to create
- `src/addons/route-calculator/components/AppShell.tsx`
- `src/addons/route-calculator/components/BottomBar.tsx`
- `src/addons/route-calculator/components/AddSheet.tsx`
- `src/addons/route-calculator/components/SettingsSheet.tsx`
- `src/addons/route-calculator/mobile-layout.css`

### Styling guidance (from design-consistency-guardian)
- Override Vaul: no border-radius, thick borders, hard shadow UP
- Bottom bar buttons: chunky with text labels (not icons-only)
- Touch targets: 44px minimum
- All "use client" components (Vaul requires it)

## Phase 2: View Switching

**Goal**: List vs Results as separate views

- [ ] Create `PropertyListView.tsx` - read-only property display
- [ ] Create `ResultsView.tsx` - calculated route display
- [ ] State determines which view shows
- [ ] Calculate → auto-switch to results
- [ ] Back button or toggle to return to list
- [ ] Smooth transitions between views

## Phase 3: Feedback Overhaul

**Goal**: Replace toasts with inline feedback

- [ ] Remove Toast component usage
- [ ] Add property → item slides in with highlight animation
- [ ] Calculate → view switches (self-evident)
- [ ] Save → button state change ("✓ SAVED")
- [ ] Delete → item animates out
- [ ] Errors → inline on field or top banner

## Phase 4: State Centralization

**Goal**: Clean state management with auto-persistence

- [ ] Create `useRouteStore.ts` (Zustand)
- [ ] Centralize: properties, settings, results, view state
- [ ] Auto-persist to localStorage
- [ ] Remove StateManager component
- [ ] Components read/write from store

## Dependencies

- `vaul` - bottom sheet/drawer (Phase 1)
- `zustand` - state management (Phase 4)

## Design Notes

- Keep 50s retro styling on cards/buttons
- Layout becomes more modern/functional
- Vaul drawer gets thick borders, hard shadows going UP
- Bottom bar: chunky buttons with uppercase text labels
- Main viewport: max-width 500px, centered on desktop
- Desktop additions: keyboard shortcuts (Enter=calc, Esc=close), hover states

## Future (Not in this refactor)

- Map view integration
- Origin point feature (see TODO-origin-point-feature.md)
- Saved routes CRUD
- User management (account, subscription)
- Share & earn / referrals
- Per-property duration editing in AddSheet

## User Behavior Patterns (for reference)

1. **Add-Check-Repeat**: add → calc → add more → calc → until right → share
2. **Batch Add**: add, add, add, add → calc once
3. **Scratchpad**: quick check without saving
4. **Persistent Routes**: save/retrieve/rename/edit (future)

## Unresolved (document, decide later)

- Hamburger menu item list finalization
- Help button behavior (sheet with tutorial? external link?)
- Route auto-save vs explicit save
