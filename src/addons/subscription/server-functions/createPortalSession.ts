'use server'

import { getStripe } from '../utils/stripe'
import { getSessionUserId } from '@/session/sessionManager'
import { db } from '@/db'

export async function createPortalSession(
  returnUrl: string,
  request: Request
): Promise<{ url: string | null; error?: string }> {
  try {
    // Get current user
    const userId = await getSessionUserId(request)
    if (!userId) {
      return { url: null, error: 'Not authenticated' }
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
      },
    })

    if (!user?.stripeCustomerId) {
      return { url: null, error: 'No Stripe customer found' }
    }

    const stripe = getStripe(process.env)

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    })

    return { url: session.url }
  } catch (error) {
    console.error('Portal session creation failed:', error)
    return { url: null, error: 'Failed to create portal session' }
  }
}
