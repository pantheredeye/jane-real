import { defineScript } from "rwsdk/worker";
import { db, setupDb } from "@/db";

export default defineScript(async ({ env }) => {
  await setupDb(env);

  console.log("🌱 Starting seed...");

  // Clear existing data — D1 requires single-statement raw SQL per call
  await db.$executeRawUnsafe(`DELETE FROM AuditLog`);
  await db.$executeRawUnsafe(`DELETE FROM RouteShare`);
  await db.$executeRawUnsafe(`DELETE FROM Route`);
  await db.$executeRawUnsafe(`DELETE FROM TenantMembership`);
  await db.$executeRawUnsafe(`DELETE FROM Tenant`);
  await db.$executeRawUnsafe(`DELETE FROM Credential`);
  await db.$executeRawUnsafe(`DELETE FROM User`);
  await db.$executeRawUnsafe(`DELETE FROM sqlite_sequence`);

  console.log("✓ Cleared existing data");

  // Create test users
  const jane = await db.user.create({
    data: {
      id: "user-jane",
      username: "jane",
      email: "jane@example.com",
      name: "Jane Smith",
    },
  });

  const bob = await db.user.create({
    data: {
      id: "user-bob",
      username: "bob",
      email: "bob@example.com",
      name: "Bob Assistant",
    },
  });

  const sarah = await db.user.create({
    data: {
      id: "user-sarah",
      username: "sarah",
      email: "sarah@example.com",
      name: "Sarah Client",
    },
  });

  console.log("✓ Created users: Jane (realtor), Bob (assistant), Sarah (client)");

  // Create tenant for Jane
  const janeTenant = await db.tenant.create({
    data: {
      id: "tenant-jane",
      name: "Jane Smith Realty",
      slug: "jane-smith-realty",
      status: "TRIAL",
    },
  });

  console.log("✓ Created tenant: Jane Smith Realty");

  // Create tenant memberships
  await db.tenantMembership.create({
    data: {
      tenantId: janeTenant.id,
      userId: jane.id,
      role: "OWNER",
    },
  });

  await db.tenantMembership.create({
    data: {
      tenantId: janeTenant.id,
      userId: bob.id,
      role: "MEMBER",
    },
  });

  await db.tenantMembership.create({
    data: {
      tenantId: janeTenant.id,
      userId: sarah.id,
      role: "GUEST",
    },
  });

  console.log("✓ Created memberships: Jane (OWNER), Bob (MEMBER), Sarah (GUEST)");

  // Create a sample route
  const route = await db.route.create({
    data: {
      id: "route-sample",
      tenantId: janeTenant.id,
      createdById: jane.id,
      name: "Downtown Showings - March 15",
      date: new Date("2025-03-15T09:00:00Z"),
      startTime: "09:00",
      properties: JSON.stringify([
        {
          address: "123 Main St, Memphis, TN",
          duration: 30,
          lat: 35.1495,
          lng: -90.0490,
        },
        {
          address: "456 Oak Ave, Memphis, TN",
          duration: 30,
          lat: 35.1390,
          lng: -90.0520,
        },
      ]),
      optimized: 1,
    },
  });

  console.log("✓ Created sample route");

  // Share route with Sarah
  await db.routeShare.create({
    data: {
      routeId: route.id,
      sharedById: jane.id,
      sharedWithUserId: sarah.id,
      permission: "VIEW",
    },
  });

  console.log("✓ Shared route with Sarah (client)");

  console.log("\n🌱 Seed complete!");
  console.log("\nTest accounts:");
  console.log("  - Jane (OWNER): jane@example.com");
  console.log("  - Bob (MEMBER): bob@example.com");
  console.log("  - Sarah (GUEST): sarah@example.com");
});
