interface RouteSummaryProps {
  totalProperties?: number
  totalTime?: string
  drivingTime?: string
  addresses?: string[]
}

export function RouteSummary({ 
  totalProperties = 0, 
  totalTime = '0h 0m', 
  drivingTime = '0h 0m',
  addresses = []
}: RouteSummaryProps) {
  return (
    <div className="route-summary glass-card-elevated">
      <div className="summary-item">
        <span className="summary-label">TOTAL PROPERTIES:</span>
        <span className="summary-value">{totalProperties}</span>
      </div>
      <div className="summary-item">
        <span className="summary-label">TOTAL TIME:</span>
        <span className="summary-value">{totalTime}</span>
      </div>
      <div className="summary-item">
        <span className="summary-label">DRIVING TIME:</span>
        <span className="summary-value">{drivingTime}</span>
      </div>
      
      {addresses.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button 
            className="maps-btn"
            onClick={() => {
              const mapsUrl = `https://www.google.com/maps/dir/${addresses.join('/')}`
              window.open(mapsUrl, '_blank')
            }}
          >
            📍 OPEN ROUTE IN MAPS
          </button>
        </div>
      )}
    </div>
  )
}