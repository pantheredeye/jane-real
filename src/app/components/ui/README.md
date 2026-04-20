# `ui/` — Interactive primitives

Thin wrappers over [Base UI](https://base-ui.com/) (`@base-ui/react`). Single source of truth for Dialog, Popover, Select, Menu, Sheet, Tooltip, Switch, Checkbox, RadioGroup, Combobox, Tabs, Field.

## Policy

- **New primitive needed?** Add the wrapper here first, then consume it. Never hand-roll `role="dialog"`, custom popovers, native `<select>` for styled selects, etc.
- **One primitive per file.** Filename = Base UI part name (`Dialog.tsx`, `Popover.tsx`, ...).
- **All files `"use client"`.**
- **Styling**: reuse existing utility classes (`.glass-card`, `.btn-action`, `.card-base`, `.input-base`). Extend CSS to target Base UI's `data-[state=...]` attributes. No new design tokens without a reason.
- **Feature composites stay in their feature dir** and compose `ui/` primitives — not replaced, re-implemented. Example: `route-calculator/ErrorModal.tsx` composes `ui/AlertDialog`.
- **Direct `@base-ui/react` imports are banned outside `ui/`.** CI enforces this (Phase 5).

## Status

Phase 0 complete — foundation only. See `/UI_OVERHAUL_TODO.md` for the phased migration plan and current inventory.
