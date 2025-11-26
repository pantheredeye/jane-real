'use server'

import { db } from '@/db'
import { requestInfo } from 'rwsdk/worker'
import { sessions } from '@/session/store'

export interface UserCreditsData {
  creditsRemaining: number
  isGrandfathered: boolean
  isSubscribed: boolean
}

/**
 * Get current user's credits information
 * Returns credits data for display in UI
 */
export async function getUserCredits(): Promise<UserCreditsData | null> {
  try {
    // Get current user from session
    const userSession = await sessions.load(requestInfo.request)
    const userId = userSession?.userId

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
}
