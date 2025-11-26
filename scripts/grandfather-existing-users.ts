#!/usr/bin/env tsx
/**
 * Grandfather Existing Users Script
 *
 * This script grants unlimited access to existing users who signed up before
 * the credits system was implemented. Run this ONCE during the credits system rollout.
 *
 * Usage:
 *   tsx scripts/grandfather-existing-users.ts
 */

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db'
    }
  }
});

async function main() {
  console.log('🔍 Finding users without active subscriptions...\n');

  // Find all users who:
  // 1. Don't have an active subscription (NONE status)
  // 2. Aren't already grandfathered
  const usersToGrandfather = await prisma.user.findMany({
    where: {
      subscriptionStatus: 'NONE',
      grandfathered: false
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
      subscriptionStatus: true
    }
  });

  if (usersToGrandfather.length === 0) {
    console.log('✅ No users found to grandfather. All done!');
    return;
  }

  console.log(`📋 Found ${usersToGrandfather.length} user(s) to grandfather:\n`);

  usersToGrandfather.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.email}`);
    console.log(`     - Signed up: ${user.createdAt.toLocaleDateString()}`);
    console.log(`     - Current status: ${user.subscriptionStatus}`);
    console.log('');
  });

  console.log('⏳ Updating users...\n');

  const result = await prisma.user.updateMany({
    where: {
      subscriptionStatus: 'NONE',
      grandfathered: false
    },
    data: {
      grandfathered: true
    }
  });

  console.log(`✅ Successfully grandfathered ${result.count} user(s)!`);
  console.log('');
  console.log('These users now have unlimited access and will bypass the credits system.');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
