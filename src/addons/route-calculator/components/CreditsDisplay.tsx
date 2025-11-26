'use client'

import { useState, useEffect } from 'react'
import './credits-display.css'

interface CreditsDisplayProps {
  creditsRemaining: number
  isGrandfathered: boolean
  isSubscribed: boolean
}

export function CreditsDisplay({
  creditsRemaining,
  isGrandfathered,
  isSubscribed
}: CreditsDisplayProps) {
  const [showWarning, setShowWarning] = useState(false)

  // Don't show for grandfathered users or active subscribers
  if (isGrandfathered || isSubscribed) {
    return null
  }

  // Show warning banner if credits < 5
  useEffect(() => {
    if (creditsRemaining < 5 && creditsRemaining > 0) {
      setShowWarning(true)
    }
  }, [creditsRemaining])

  const isLow = creditsRemaining < 5
  const isCritical = creditsRemaining < 3

  return (
    <>
      {/* Credits badge in header */}
      <div className={`credits-badge ${isLow ? 'credits-low' : ''} ${isCritical ? 'credits-critical' : ''}`}>
        <span className="credits-icon">⚡</span>
        <span className="credits-count">{creditsRemaining}</span>
      </div>

      {/* Warning banner */}
      {showWarning && (
        <div className="credits-warning-banner">
          <div className="credits-warning-content">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              You have {creditsRemaining} credit{creditsRemaining !== 1 ? 's' : ''} remaining.{' '}
              <a href="/subscription/subscribe?reason=low-credits" className="warning-link">
                Subscribe for unlimited
              </a>
            </span>
            <button
              className="warning-dismiss"
              onClick={() => setShowWarning(false)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}
