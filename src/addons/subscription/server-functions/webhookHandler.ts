import Stripe from 'stripe'
import { getStripe } from '../utils/stripe'
import { db } from '@/db'

/**
 * Handles Stripe webhook events
 * Must be called from a POST endpoint that verifies the webhook signature
 */
export async function handleStripeWebhook(
  event: Stripe.Event,
  env: { STRIPE_SECRET_KEY?: string }
): Promise<{ success: boolean; message: string }> {
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancellation(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSuccess(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailure(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return { success: true, message: `Processed ${event.type}` }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return { success: false, message: 'Webhook processing failed' }
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  // Map Stripe status to our enum
  const statusMap: Record<string, string> = {
    incomplete: 'NONE',
    incomplete_expired: 'NONE',
    trialing: 'TRIALING',
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    unpaid: 'UNPAID',
  }

  const subscriptionStatus = statusMap[subscription.status] || 'NONE'

  // Determine plan from price interval
  const priceInterval = subscription.items.data[0]?.price?.recurring?.interval
  const subscriptionPlan = priceInterval === 'year' ? 'annual' : 'monthly'

  await db.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscriptionStatus as any,
      subscriptionPlan,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  console.log(`Updated subscription for user ${userId}: ${subscriptionStatus}`)
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  await db.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'CANCELED',
      stripeSubscriptionId: null,
    },
  })

  console.log(`Canceled subscription for user ${userId}`)
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  // Payment succeeded - subscription should already be active from subscription.updated
  // This is mainly for logging/notifications
  const customerId = invoice.customer as string
  console.log(`Payment succeeded for customer ${customerId}`)
}

async function handlePaymentFailure(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Find user by customer ID
  const user = await db.user.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (user) {
    // Mark as past due - Stripe will handle retries
    await db.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'PAST_DUE',
      },
    })

    console.log(`Payment failed for user ${user.id}, marked as PAST_DUE`)
  }
}

/**
 * Verifies Stripe webhook signature and constructs event
 */
export async function verifyWebhookSignature(
  request: Request,
  webhookSecret: string,
  stripe: Stripe
): Promise<Stripe.Event | null> {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('No stripe-signature header')
      return null
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    return event
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return null
  }
}
