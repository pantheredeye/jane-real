"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { PropertyInput } from "../../route-calculator/types";

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
  onAgentPropertyAdded?: (property: PropertyInput) => void;
}

interface DockContextValue {
  primary: PrimaryAction | null;
  secondary: SecondaryAction[];
  integration: AgentIntegration;
  setPrimary: (p: PrimaryAction | null) => void;
  setSecondary: (s: SecondaryAction[]) => void;
  setIntegration: (i: AgentIntegration) => void;
}

const DockContext = createContext<DockContextValue | null>(null);

interface DockProviderProps {
  children: ReactNode;
}

export function DockProvider({ children }: DockProviderProps) {
  const [primary, setPrimaryState] = useState<PrimaryAction | null>(null);
  const [secondary, setSecondaryState] = useState<SecondaryAction[]>([]);
  const [integration, setIntegrationState] = useState<AgentIntegration>({});

  const setPrimary = useCallback((p: PrimaryAction | null) => {
    setPrimaryState(p);
  }, []);

  const setSecondary = useCallback((s: SecondaryAction[]) => {
    setSecondaryState(s);
  }, []);

  const setIntegration = useCallback((i: AgentIntegration) => {
    setIntegrationState(i);
  }, []);

  const value = useMemo<DockContextValue>(
    () => ({
      primary,
      secondary,
      integration,
      setPrimary,
      setSecondary,
      setIntegration,
    }),
    [primary, secondary, integration, setPrimary, setSecondary, setIntegration],
  );

  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

export function useDock(): DockContextValue {
  const ctx = useContext(DockContext);
  if (!ctx) {
    throw new Error("useDock must be used within a <DockProvider>");
  }
  return ctx;
}
