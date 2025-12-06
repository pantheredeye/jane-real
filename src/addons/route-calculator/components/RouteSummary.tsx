interface RouteSummaryProps {
  totalProperties?: number
  totalTime?: string
  drivingTime?: string
  addresses?: string[]
  startTime?: Date
  endTime?: Date
}

function formatTime(date?: Date): string {
  if (!date) return '--:--'
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function RouteSummary({
  totalProperties = 0,
  totalTime = '0h 0m',
  drivingTime = '0h 0m',
  addresses = [],
  startTime,
  endTime
}: RouteSummaryProps) {
  const mapsUrl = addresses.length > 0
    ? `https://www.google.com/maps/dir/${addresses.join('/')}`
    : ''

  return (
    <div className="route-summary-accessible">
      {/* Primary metric - Total Time */}
      <div className="summary-primary">
        <div className="summary-primary-value">{totalTime}</div>
        <div className="summary-primary-label">Total Route Time</div>
      </div>

      {/* Start/End Times */}
      {startTime && endTime && (
        <div className="summary-timeline">
          <div className="summary-timeline-item">
            <span className="summary-timeline-label">Start:</span>
            <span className="summary-timeline-time">{formatTime(startTime)}</span>
          </div>
          <div className="summary-timeline-divider"></div>
          <div className="summary-timeline-item">
            <span className="summary-timeline-label">Finish:</span>
            <span className="summary-timeline-time">{formatTime(endTime)}</span>
          </div>
        </div>
      )}

      {/* Secondary metrics */}
      <div className="summary-secondary">
        <span className="summary-secondary-text">
          {totalProperties} {totalProperties === 1 ? 'Property' : 'Properties'} • {drivingTime} driving
        </span>
      </div>

      {/* Maps button */}
      {addresses.length > 0 && (
        <div className="summary-action">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="summary-maps-btn"
            aria-label="Open full route in Google Maps"
          >
            📍 OPEN FULL ROUTE IN MAPS
          </a>
        </div>
      )}
    </div>
  )
}