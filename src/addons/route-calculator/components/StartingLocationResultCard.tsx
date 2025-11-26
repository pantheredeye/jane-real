'use client'

interface StartLocation {
  type: 'current' | 'property' | 'custom'
  coords?: { lat: number; lng: number }
  address?: string
  propertyIndex?: number
}

interface StartingLocationResultCardProps {
  startLocation: StartLocation
  propertyAddresses: string[]
}

export function StartingLocationResultCard({
  startLocation,
  propertyAddresses
}: StartingLocationResultCardProps) {
  const getDisplayAddress = () => {
    if (startLocation.type === 'current') {
      return 'Your current location'
    } else if (startLocation.type === 'property' && startLocation.propertyIndex !== undefined) {
      return propertyAddresses[startLocation.propertyIndex] || 'Selected property'
    } else if (startLocation.type === 'custom' && startLocation.address) {
      return startLocation.address
    }
    return 'Unknown location'
  }

  return (
    <div className="result-card starting-result-card">
      {/* Pin icon for starting point */}
      <div className="starting-result-icon">📍</div>

      {/* Starting point info */}
      <div className="property-compact-info">
        <div className="property-compact-header">
          <span className="starting-result-label">START</span>
        </div>
        <div className="property-address-compact">
          {getDisplayAddress()}
        </div>
      </div>
    </div>
  )
}
