'use client'

import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createSubscription } from '../server-functions/createSubscription'

type PaymentFormProps = {
  plan: 'monthly' | 'annual'
  promoCode: string
  onSuccess: () => void
}

export default function PaymentForm({ plan, promoCode, onSuccess }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get card element
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        setError('Card element not found')
        setLoading(false)
        return
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (pmError) {
        setError(pmError.message || 'Payment method creation failed')
        setLoading(false)
        return
      }

      if (!paymentMethod) {
        setError('Payment method not created')
        setLoading(false)
        return
      }

      // Create subscription
      const result = await createSubscription({
        plan,
        paymentMethodId: paymentMethod.id,
        promoCode: promoCode.trim() || undefined,
      })

      if (!result.success || !result.clientSecret) {
        setError(result.error || 'Subscription creation failed')
        setLoading(false)
        return
      }

      // Confirm payment
      const { error: confirmError } = await stripe.confirmCardPayment(result.clientSecret)

      if (confirmError) {
        setError(confirmError.message || 'Payment confirmation failed')
        setLoading(false)
        return
      }

      // Success!
      onSuccess()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h3>Payment Details</h3>
      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1a1a1a',
                fontFamily: 'Inter, sans-serif',
                '::placeholder': {
                  color: '#999',
                },
              },
              invalid: {
                color: '#d32f2f',
              },
            },
          }}
        />
      </div>

      {error && <div className="payment-error">{error}</div>}

      <button
        type="submit"
        className="cta-button"
        disabled={!stripe || loading}
      >
        {loading ? 'Processing...' : 'Subscribe Now'}
      </button>

      <div className="secure-notice">
        <p>🔒 Secure payment • Your card details are encrypted</p>
      </div>
    </form>
  )
}
