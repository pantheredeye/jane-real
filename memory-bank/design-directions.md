# Design Directions — v1 Picks

Output of `/design-review` 2026-04-26. Reconciled w/ `expo:building-native-ui` skill conventions.

**Principle**: simple first. Jane gets routes + correct times reliably before anything else. Voice, geofence, Live Activity = deferred (parked in `ideas.md`). Architect for them; don't ship them.

---

## Surface 1 — Mobile route-planning (the plant)

**Pick: Direction 1A** — Things-spine + Cron time-gutter + Linear status pills.

One vertical list. One mental model. No side panel (see §Side-panel autopsy below).

### Mapping to Expo primitives

- **Route screen** = Stack child w/ `headerLargeTitle` showing the tour name (e.g. "Today" / "Sat AM"). Large title = Things typography-as-UI for free. NEVER replace w/ a custom on-page text title.
- **List** = `ScrollView` (or `FlatList` once >20 items) w/ `contentInsetAdjustmentBehavior="automatic"`, first child of route.
- **Property row** = `Link href="/r/[id]/p/[pid]"` w/ `<Link.Menu>` long-press context menu (Lock, Edit duration, Remove). Replaces swipe actions for v1 — context menu is more discoverable, more accessible, native idiom. Add swipe later if user-test demands.
- **Time gutter** = leading flex column, `fontVariant: 'tabular-nums'`, `selectable`. Lock state = SF Symbol `lock.fill` via `expo-image` `source="sf:lock.fill"` + heavier weight on time.
- **Add property** = floating "+" pill (Magic-Plus). Tap → `presentation: "formSheet"` w/ `sheetAllowedDetents: [0.4, 1.0]`, `sheetGrabberVisible: true`, `contentStyle: { backgroundColor: "transparent" }` (liquid glass on iOS 26). Sheet contains paste field + clipboard auto-detect.
- **Edit duration** = property-row tap → `formSheet` w/ stepper (15 / 30 / 45 / 60 / custom). Live cascade preview at top of sheet.
- **Reorder** = long-press anywhere on row, drag. Use `react-native-reanimated` + `react-native-gesture-handler` later (Phase 5). For v1 read-only views, skip reorder entirely — desktop does ordering.
- **Haptics** = `expo-haptics` `Haptics.selectionAsync()` on lock, `Haptics.impactAsync('medium')` on cascade reflow.

### Hierarchy / "priority guides"

In order of dominance:
1. **Position + time gutter** — first stop is most prominent by being first.
2. **Typography weight + size** — address bold; metadata light.
3. **Color = state only** — single accent for "now"; red gutter rule for cascade conflict. NEVER color-code by category/neighborhood/agent.

### Status pills (Linear discipline)

Default state has NO pill. Pills only appear for non-default:
- `unconfirmed` — appointment not yet booked w/ listing agent
- `locked` — time pinned (also leading lock icon)
- `cascading` — time derived from previous + travel (small ◇ glyph in gutter, not a pill)

Skip `geocoded` / `scouted` for v1 (parked).

### Cascade conflict UI — load-bearing, NOT parked

When a lock + travel time make a downstream impossible: thin red rule on the time gutter at the conflict point + inline single-tap fix ("Unlock 11:00?" / "Shorten 30→20m?"). No modal. This IS the timing-correctness story Jane asked for.

---

## Surface 2 — Mobile day-of (driving)

**Pick: Direction 2A** — Now/Next stack. Architect for voice; don't ship voice in v1.

### v1 minimal shape

- Top 60%: NOW card. Address, neighborhood, ETA, listing link.
- Middle 25%: NEXT card. Time + address + drive estimate.
- Bottom 15%: dot scrubber (●●◌◌◌◌) + tour-end time.
- Primary action: Directions (deep-link to Apple/Google Maps).
- Secondary action: large circular button bottom-right, **placeholder for future voice**. v1 = "Add note" → opens text formSheet. Same affordance, evolving meaning. Don't redraw the layout when voice ships.

### Mapping to Expo primitives

- Cards = `View` w/ `borderCurve: 'continuous'`, `boxShadow` (NOT legacy elevation).
- Sun-readable contrast: dark mode is default in this view. Test 4.5:1 in bright sun.
- Auto-advance to next property: deferred. v1 = manual "Mark complete" button on NOW card.

### Deferred (architecture-aware)

Live Activity / Dynamic Island, geofence auto-advance, voice-press-and-hold — all parked. Layout designed so adding them doesn't restructure the screen.

---

## Surface 3 — Desktop route-planning

**Pick: Direction 3A** — Linear backlog. Three columns: Routes / Properties / Detail. Cmd+K command palette is the spine. Kill the phone-shim now.

Web-only (RWSDK). Same row grammar as mobile. Detail column has a Map tab (3C's idea, demoted from primary).

For v1 simplicity: build columns + drag-reorder + Cmd+K paste. Defer multi-select bulk operations, templates, route variations.

---

## Side-panel autopsy

Why it failed in Jane's head: a side panel models *properties as items in a palette, separate from the route*. Jane thinks one list — properties are born scheduled, not assigned. Two persistent regions = two mental models = collapse.

Resolution:
- **Mobile**: bottom sheet for paste. Transient, not spatial. One persistent surface ever.
- **Desktop (future)**: single inline list w/ a "pending" zone at top (Things Inbox/Today pattern) — same grammar, two zones, one list.

---

## Per-question picks

| Question | Pick | Why |
|---|---|---|
| Duration edit gesture | Tap → formSheet stepper | Glove + one-handed + SR-trivial. Drag-resize reserved for Surface 2 future. |
| Lock visual | Leading SF `lock.fill` + heavier time weight | No bg color; color reserved for state. |
| Route variations | Tab strip above list, diff badge | Visible to a stressed user. Defer to post-v1. |
| Side-panel alternative (mobile) | Bottom sheet (`formSheet`) | One persistent surface. |

---

## v1 cut-line (ship this; defer the rest)

**In v1**:
- Mobile route-planning list (1A) w/ paste sheet, tap-to-edit duration sheet, lock toggle, cascade conflict UI.
- Mobile day-of Now/Next card w/ Directions + "Add note" placeholder.
- Desktop tri-column (3A) w/ Cmd+K paste + drag-reorder.
- Same row grammar mobile + desktop.

**Deferred (parked in `ideas.md`)**:
- Voice press-and-hold + agent
- Live Activity / Dynamic Island
- Geofence auto-advance
- Pre-flight checklist
- Route templates / variations
- Property-status pills beyond `unconfirmed` / `locked`
- Showing-window hatched constraint bands
- Visible undo stack UI (system undo is fine for v1)
- Map as primary surface (lives as Detail-column tab only)
- Cmd+K on mobile (paste sheet covers it)

---

## Top 3 to build first

1. **Mobile route list (1A)** w/ time-gutter, formSheet paste, formSheet duration edit, lock toggle, cascade-conflict inline fix. ← timing-correctness story.
2. **Desktop 3A tri-column + Cmd+K paste**. ← kill phone-shim.
3. **Day-of Now/Next (2A)** w/ deferred-voice mic placeholder. ← architecture for the moat without shipping it.
