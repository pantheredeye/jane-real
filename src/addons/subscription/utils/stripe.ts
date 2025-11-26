/**
 * Stripe client initialization
 * Server-side only - never expose secret key to client
 */

import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(env: { STRIPE_SECRET_KEY?: string }): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add it to your .env file or wrangler secrets.'
    )
  }

  // Reuse instance if already created
  if (stripeInstance) {
    return stripeInstance
  }

  stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia',
    // Cloudflare Workers compatible
    httpClient: Stripe.createFetchHttpClient(),
  })

  return stripeInstance
}

/**
 * Stripe product and price configuration
 * These will be created in your Stripe dashboard
 */
export const STRIPE_CONFIG = {
  prices: {
    monthly: {
      priceId: 'price_1SUCzWInEoW8uwsCExSrV21F',
      amount: 999, // $9.99 in cents
    },
    annual: {
      priceId: 'price_1SVLFPInEoW8uwsCLkBAY3Gj',
      amount: 4999, // $49.99 in cents
    },
  },
} as const
