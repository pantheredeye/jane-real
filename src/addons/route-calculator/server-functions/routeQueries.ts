"use server";

import { serverQuery, requestInfo } from "rwsdk/worker";
import { db } from "@/db";
import type { Property } from "../types";

/**
 * Get all routes for the current tenant
 */
export const getRoutes = serverQuery(async () => {
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
});
