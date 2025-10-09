interface DriveTimeConnectorProps {
  travelTime: number
}

export function DriveTimeConnector({ travelTime }: DriveTimeConnectorProps) {
  if (travelTime === 0) return null

  return (
    <div className="drive-time-connector">
      <div className="drive-time-line" />
      <div className="drive-time-label">
        ↓ {travelTime} min drive
      </div>
      <div className="drive-time-line" />
    </div>
  )
}
