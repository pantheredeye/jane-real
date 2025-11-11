'use client'

import { useState } from 'react'
import { createPortalSession } from '../server-functions/createPortalSession'
import './styles.css'

type User = {
  email: string
  subscriptionStatus: string
  subscriptionPlan: string | null
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  grandfathered: boolean
}

export default function ManagePageClient({ user }: { user: User }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleManageSubscription = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await createPortalSession(
        `${window.location.origin}/subscription/manage`
      )

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      setError('Failed to open subscription management. Please try again.')
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (user.grandfathered) {
      return <span className="status-badge status-grandfathered">Grandfathered 🎉</span>
    }

    switch (user.subscriptionStatus) {
      case 'TRIALING':
        return <span className="status-badge status-trial">Free Trial</span>
      case 'ACTIVE':
        return <span className="status-badge status-active">Active</span>
      case 'PAST_DUE':
        return <span className="status-badge status-warning">Payment Failed</span>
      case 'CANCELED':
        return <span className="status-badge status-canceled">Canceled</span>
      default:
        return <span className="status-badge status-none">No Subscription</span>
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getPlanName = () => {
    if (user.grandfathered) return 'Grandfathered (Free Forever)'
    if (user.subscriptionPlan === 'annual') return 'Annual ($49.99/year)'
    if (user.subscriptionPlan === 'monthly') return 'Monthly ($9.99/month)'
    return 'None'
  }

  return (
    <div className="subscribe-page">
      <div className="subscribe-container">
        <div className="subscribe-header">
          <h1>Subscription Management</h1>
          <p>{user.email}</p>
        </div>

        <div className="subscription-details">
          <div className="detail-row">
            <span className="detail-label">Status</span>
            {getStatusBadge()}
          </div>

          <div className="detail-row">
            <span className="detail-label">Plan</span>
            <span className="detail-value">{getPlanName()}</span>
          </div>

          {user.subscriptionStatus === 'TRIALING' && user.trialEndsAt && (
            <div className="detail-row">
              <span className="detail-label">Trial Ends</span>
              <span className="detail-value">{formatDate(user.trialEndsAt)}</span>
            </div>
          )}

          {user.subscriptionStatus === 'ACTIVE' && user.currentPeriodEnd && (
            <div className="detail-row">
              <span className="detail-label">
                {user.cancelAtPeriodEnd ? 'Cancels On' : 'Renews On'}
              </span>
              <span className="detail-value">{formatDate(user.currentPeriodEnd)}</span>
            </div>
          )}

          {user.grandfathered && (
            <div className="info-box grandfathered-box">
              <p>
                <strong>Thank you for being an early supporter!</strong>
              </p>
              <p>
                You have lifetime free access to RouteFast as a thank you for being one of our
                first users.
              </p>
            </div>
          )}

          {user.subscriptionStatus === 'NONE' && !user.grandfathered && (
            <div className="info-box">
              <p>You don't have an active subscription.</p>
              <a href="/subscription/subscribe" className="cta-button">
                Start Free Trial
              </a>
            </div>
          )}
        </div>

        {!user.grandfathered && user.subscriptionStatus !== 'NONE' && (
          <>
            {error && <div className="error-message">{error}</div>}

            <button
              className="secondary-button"
              onClick={handleManageSubscription}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Manage Subscription in Stripe'}
            </button>

            <div className="portal-info">
              <p className="small">
                You can update your payment method, cancel your subscription, or view invoices in
                the Stripe Customer Portal.
              </p>
            </div>
          </>
        )}

        <div className="back-link">
          <a href="/route">← Back to Route Calculator</a>
        </div>
      </div>
    </div>
  )
}
