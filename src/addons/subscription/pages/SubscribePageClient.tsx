'use client'

import { useState, useMemo } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import PaymentForm from '../components/PaymentForm'
import './styles.css'

type Plan = 'monthly' | 'annual'

type SubscribePageClientProps = {
  publishableKey: string
}

export default function SubscribePageClient({ publishableKey }: SubscribePageClientProps) {
  // Load Stripe with the key passed from server
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey])
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual')
  const [promoCode, setPromoCode] = useState('')

  const handleSuccess = () => {
    // Redirect to success page
    window.location.href = '/subscription/success'
  }

  const monthlySavings = ((9.99 * 12 - 49.99) / (9.99 * 12) * 100).toFixed(0)

  return (
    <Elements stripe={stripePromise}>
      <div className="subscribe-page">
        <div className="subscribe-container">
          <div className="trial-banner">
            <span className="big-text">UNLIMITED</span>
            <span className="small-text">CALCULATIONS</span>
          </div>

          <div className="subscribe-header">
            <h1>Choose Your Plan</h1>
            <p>Get unlimited route calculations</p>
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
                Billed monthly
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
                <span className="strikethrough">$119.88</span> Billed annually
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
              />
            </div>
            {promoCode.trim() && (
              <div className="promo-success">
                Code "{promoCode}" will be applied to your subscription
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

          <PaymentForm
            plan={selectedPlan}
            promoCode={promoCode}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </Elements>
  )
}
