'use client'

import { useState } from 'react'
import { createCheckoutSession } from '../server-functions/createCheckoutSession'
import './styles.css'

type Plan = 'monthly' | 'annual'

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  const handleStartTrial = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await createCheckoutSession({
        plan: selectedPlan,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/subscribe`,
      })

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handlePromoApply = () => {
    if (promoCode.trim()) {
      setPromoApplied(true)
      // Note: Promo validation will happen in Stripe Checkout
      // This is just client-side feedback
    }
  }

  const monthlySavings = ((9.99 * 12 - 49.99) / (9.99 * 12) * 100).toFixed(0)

  return (
    <div className="subscribe-page">
      <div className="subscribe-container">
        <div className="subscribe-header">
          <div className="trial-badge">
            <span className="big-text">30</span>
            <span className="small-text">DAY<br/>FREE<br/>TRIAL</span>
          </div>
          <h1>Choose Your Plan</h1>
          <p>Start your free trial today</p>
        </div>

        <div className="pricing-cards">
          <div
            className={`pricing-card ${selectedPlan === 'monthly' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div className="plan-header">
              <h3>Monthly</h3>
              {selectedPlan === 'monthly' && <span className="selected-badge">Selected</span>}
            </div>
            <div className="plan-price">
              <span className="price">$9.99</span>
              <span className="period">/month</span>
            </div>
            <div className="plan-description">
              Billed monthly after trial
            </div>
          </div>

          <div
            className={`pricing-card ${selectedPlan === 'annual' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('annual')}
          >
            <span className="savings-badge">Save {monthlySavings}%</span>
            <div className="plan-header">
              <h3>Annual</h3>
              {selectedPlan === 'annual' && <span className="selected-badge">Selected</span>}
            </div>
            <div className="plan-price">
              <span className="price">$49.99</span>
              <span className="period">/year</span>
            </div>
            <div className="plan-description">
              <span className="strikethrough">$119.88</span> Billed annually after trial
            </div>
          </div>
        </div>

        <div className="promo-section">
          <h3>Have a promo code?</h3>
          <div className="promo-input-group">
            <input
              type="text"
              className="promo-input"
              placeholder="Enter code here"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handlePromoApply()}
            />
            <button
              className="promo-apply-btn"
              onClick={handlePromoApply}
              type="button"
            >
              Apply
            </button>
          </div>
          {promoApplied && (
            <div className="promo-success">
              Code "{promoCode}" will be applied at checkout
            </div>
          )}
        </div>

        <div className="features-list">
          <h3>What's included:</h3>
          <ul>
            <li>Unlimited route calculations</li>
            <li>Smart property input (Zillow, Realtor.com URLs)</li>
            <li>Real-time optimization</li>
            <li>Google Maps integration</li>
            <li>Export to calendar</li>
            <li>Client-friendly itineraries</li>
          </ul>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          className="cta-button"
          onClick={handleStartTrial}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Start Free Trial'}
        </button>

        <div className="trial-info">
          <p>Trial starts today • No charge for 30 days • Cancel anytime</p>
        </div>
      </div>
    </div>
  )
}
