'use server'

import { db } from '@/db'
import { requestInfo, serverQuery } from 'rwsdk/worker'

export interface UserCreditsData {
  creditsRemaining: number
  isGrandfathered: boolean
  isSubscribed: boolean
}

/**
 * Get current user's credits information
 * Returns credits data for display in UI
 */
export const getUserCredits = serverQuery(async (): Promise<UserCreditsData | null> => {
  try {
    // Get current user from context
    const { ctx } = requestInfo
    const userId = ctx.user?.id

    if (!userId) {
      return null
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        creditsRemaining: true,
        grandfathered: true,
        subscriptionStatus: true,
      },
    })

    if (!user) {
      return null
    }

    const isSubscribed =
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIALING' ||
      user.subscriptionStatus === 'GRANDFATHERED'

    return {
      creditsRemaining: user.creditsRemaining,
      isGrandfathered: user.grandfathered,
      isSubscribed,
    }
  } catch (error) {
    console.error('Failed to get user credits:', error)
    return null
  }
})
