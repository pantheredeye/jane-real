'use server'

import { getStripe, STRIPE_CONFIG } from '../utils/stripe'
import { db } from '@/db'
import { requestInfo } from 'rwsdk/worker'
import { sessions } from '@/session/store'

type CheckoutSessionParams = {
  plan: 'monthly' | 'annual'
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<{ url: string | null; error?: string }> {
  try {
    // Get current user from session
    const session = await sessions.load(requestInfo.request)
    const userId = session?.userId
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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: priceConfig.currency,
            product_data: {
              name: STRIPE_CONFIG.products.routefast.name,
              description: STRIPE_CONFIG.products.routefast.description,
            },
            recurring: {
              interval: priceConfig.interval,
            },
            unit_amount: priceConfig.amount,
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: STRIPE_CONFIG.trial.days,
        metadata: {
          userId: user.id,
        },
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      allow_promotion_codes: true,
    })

    return { url: session.url }
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return { url: null, error: 'Failed to create checkout session' }
  }
}
