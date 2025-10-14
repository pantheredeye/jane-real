import { Prisma } from "@generated/prisma";

/**
 * Creates Prisma middleware that automatically filters queries by tenantId
 * This ensures tenant data isolation at the database query level
 *
 * @param tenantId - The tenant ID to filter by
 * @returns Prisma middleware function
 */
export function createTenantMiddleware(tenantId: string) {
  return async (params: Prisma.MiddlewareParams, next: any) => {
    // Models that should be filtered by tenantId
    // UPDATE THIS ARRAY when you add new tenant-scoped models
    const tenantModels = ["Route", "RouteShare", "AuditLog", "TenantMembership"];

    if (tenantModels.includes(params.model || "")) {
      // Add tenantId to where clause for read operations
      if (params.action === "findUnique" || params.action === "findFirst") {
        params.args.where = { ...params.args.where, tenantId };
      }

      if (params.action === "findMany") {
        if (params.args.where) {
          if (params.args.where.tenantId === undefined) {
            params.args.where.tenantId = tenantId;
          }
        } else {
          params.args.where = { tenantId };
        }
      }

      // Add tenantId to data for create operations
      if (params.action === "create") {
        params.args.data = { ...params.args.data, tenantId };
      }

      if (params.action === "createMany") {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: any) => ({
            ...item,
            tenantId,
          }));
        }
      }

      // Add tenantId to where clause for update/delete operations
      if (
        params.action === "update" ||
        params.action === "updateMany" ||
        params.action === "delete" ||
        params.action === "deleteMany"
      ) {
        params.args.where = { ...params.args.where, tenantId };
      }
    }

    return next(params);
  };
}
