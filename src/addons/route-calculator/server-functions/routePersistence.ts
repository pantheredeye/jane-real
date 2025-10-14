"use server";

import { requestInfo } from "rwsdk/worker";
import { db } from "@/db";
import type { Property } from "../types";

/**
 * Save a calculated route to the database
 */
export async function saveRoute({
  name,
  date,
  startTime,
  properties,
  optimized,
  frozen,
}: {
  name: string;
  date: Date;
  startTime?: string;
  properties: Property[];
  optimized: boolean;
  frozen?: Record<number, string>;
}) {
  const { ctx } = requestInfo;

  if (!ctx.user || !ctx.tenant) {
    throw new Error("User must be authenticated with active tenant");
  }

  const route = await db.route.create({
    data: {
      tenantId: ctx.tenant.id,
      createdById: ctx.user.id,
      name,
      date,
      startTime: startTime ?? null,
      properties: JSON.stringify(properties),
      optimized: optimized ? 1 : 0,
      frozen: frozen ? JSON.stringify(frozen) : null,
    },
  });

  return route;
}

/**
 * Get all routes for the current tenant
 */
export async function getRoutes() {
  const { ctx } = requestInfo;

  if (!ctx.user || !ctx.tenant) {
    throw new Error("User must be authenticated with active tenant");
  }

  const routes = await db.route.findMany({
    where: {
      tenantId: ctx.tenant.id,
    },
    orderBy: {
      date: "desc",
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Parse JSON fields
  return routes.map((route) => ({
    ...route,
    properties: JSON.parse(route.properties) as Property[],
    optimized: route.optimized === 1,
    frozen: route.frozen ? JSON.parse(route.frozen) : null,
  }));
}

/**
 * Get a single route by ID
 */
export async function getRoute(routeId: string) {
  const { ctx } = requestInfo;

  if (!ctx.user || !ctx.tenant) {
    throw new Error("User must be authenticated with active tenant");
  }

  const route = await db.route.findUnique({
    where: {
      id: routeId,
      tenantId: ctx.tenant.id,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!route) {
    return null;
  }

  return {
    ...route,
    properties: JSON.parse(route.properties) as Property[],
    optimized: route.optimized === 1,
    frozen: route.frozen ? JSON.parse(route.frozen) : null,
  };
}

/**
 * Update an existing route
 */
export async function updateRoute({
  routeId,
  name,
  date,
  startTime,
  properties,
  optimized,
  frozen,
}: {
  routeId: string;
  name?: string;
  date?: Date;
  startTime?: string;
  properties?: Property[];
  optimized?: boolean;
  frozen?: Record<number, string>;
}) {
  const { ctx } = requestInfo;

  if (!ctx.user || !ctx.tenant) {
    throw new Error("User must be authenticated with active tenant");
  }

  const route = await db.route.update({
    where: {
      id: routeId,
      tenantId: ctx.tenant.id,
    },
    data: {
      ...(name !== undefined && { name }),
      ...(date !== undefined && { date }),
      ...(startTime !== undefined && { startTime }),
      ...(properties !== undefined && { properties: JSON.stringify(properties) }),
      ...(optimized !== undefined && { optimized: optimized ? 1 : 0 }),
      ...(frozen !== undefined && { frozen: frozen ? JSON.stringify(frozen) : null }),
    },
  });

  return {
    ...route,
    properties: JSON.parse(route.properties) as Property[],
    optimized: route.optimized === 1,
    frozen: route.frozen ? JSON.parse(route.frozen) : null,
  };
}

/**
 * Delete a route
 */
export async function deleteRoute(routeId: string) {
  const { ctx } = requestInfo;

  if (!ctx.user || !ctx.tenant) {
    throw new Error("User must be authenticated with active tenant");
  }

  // Check permission: only creator or OWNER can delete
  const route = await db.route.findUnique({
    where: {
      id: routeId,
      tenantId: ctx.tenant.id,
    },
    select: {
      createdById: true,
    },
  });

  if (!route) {
    throw new Error("Route not found");
  }

  const isCreator = route.createdById === ctx.user.id;
  const isOwner = ctx.membership?.role === "OWNER";

  if (!isCreator && !isOwner) {
    throw new Error("Only route creator or tenant owner can delete routes");
  }

  await db.route.delete({
    where: {
      id: routeId,
    },
  });

  return { success: true };
}
