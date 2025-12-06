'use client'

import { useState } from 'react'
import { PropertyControls } from './PropertyControls'
import type { Property, RouteItem } from '../types'

interface PropertyCardProps {
  routeItem: RouteItem
  routeIndex: number
  onTimeChange: (propertyIndex: number, newTime: string) => void
  onDurationChange: (propertyIndex: number, newDuration: number) => void
  onToggleFreeze: (propertyIndex: number) => void
}

function formatDisplayTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function shortenAddress(address: string, maxLength: number = 40): string {
  if (address.length <= maxLength) return address
  return address.substring(0, maxLength) + '...'
}

export function PropertyCard({ routeItem, routeIndex, onTimeChange, onDurationChange, onToggleFreeze }: PropertyCardProps) {
  const { property } = routeItem
  const [isExpanded, setIsExpanded] = useState(false)

  const handleDirections = () => {
    const encodedAddress = encodeURIComponent(property.address)
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
  }

  const handleViewListing = () => {
    if (property.sourceUrl) {
      window.open(property.sourceUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Collapsed view (compact timeline)
  if (!isExpanded) {
    return (
      <div className="result-card-accessible">
        {/* Card info area - tappable to expand */}
        <div className="result-card-info" onClick={() => setIsExpanded(true)}>
          {/* Thumbnail or placeholder */}
          <div className="property-thumbnail-compact">
            {property.thumbnailUrl ? (
              <img
                src={property.thumbnailUrl}
                alt={property.address}
                className="property-thumbnail-image"
              />
            ) : (
              <div className="property-thumbnail-placeholder">
                🏠
              </div>
            )}
          </div>

          {/* Property info (compact) */}
          <div className="property-compact-info">
            <div className="property-compact-header">
              <span className="property-number-compact">#{routeIndex + 1}</span>
              <span className="property-time-compact">{formatDisplayTime(routeItem.appointmentTime)}</span>
              {property.isFrozen && <span className="lock-indicator">🔒</span>}
            </div>
            <div className="property-address-compact">
              {shortenAddress(property.address)}
            </div>
            {routeItem.travelTime > 0 && (
              <div className="property-meta-compact">
                {property.showingDuration} min • {routeItem.travelTime} min drive
              </div>
            )}
          </div>

          {/* Expand indicator */}
          <div className="property-expand-indicator">▼</div>
        </div>

        {/* Action buttons - always visible */}
        <div className="property-actions-compact">
          <button
            className="action-btn-compact action-btn-directions"
            onClick={handleDirections}
            aria-label="Get directions to this property"
          >
            📍 DIRECTIONS
          </button>
          {property.sourceUrl && (
            <button
              className="action-btn-compact action-btn-listing"
              onClick={handleViewListing}
              aria-label="View listing details"
            >
              🏠 LISTING
            </button>
          )}
        </div>
      </div>
    )
  }

  // Expanded view (full details)
  return (
    <div className={`property-card-expanded ${property.isFrozen ? 'locked' : ''}`}>
      {/* Collapse header */}
      <div className="property-header-expanded" onClick={() => setIsExpanded(false)}>
        <div className="property-header-info-expanded">
          <div className="property-header-top-expanded">
            <span className="property-number-badge">#{routeIndex + 1}</span>
            <span className="property-address-primary">{property.address}</span>
          </div>
          <div className="property-header-meta-expanded">
            {formatDisplayTime(routeItem.appointmentTime)}
            {routeItem.travelTime > 0 && (
              <> • {routeItem.travelTime} min drive</>
            )}
          </div>
        </div>
        <button
          className="property-chevron-expanded"
          aria-label="Collapse property details"
        >
          ▲
        </button>
      </div>

      {/* Action buttons */}
      <div className="property-actions-expanded">
        <button
          className="action-btn-expanded action-btn-directions-expanded"
          onClick={handleDirections}
          aria-label="Get directions to this property"
        >
          📍 DIRECTIONS
        </button>
        {property.sourceUrl && (
          <button
            className="action-btn-expanded action-btn-listing-expanded"
            onClick={handleViewListing}
            aria-label="View listing details"
          >
            🏠 LISTING
          </button>
        )}
      </div>

      {/* Property controls */}
      <PropertyControls
        property={property}
        appointmentTime={routeItem.appointmentTime}
        propertyIndex={routeIndex}
        onTimeChange={onTimeChange}
        onDurationChange={onDurationChange}
        onToggleFreeze={onToggleFreeze}
      />
    </div>
  )
}
