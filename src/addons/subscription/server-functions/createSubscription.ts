'use server'

import { getStripe, STRIPE_CONFIG } from '../utils/stripe'
import { db } from '@/db'
import { requestInfo, serverAction } from 'rwsdk/worker'
import { sessions } from '@/session/store'

type CreateSubscriptionParams = {
  plan: 'monthly' | 'annual'
  paymentMethodId: string
  promoCode?: string
}

export const createSubscription = serverAction(async (
  params: CreateSubscriptionParams
): Promise<{
  success: boolean
  clientSecret?: string
  subscriptionId?: string
  error?: string
}> => {
  try {
    // Get current user from session
    const userSession = await sessions.load(requestInfo.request)
    const userId = userSession?.userId
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
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
      return { success: false, error: 'User not found' }
    }

    // Don't allow if already subscribed
    if (user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'TRIALING') {
      return { success: false, error: 'Already subscribed' }
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

    // Attach payment method to customer
    await stripe.paymentMethods.attach(params.paymentMethodId, {
      customer: customerId,
    })

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: params.paymentMethodId,
      },
    })

    // Build subscription params
    const subscriptionParams: any = {
      customer: customerId,
      items: [
        {
          price: priceConfig.priceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user.id,
      },
    }

    // Apply promo code if provided
    if (params.promoCode) {
      // Get promo code from Stripe
      const promoCodes = await stripe.promotionCodes.list({
        code: params.promoCode,
        active: true,
        limit: 1,
      })

      if (promoCodes.data.length > 0) {
        subscriptionParams.promotion_code = promoCodes.data[0].id
      } else {
        return { success: false, error: `Invalid promo code: ${params.promoCode}` }
      }
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create(subscriptionParams)

    // Get client secret for confirming payment
    const latestInvoice = subscription.latest_invoice as any
    const paymentIntent = latestInvoice?.payment_intent as any
    const clientSecret = paymentIntent?.client_secret

    if (!clientSecret) {
      return { success: false, error: 'Failed to create payment intent' }
    }

    return {
      success: true,
      clientSecret,
      subscriptionId: subscription.id,
    }
  } catch (error) {
    console.error('Subscription creation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription'
    }
  }
})
