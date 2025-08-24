'use client'

import { useState } from 'react'

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
}

export function PropertyControls({ property, appointmentTime }: PropertyControlsProps) {
  const [timeValue, setTimeValue] = useState(() => {
    const hours = appointmentTime.getHours().toString().padStart(2, '0')
    const minutes = appointmentTime.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  })
  
  const [duration, setDuration] = useState(property.showingDuration)
  const [isFrozen, setIsFrozen] = useState(property.isFrozen)

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeValue(e.target.value)
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDuration(parseInt(e.target.value))
  }

  const toggleFreeze = () => {
    setIsFrozen(!isFrozen)
  }

  return (
    <div className="property-controls">
      <div className="control-group">
        <label className="control-label">Appointment Time</label>
        <div className="control-row">
          <input 
            type="time" 
            className="time-input" 
            value={timeValue}
            onChange={handleTimeChange}
          />
          <button 
            className={`freeze-btn ${isFrozen ? 'active' : ''}`}
            onClick={toggleFreeze}
          >
            {isFrozen ? '🔒 FROZEN' : '🔒 FREEZE'}
          </button>
        </div>
        {isFrozen && (
          <div className="lock-status">⚠ APPOINTMENT TIME FROZEN</div>
        )}
      </div>
      
      <div className="control-group">
        <label className="control-label">Showing Duration (minutes)</label>
        <input 
          type="number" 
          className="duration-input" 
          value={duration} 
          min="5" 
          max="120" 
          step="5"
          onChange={handleDurationChange}
        />
      </div>
    </div>
  )
}