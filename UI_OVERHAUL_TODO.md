# UI Overhaul — Base UI Adoption

Living plan. Opportunistic cadence — work a phase when you're in the area, not on a schedule. One primitive per session. Functional at every step.

## Goal

Stop hand-rolling primitives. Adopt **Base UI** (`@base-ui-components/react`) as headless foundation. Preserve existing glassmorphism + neubrutalism CSS tokens. Eventually replace `vaul`. Give AI agents a single authoritative source so they quit reinventing Dialogs/Popovers/Selects.

## Architecture

- `src/app/components/ui/` — thin wrappers, one primitive per file, all `"use client"`
- Wrappers render Base UI parts; styling comes from existing utility classes (`.glass-card`, `.btn-action`, `.card-base`, `.input-base`)
- Expose Base UI `data-[state=open|closed|checked|...]` attrs; extend existing CSS to target them
- Zero new design tokens in Phase 0. Only add when a state isn't already styled.
- Capacitor context: safe-area insets + touch gestures must work on iOS/Android shell — relevant only for Sheet phase.

## Naming

- Wrappers use Base UI names: `Dialog`, `AlertDialog`, `Popover`, `Select`, `Combobox`, `Tabs`, `Tooltip`, `Switch`, `Checkbox`, `RadioGroup`, `Menu`, `Field`, `Sheet`
- Feature-specific composites stay in their dirs (e.g. `ErrorModal.tsx` in route-calculator) and *compose* `ui/AlertDialog` — not replaced, re-implemented.

## Decisions locked

- **TheaterModal** — keep as `Dialog` + theater variant class. Used by landing `DemoButton`.
- **ChatPanel** — stays non-modal docked panel. Drop `role="dialog"`, keep it as a focusable side/bottom panel (no backdrop, no scroll lock). Route-calculator stays usable while chat is open.
- **Sheet / vaul** — keep `vaul` until Capacitor device testing is available. Phase 3 is *deferred*.
- **Cadence** — opportunistic. Touch a phase when you're already editing files in its scope.
- **Enforcement** — CI grep (see Phase 5 + "CI enforcement" section below).

## Inventory (from grep)

Hand-rolled dialogs:
- `src/addons/route-calculator/components/ErrorModal.tsx`
- `src/addons/route-calculator/components/ConfirmDialog.tsx`
- `src/addons/route-calculator/components/SaveRouteDialog.tsx`
- `src/app/components/shared/theaterModal/TheaterModal.tsx`
- `src/addons/agent/components/ChatPanel.tsx` — demote to non-modal panel during Phase 1

Vaul drawers:
- `src/addons/route-calculator/components/MenuSheet.tsx`
- refs in `route-calculator/styles.css`

Custom selects / radios:
- `DurationSelector` (segmented radio)
- `PropertyInputBox` (combobox-adjacent)

Menus / popovers (Phase 0 grep):
- `src/addons/route-calculator/components/PropertyListItem.tsx` (`aria-expanded={isMenuOpen}` — per-item menu)
- `src/addons/route-calculator/components/RouteOptionsCard.tsx` (`aria-expanded={false}` — toggle button)

Tooltips: none found.

Native controls that should move to `ui/`:
- `<select>` — `src/addons/route-calculator/components/StartingLocationCard.tsx:144`
- radio inputs — `StartingLocationCard.tsx` (start-from options)
- checkbox — `src/app/pages/user/Signup.tsx:216`

---

## Phase 0 — Foundation

- [x] `pnpm add @base-ui/react` (upstream renamed from `@base-ui-components/react`; installed `1.4.0`)
- [x] Create `src/app/components/ui/` + `ui/README.md` stating the policy
- [x] Full grep inventory of hand-rolled primitives; appended above
- [x] Add CLAUDE.md section: "Interactive primitives MUST come from `src/app/components/ui/`. Never hand-roll Dialog/Popover/Select/Menu/Sheet/Tooltip. New primitives: add a wrapper to `ui/` first, then consume."
- [ ] Commit: no behavior change

## Phase 1 — Dialog family

- [ ] `ui/Dialog.tsx` — Base UI `Dialog` w/ `.glass-card` panel, overlay, focus trap, ESC
- [ ] `ui/AlertDialog.tsx` — destructive-confirm variant
- [ ] Migrate `ErrorModal` → composes `AlertDialog`
- [ ] Migrate `ConfirmDialog` → composes `AlertDialog`
- [ ] Migrate `SaveRouteDialog` → composes `Dialog`
- [ ] Migrate `TheaterModal` → `Dialog` w/ theater variant class
- [ ] `ChatPanel` — drop `role="dialog"` + backdrop, convert to non-modal docked panel (no `ui/` dep needed)
- [ ] `pnpm check` green + dev-server smoke on each migrated screen

Exit criterion: zero `role="dialog"` strings outside `src/app/components/ui/`.

## Phase 2 — Popover / Menu / Tooltip

- [ ] `ui/Popover.tsx`
- [ ] `ui/Menu.tsx` (DropdownMenu — items, separators, submenu)
- [ ] `ui/Tooltip.tsx`
- [ ] Migrate existing call sites

## Phase 3 — Sheet (replace vaul) — deferred until Capacitor devices available

Rationale: vaul's touch physics are battle-tested. Replacing without iOS/Android smoke risks a regression right as you're starting Capacitor work. Keep vaul; revisit when you have devices.

