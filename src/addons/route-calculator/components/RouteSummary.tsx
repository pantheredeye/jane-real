interface RouteSummaryProps {
  totalProperties?: number
  totalTime?: string
  drivingTime?: string
}

export function RouteSummary({ 
  totalProperties = 0, 
  totalTime = '0h 0m', 
  drivingTime = '0h 0m' 
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
    </div>
  )
}