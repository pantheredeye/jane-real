'use client'

import { useState, useEffect } from 'react'

interface StartingLocationCardProps {
  startFromType: 'current' | 'property' | 'custom'
  onStartFromTypeChange: (type: 'current' | 'property' | 'custom') => void
  customStartAddress: string
  onCustomStartAddressChange: (address: string) => void
  currentLocation: { lat: number; lng: number } | null
  locationError: string | null
  onRequestLocation: () => void
  startingPropertyIndex: number
  onStartingPropertyIndexChange: (index: number) => void
  propertyAddresses: string[]
}

export function StartingLocationCard({
  startFromType,
  onStartFromTypeChange,
  customStartAddress,
  onCustomStartAddressChange,
  currentLocation,
  locationError,
  onRequestLocation,
  startingPropertyIndex,
  onStartingPropertyIndexChange,
  propertyAddresses
}: StartingLocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Auto-request geolocation on mount if type is 'current'
  useEffect(() => {
    if (startFromType === 'current' && !currentLocation && !locationError) {
      onRequestLocation()
    }
  }, []) // Only run on mount

  // Get display text for collapsed state
  const getDisplayText = () => {
    if (startFromType === 'current') {
      if (currentLocation) {
        return `Your current location`
      } else if (locationError) {
        return `Current location (${locationError})`
      } else {
        return 'Getting location...'
      }
    } else if (startFromType === 'property') {
      if (propertyAddresses.length > 0 && propertyAddresses[startingPropertyIndex]) {
        return propertyAddresses[startingPropertyIndex]
      } else {
        return 'Select a property'
      }
    } else if (startFromType === 'custom') {
      return customStartAddress || 'Enter custom address'
    }
    return ''
  }

  // Collapsed state
  if (!isExpanded) {
    return (
      <div className="starting-location-card-compact" onClick={() => setIsExpanded(true)}>
        <div className="starting-location-icon">📍</div>
        <div className="starting-location-compact-info">
          <div className="starting-location-label">Starting from:</div>
          <div className="starting-location-display">{getDisplayText()}</div>
        </div>
        <div className="property-expand-indicator">▼</div>
      </div>
    )
  }

  // Expanded state
  return (
    <div className="starting-location-card-expanded">
      <div className="text-right">
        <button
          className="collapse-link"
          onClick={() => setIsExpanded(false)}
          aria-label="Collapse starting location"
        >
          collapse ▲
        </button>
      </div>

      {/* Radio group for start type */}
      <div className="start-from-options">
        <label className="start-from-option">
          <input
            type="radio"
            name="startFrom"
            value="current"
            checked={startFromType === 'current'}
            onChange={() => {
              onStartFromTypeChange('current')
              if (!currentLocation && !locationError) {
                onRequestLocation()
              }
            }}
          />
          <span>Current location</span>
          {startFromType === 'current' && currentLocation && (
            <span className="location-status">✓</span>
          )}
          {startFromType === 'current' && locationError && (
            <span className="location-status error">✗</span>
          )}
        </label>

        <label className="start-from-option">
          <input
            type="radio"
            name="startFrom"
            value="property"
            checked={startFromType === 'property'}
            onChange={() => onStartFromTypeChange('property')}
          />
          <span>Specific property</span>
        </label>

        <label className="start-from-option">
          <input
            type="radio"
            name="startFrom"
            value="custom"
            checked={startFromType === 'custom'}
            onChange={() => onStartFromTypeChange('custom')}
          />
          <span>Custom address</span>
        </label>
      </div>

      {/* Show error inline for current location */}
      {startFromType === 'current' && locationError && (
        <div className="inline-error-message">
          {locationError}. Try "Specific property" or "Custom address" instead.
        </div>
      )}

      {/* Property dropdown */}
      {startFromType === 'property' && (
        <select
          className="property-select"
          value={startingPropertyIndex}
          onChange={(e) => onStartingPropertyIndexChange(Number(e.target.value))}
          disabled={propertyAddresses.length === 0}
        >
          {propertyAddresses.length === 0 ? (
            <option value={0}>No properties added yet</option>
          ) : (
            propertyAddresses.map((address, idx) => (
              <option key={idx} value={idx}>
                {idx + 1}. {address.length > 50 ? address.slice(0, 50) + '...' : address}
              </option>
            ))
          )}
        </select>
      )}

      {/* Custom address input */}
      {startFromType === 'custom' && (
        <input
          type="text"
          className="custom-start-input"
          value={customStartAddress}
          onChange={(e) => onCustomStartAddressChange(e.target.value)}
          placeholder="Enter starting address..."
        />
      )}
    </div>
  )
}
