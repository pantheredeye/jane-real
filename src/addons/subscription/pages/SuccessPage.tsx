'use client'

import './styles.css'

export default function SuccessPage() {
  return (
    <div className="subscribe-page">
      <div className="subscribe-container">
        <div className="success-icon">
          <div className="icon-circle">
            ✓
          </div>
        </div>

        <div className="subscribe-header">
          <h1>You're All Set!</h1>
          <p>30-day free trial activated</p>
        </div>

        <div className="features-list">
          <h3>What's Next:</h3>
          <ul>
            <li>Full access to all features for 30 days</li>
            <li>Reminder before trial ends</li>
            <li>Only charged if you don't cancel</li>
            <li>Manage subscription anytime</li>
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
