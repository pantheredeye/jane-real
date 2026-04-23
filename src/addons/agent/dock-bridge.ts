// Lightweight window-event bridge so in-page React trees (e.g. route-calc
// AppShell / HomePage) can publish dock state. The dock lives in a separate
// React root mounted on <body>, so we can't prop-drill. A global registry +
// "request current state" event keeps things decoupled — no context needed.
//
// Three channels:
//   1. Primary action (label, disabled, onAction) — the Calculate button.
//   2. Secondary actions — entries in the `⋯` menu.
//   3. Integration — per-page handlers the dock dispatches *server-originated*
//      events to (e.g. the agent called `addPropertyToRoute`; the page that
//      owns property state adds it to the list).

import type { PropertyInput } from "../route-calculator/types";

export interface PrimaryAction {
  label: string;
  disabled?: boolean;
  onAction: () => void;
  success?: boolean;
}

export interface SecondaryAction {
  id: string;
  label: string;
  disabled?: boolean;
  onAction: () => void;
}

export interface AgentIntegration {
  // Called when the agent's server tool `addPropertyToRoute` emits a property.
  // The page that hosts the route-calc property list should push it in.
  onAgentPropertyAdded?: (property: PropertyInput) => void;
}

interface BridgeState {
  primary: PrimaryAction | null;
  secondary: SecondaryAction[];
  integration: AgentIntegration;
}

interface DockGlobal {
  state: BridgeState;
}

const GLOBAL_KEY = "__routefast_dock_bridge__";

function getBridge(): DockGlobal {
  if (typeof window === "undefined") {
    return {
      state: { primary: null, secondary: [], integration: {} },
    };
  }
  const w = window as unknown as Record<string, DockGlobal | undefined>;
  if (!w[GLOBAL_KEY]) {
    w[GLOBAL_KEY] = {
      state: { primary: null, secondary: [], integration: {} },
    };
  }
  return w[GLOBAL_KEY] as DockGlobal;
}

export const EVT_STATE_CHANGED = "routefast:dock-state-changed";
export const EVT_REQUEST_STATE = "routefast:dock-request-state";

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVT_STATE_CHANGED));
}

export function setPrimaryAction(action: PrimaryAction | null) {
  const bridge = getBridge();
  bridge.state.primary = action;
  emit();
}

export function setSecondaryActions(actions: SecondaryAction[]) {
  const bridge = getBridge();
  bridge.state.secondary = actions;
  emit();
}

export function setAgentIntegration(integration: AgentIntegration) {
  const bridge = getBridge();
  bridge.state.integration = integration;
  emit();
}

export function getState(): BridgeState {
  return getBridge().state;
}

// Dock mounts after the page tree; ask publishers to re-emit their state.
export function requestState() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVT_REQUEST_STATE));
}
