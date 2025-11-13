'use client'

import './styles.css'

export default function SuccessPage() {
  return (
    <div className="subscribe-page">
      <div className="subscribe-container">
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="#48BB78" />
            <path
              d="M20 32L28 40L44 24"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="subscribe-header">
          <h1>Welcome to RouteFast Pro!</h1>
          <p>Your 30-day free trial has started</p>
        </div>

        <div className="features-list">
          <h3>What happens next:</h3>
          <ul>
            <li>✓ Full access to all features for 30 days</li>
            <li>✓ We'll send you a reminder before your trial ends</li>
            <li>✓ You'll be charged {' '}
              <strong>only if you don't cancel</strong>
            </li>
            <li>✓ Manage your subscription anytime in settings</li>
          </ul>
        </div>

        <div className="cta-buttons">
          <a href="/route" className="cta-button">
            Start Planning Routes
          </a>
          <a href="/subscription/manage" className="secondary-button">
            Manage Subscription
          </a>
        </div>

        <div className="trial-info">
          <p>Questions? Email us at support@routefast.app</p>
        </div>
      </div>
    </div>
  )
}
