'use client'

import { useState } from 'react'
import { PropertyControls } from './PropertyControls'

interface Property {
  id: string
  address: string
  showingDuration: number
  appointmentTime: Date | null
  isFrozen: boolean
  sourceUrl?: string
  thumbnailUrl?: string
}

interface RouteItem {
  propertyIndex: number
  property: Property
  appointmentTime: Date
  travelTime: number
}

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
      <div className="result-card" onClick={() => setIsExpanded(true)}>
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
          </div>
          <div className="property-address-compact">
            {shortenAddress(property.address)}
          </div>
        </div>

        {/* Expand indicator */}
        <div className="property-expand-indicator">▼</div>
      </div>
    )
  }

  // Expanded view (full details)
  return (
    <div className={`property-card-expanded ${property.isFrozen ? 'locked' : ''}`}>
      {/* Header with chevron collapse */}
      <div className="property-header" onClick={() => setIsExpanded(false)}>
        <button
          className="property-chevron"
          aria-label="Collapse property details"
        >
          ▲
        </button>
        <div className="property-header-info">
          <div className="property-header-top">
            <span className="property-number-badge">#{routeIndex + 1}</span>
            <span className="property-address-primary">{property.address}</span>
          </div>
          <div className="property-header-meta">
            {formatDisplayTime(routeItem.appointmentTime)}
            {routeItem.travelTime > 0 && (
              <> • {routeItem.travelTime} min drive</>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons - hero CTA first */}
      <div className="property-actions">
        <button
          className="maps-btn-hero"
          onClick={handleDirections}
          aria-label="Get directions"
        >
          📍 GET DIRECTIONS
        </button>
        {property.sourceUrl && (
          <button
            className="listing-btn-secondary"
            onClick={handleViewListing}
            aria-label="View listing"
          >
            🏠 View Listing
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
