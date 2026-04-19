'use server'

import { getStripe, STRIPE_CONFIG } from '../utils/stripe'
import { db } from '@/db'
import { requestInfo, serverAction } from 'rwsdk/worker'
import { sessions } from '@/session/store'
import { env } from 'cloudflare:workers'

function isValidReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const appOrigin = new URL((env as { APP_URL?: string }).APP_URL || 'https://routefast.app').origin
    return parsed.origin === appOrigin
  } catch {
    return false
  }
}

type CheckoutSessionParams = {
  plan: 'monthly' | 'annual'
  successUrl: string
  cancelUrl: string
}

export const createCheckoutSession = serverAction(async (
  params: CheckoutSessionParams
): Promise<{ url: string | null; error?: string }> => {
  try {
    // Get current user from session
    const userSession = await sessions.load(requestInfo.request)
    const userId = userSession?.userId
    if (!userId) {
      return { url: null, error: 'Not authenticated' }
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
      },
    })

    if (!user) {
      return { url: null, error: 'User not found' }
    }

    // Don't allow if already subscribed
    if (user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'TRIALING') {
      return { url: null, error: 'Already subscribed' }
    }

    const stripe = getStripe(process.env)
    const priceConfig = STRIPE_CONFIG.prices[params.plan]

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID
      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Validate return URLs to prevent open redirect
    const appOriginFallback = (env as { APP_URL?: string }).APP_URL || 'https://routefast.app'
    const successUrl = isValidReturnUrl(params.successUrl) ? params.successUrl : `${appOriginFallback}/route/`
    const cancelUrl = isValidReturnUrl(params.cancelUrl) ? params.cancelUrl : `${appOriginFallback}/route/`

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceConfig.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    })

    return { url: session.url }
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return { url: null, error: 'Failed to create checkout session' }
  }
})
