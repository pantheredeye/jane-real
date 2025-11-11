import { route } from 'rwsdk/router'
import SubscribePage from './pages/SubscribePage'
import SuccessPage from './pages/SuccessPage'
import { requireAuth } from '@/app/interruptors'

export const subscriptionRoutes = [
  // Subscription start page - requires auth
  route('/subscribe', [requireAuth, SubscribePage]),

  // Success page after checkout - requires auth
  route('/success', [requireAuth, SuccessPage]),

  // Server functions (createCheckoutSession, createPortalSession)
  // are called directly from client components - no HTTP routes needed
]
