/**
 * Migration script to grandfather existing users
 * Run once to mark all existing users as grandfathered (free forever)
 *
 * Usage:
 *   tsx src/scripts/grandfather-existing-users.ts
 */

import { db, setupDb } from '@/db'

async function grandfatherExistingUsers() {
  console.log('Starting grandfather migration...')

  // Setup database connection
  await setupDb(process.env)

  // Find all users without a subscription status set
  const users = await db.user.findMany({
    where: {
      subscriptionStatus: 'NONE',
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  })

  console.log(`Found ${users.length} users to grandfather`)

  if (users.length === 0) {
    console.log('No users to grandfather. Done.')
    return
  }

  // Mark all as grandfathered
  const result = await db.user.updateMany({
    where: {
      subscriptionStatus: 'NONE',
    },
    data: {
      grandfathered: true,
      subscriptionStatus: 'GRANDFATHERED',
    },
  })

  console.log(`✓ Grandfathered ${result.count} users`)
  console.log('\nGrandfathered users:')
  users.forEach((user) => {
    console.log(`  - ${user.email} (joined ${user.createdAt.toLocaleDateString()})`)
  })

  console.log('\nMigration complete!')
}

// Run the migration
grandfatherExistingUsers().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
