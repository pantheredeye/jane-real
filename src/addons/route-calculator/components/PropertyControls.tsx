'use client'

import type { Property } from '../types'

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
    <div className="property-controls-accessible">
      <div className="control-group-accessible">
        <label className="control-label-accessible" htmlFor={`time-${propertyIndex}`}>
          Appointment Time
        </label>
        <input
          id={`time-${propertyIndex}`}
          type="time"
          className="time-input-accessible"
          value={timeValue}
          onChange={handleTimeChange}
        />
      </div>

      <div className="control-group-accessible">
        <button
          className={`lock-btn-accessible ${isFrozen ? 'locked' : ''}`}
          onClick={toggleFreeze}
          aria-pressed={isFrozen}
          aria-label={isFrozen ? 'Unlock appointment time' : 'Lock appointment time'}
        >
          {isFrozen ? '🔒 TIME LOCKED' : '🔓 LOCK TIME'}
        </button>
      </div>

      <div className="control-group-accessible">
        <label className="control-label-accessible">Showing Duration</label>
        <div className="duration-stepper-accessible">
          <button
            className="stepper-btn-accessible"
            onClick={decrementDuration}
            disabled={duration <= 5}
            aria-label="Decrease duration by 5 minutes"
          >
            −
          </button>
          <div className="duration-display-accessible">
            {formatDuration(duration)}
          </div>
          <button
            className="stepper-btn-accessible"
            onClick={incrementDuration}
            disabled={duration >= 180}
            aria-label="Increase duration by 5 minutes"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}