- [ ] `ui/Sheet.tsx` — Base UI `Dialog` + bottom-sheet transform + swipe-down dismiss
  - Pointer gesture on drag handle
  - Safe-area inset padding for Capacitor iOS
- [ ] Migrate `MenuSheet` → `ui/Sheet`
- [ ] Remove vaul CSS from `route-calculator/styles.css`
- [ ] `pnpm rm vaul`
- [ ] Capacitor smoke: iOS + Android

## Phase 4 — Form primitives

- [ ] `ui/Field.tsx` — label + control + error + description a11y wiring
- [ ] `ui/Switch.tsx`
- [ ] `ui/Checkbox.tsx`
- [ ] `ui/RadioGroup.tsx`
- [ ] Migrate `DurationSelector` → `RadioGroup` w/ segmented styling
- [ ] `ui/Select.tsx`
- [ ] `ui/Combobox.tsx`
- [ ] Plan (don't execute) `PropertyInputBox` refactor onto `Combobox` — separate effort

## Phase 5 — Enforce & harvest

- [ ] Wire CI grep (see below) into `pnpm check` or a dedicated `pnpm lint:ui`
- [ ] CLAUDE.md: enumerate every `ui/` primitive w/ one-line usage example
- [ ] Run `design-consistency-guardian` full audit
- [ ] Delete any remaining legacy modal/drawer scaffolding

---

## CI enforcement (plan — implement in Phase 5)

Cheap version that catches 90% of drift:

Add `scripts/lint-ui.sh` (or inline in package.json):

```bash
#!/usr/bin/env bash
set -e

# 1. No role="dialog" outside ui/
bad=$(rg -l 'role="dialog"|role='"'"'dialog'"'" src --glob '!src/app/components/ui/**' || true)
[ -n "$bad" ] && { echo "role=dialog outside ui/:"; echo "$bad"; exit 1; }

# 2. No <dialog> element — use ui/Dialog
bad=$(rg -l '<dialog' src --glob '!src/app/components/ui/**' || true)
[ -n "$bad" ] && { echo "<dialog> outside ui/:"; echo "$bad"; exit 1; }

# 3. No direct base-ui imports outside ui/
bad=$(rg -l '@base-ui-components/react' src --glob '!src/app/components/ui/**' || true)
[ -n "$bad" ] && { echo "base-ui import outside ui/:"; echo "$bad"; exit 1; }

# 4. No vaul imports (after Phase 3)
# bad=$(rg -l 'from .vaul.' src || true)
# [ -n "$bad" ] && { echo "vaul import (should be removed):"; echo "$bad"; exit 1; }

echo "ui lint ok"
```

Wire: `"lint:ui": "bash scripts/lint-ui.sh"` + add to `check` script. Rule 4 stays commented until Phase 3 closes. Grow the list as new primitives land (e.g. ban `<select>` once `ui/Select` exists).

Upgrade path if this gets noisy: ESLint custom rule w/ `no-restricted-imports` + `no-restricted-syntax`. Not worth it yet.

---

## How to work this plan

Opportunistic rhythm:

1. **You're about to touch a file** — check inventory above. If the file is in there and its phase is open, do the migration as part of your task instead of hand-editing.
2. **Agent session starts** — point Claude at `UI_OVERHAUL_TODO.md`. Say: "work the next unchecked item in Phase N, one primitive, then stop." Agent picks the item, follows guardrails, updates checkbox + commits.
3. **One primitive per session** — creates `ui/<Primitive>.tsx` + migrates one caller + smokes it. Don't chain primitives in a single session; consistency comes from small verified steps.
4. **Old + new coexist mid-phase** — fine. Just don't close a phase with stragglers.
5. **Visual regression** — before editing a screen, screenshot it. After, screenshot again. Eyeball side-by-side. Attach pair to commit message (or just keep in `~/tmp`, not checked in).
6. **Close a phase** — all items checked + exit criterion met + `pnpm check` clean. Then update CLAUDE.md primitive list.
7. **Harvest** — when a migration reveals a missing token / utility, add it to the design system (not the wrapper) so other wrappers benefit.
8. **Stuck** — if a migration breaks something you can't fix in-session, revert, leave a TODO in the caller pointing at this file, move on. Don't half-migrate.

### First session checklist

Open a session, say: "Execute Phase 0 of `UI_OVERHAUL_TODO.md`." Agent:

- installs base-ui
- creates `src/app/components/ui/` + README w/ policy
- runs full inventory greps, appends findings here
- edits `CLAUDE.md` to add the ui/ rule
- commits, no behavior change

Expected diff: 1 file added (ui/README.md), 2 edited (package.json, CLAUDE.md, this file).

---

## Guardrails (every phase)

- One primitive per PR/session. Merge only when callers migrated for that primitive.
- Old + new coexist *only* within a phase — never leave a half-migrated primitive at phase close.
- `pnpm check` before commit.
- Screenshot pair (before/after) for any visually user-facing change.
- Run dev server + click the feature before marking done.
- Capacitor smoke required before declaring Phase 3 complete.

## Non-goals

- Tailwind adoption
- Visual redesign / new design tokens
- `PropertyInputBox` rebuild (post-Phase 4)
- New feature work layered on overhaul

## Open questions

- (none outstanding — reopen as phases execute)
