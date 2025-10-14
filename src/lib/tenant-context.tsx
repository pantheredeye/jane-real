"use client";

import { createContext, useContext } from "react";
import type { Tenant, TenantMembership, MemberRole } from "@generated/prisma";

export interface TenantContextValue {
  tenant: Tenant | null;
  membership: TenantMembership | null;
  role: MemberRole | null;
  isOwner: boolean;
  isMember: boolean;
  isGuest: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

/**
 * Hook to access tenant context in client components
 * @throws Error if used outside TenantProvider
 */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
}

/**
 * Optional hook that returns null if no tenant context available
 */
export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext);
}

export const TenantProvider = TenantContext.Provider;
