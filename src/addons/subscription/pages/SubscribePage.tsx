// Server Component - reads env and passes to client
import SubscribePageClient from './SubscribePageClient'

export default function SubscribePage() {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || ''

  if (!publishableKey) {
    return (
      <div className="subscribe-page">
        <div className="subscribe-container">
          <div className="error-message">
            Stripe is not configured. Please add STRIPE_PUBLISHABLE_KEY to your environment.
          </div>
        </div>
      </div>
    )
  }

  return <SubscribePageClient publishableKey={publishableKey} />
}
