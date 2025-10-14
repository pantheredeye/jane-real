import { PrismaClient } from "@generated/prisma";
import { PrismaD1 } from "@prisma/adapter-d1";
import { createTenantMiddleware } from "./prisma-middleware";
import { env } from "cloudflare:workers";

/**
 * Create a tenant-scoped Prisma client
 * All queries will be automatically filtered by the provided tenantId
 *
 * @param tenantId - The tenant ID to scope queries to
 * @returns PrismaClient instance with tenant middleware applied
 */
export function getTenantDb(tenantId: string): PrismaClient {
  const client = new PrismaClient({
    // @ts-ignore - D1 adapter type compatibility
    adapter: new PrismaD1(env.DB),
  });

  // Apply tenant isolation middleware
  client.$use(createTenantMiddleware(tenantId));

  return client;
}

/**
 * Helper to dispose of tenant-scoped client when done
 *
 * @param client - The PrismaClient to disconnect
 */
export async function disposeTenantDb(client: PrismaClient): Promise<void> {
  await client.$disconnect();
}
