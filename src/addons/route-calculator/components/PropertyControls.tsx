'use client'


interface Property {
  id: string
  address: string
  showingDuration: number
  appointmentTime: Date | null
  isFrozen: boolean
}

interface PropertyControlsProps {
  property: Property
  appointmentTime: Date
  propertyIndex: number
  onTimeChange: (propertyIndex: number, newTime: string) => void
  onDurationChange: (propertyIndex: number, newDuration: number) => void
  onToggleFreeze: (propertyIndex: number) => void
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  } else if (minutes === 60) {
    return '1 hr'
  } else if (minutes < 120) {
    const mins = minutes - 60
    return `1 hr ${mins} min`
  } else if (minutes === 120) {
    return '2 hrs'
  } else if (minutes < 180) {
    const mins = minutes - 120
    return `2 hrs ${mins} min`
  } else {
    return '3 hrs'
  }
}

export function PropertyControls({
  property,
  appointmentTime,
  propertyIndex,
  onTimeChange,
  onDurationChange,
  onToggleFreeze
}: PropertyControlsProps) {
  // Use props values instead of local state
  const timeValue = (() => {
    const hours = appointmentTime.getHours().toString().padStart(2, '0')
    const minutes = appointmentTime.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  })()

  const duration = property.showingDuration
  const isFrozen = property.isFrozen

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(propertyIndex, e.target.value)
  }

  const decrementDuration = () => {
    const newDuration = Math.max(5, duration - 5)
    onDurationChange(propertyIndex, newDuration)
  }

  const incrementDuration = () => {
    const newDuration = Math.min(180, duration + 5)
    onDurationChange(propertyIndex, newDuration)
  }

  const toggleFreeze = () => {
    onToggleFreeze(propertyIndex)
  }

  return (
    <div className="property-controls">
      <div className="control-group">
        <label className="control-label">Appointment</label>
        <div className="control-row">
          <input
            type="time"
            className="time-input"
            value={timeValue}
            onChange={handleTimeChange}
          />
          <button
            className={`lock-btn ${isFrozen ? 'locked' : ''}`}
            onClick={toggleFreeze}
          >
            {isFrozen ? 'Locked' : 'Lock Time'}
          </button>
        </div>
      </div>

      <div className="control-group">
        <label className="control-label">Duration</label>
        <div className="duration-stepper">
          <button
            className="stepper-btn"
            onClick={decrementDuration}
            disabled={duration <= 5}
            aria-label="Decrease duration"
          >
            −
          </button>
          <div className="duration-display">
            {formatDuration(duration)}
          </div>
          <button
            className="stepper-btn"
            onClick={incrementDuration}
            disabled={duration >= 180}
            aria-label="Increase duration"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}