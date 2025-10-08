import { PropertyControls } from './PropertyControls'

interface Property {
  id: string
  address: string
  showingDuration: number
  appointmentTime: Date | null
  isFrozen: boolean
  sourceUrl?: string
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

export function PropertyCard({ routeItem, routeIndex, onTimeChange, onDurationChange, onToggleFreeze }: PropertyCardProps) {
  const { property } = routeItem

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

  return (
    <div className={`property-card ${property.isFrozen ? 'locked' : ''}`}>
      <div className="property-main">
        <div className="property-number">{routeIndex + 1}</div>
        <div className="property-info">
          <div className="property-time">{formatDisplayTime(routeItem.appointmentTime)}</div>
          <div className="property-address">
            {property.address}
            {property.sourceUrl && (
              <span className="property-listing-badge">🏠 Listing</span>
            )}
          </div>
          {routeItem.travelTime > 0 && (
            <div className="travel-time">Drive time: {routeItem.travelTime} min</div>
          )}
        </div>
        <div className="property-actions">
          {property.sourceUrl && (
            <button
              className="listing-btn"
              onClick={handleViewListing}
              aria-label="View listing"
            >
              🏠 VIEW LISTING
            </button>
          )}
          <button
            className="maps-btn"
            onClick={handleDirections}
            aria-label="Get directions"
          >
            📍 DIRECTIONS
          </button>
        </div>
      </div>
      
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