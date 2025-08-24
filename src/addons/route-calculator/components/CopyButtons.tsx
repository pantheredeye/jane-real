'use client'

import { useState } from 'react'

export function CopyButtons() {
  const [clientCopyStatus, setClientCopyStatus] = useState<'idle' | 'success'>('idle')
  const [detailedCopyStatus, setDetailedCopyStatus] = useState<'idle' | 'success'>('idle')

  const handleCopyClient = async () => {
    try {
      // This would generate client-friendly itinerary text
      const itineraryText = generateClientItinerary()
      await navigator.clipboard.writeText(itineraryText)
      
      setClientCopyStatus('success')
      setTimeout(() => setClientCopyStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyDetailed = async () => {
    try {
      // This would generate detailed itinerary text
      const itineraryText = generateDetailedItinerary()
      await navigator.clipboard.writeText(itineraryText)
      
      setDetailedCopyStatus('success')
      setTimeout(() => setDetailedCopyStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const generateClientItinerary = () => {
    // Placeholder - would integrate with route data
    return '🏠 PROPERTY SHOWING SCHEDULE\n\nPlaceholder client itinerary'
  }

  const generateDetailedItinerary = () => {
    // Placeholder - would integrate with route data
    return 'PROPERTY SHOWING ITINERARY\n==============================\n\nPlaceholder detailed itinerary'
  }

  return (
    <div className="copy-options">
      <label className="copy-label">COPY FORMAT:</label>
      <div className="copy-buttons">
        <button 
          className={`copy-btn client-copy ${clientCopyStatus === 'success' ? 'btn-success' : ''}`}
          onClick={handleCopyClient}
        >
          <span className={`btn-text ${clientCopyStatus === 'success' ? 'hidden' : ''}`}>
            📱 FOR CLIENT
          </span>
          <span className={`btn-success ${clientCopyStatus === 'success' ? '' : 'hidden'}`}>
            COPIED!
          </span>
        </button>
        <button 
          className={`copy-btn detailed-copy ${detailedCopyStatus === 'success' ? 'btn-success' : ''}`}
          onClick={handleCopyDetailed}
        >
          <span className={`btn-text ${detailedCopyStatus === 'success' ? 'hidden' : ''}`}>
            📋 DETAILED
          </span>
          <span className={`btn-success ${detailedCopyStatus === 'success' ? '' : 'hidden'}`}>
            COPIED!
          </span>
        </button>
      </div>
    </div>
  )
}