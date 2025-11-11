import { route } from 'rwsdk/router'
import SubscribePage from './pages/SubscribePage'
import SuccessPage from './pages/SuccessPage'
import ManagePage from './pages/ManagePage'
import { requireAuth } from '@/app/interruptors'
import { getStripe } from './utils/stripe'
import { handleStripeWebhook, verifyWebhookSignature } from './server-functions/webhookHandler'

export const subscriptionRoutes = [
  // Subscription start page - requires auth
  route('/subscribe', [requireAuth, SubscribePage]),

  // Success page after checkout - requires auth
  route('/success', [requireAuth, SuccessPage]),

  // Manage subscription page - requires auth
  route('/manage', [requireAuth, ManagePage]),

  // Webhook endpoint - public, but signature verified
  route('/webhook', [
    async ({ request }) => {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
      }

      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured')
        return new Response('Webhook not configured', { status: 500 })
      }

      const stripe = getStripe(process.env)
      const event = await verifyWebhookSignature(request, webhookSecret, stripe)

      if (!event) {
        return new Response('Invalid signature', { status: 400 })
      }

      const result = await handleStripeWebhook(event, process.env)

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  ]),

  // Server functions (createCheckoutSession, createPortalSession)
  // are called directly from client components - no HTTP routes needed
]
