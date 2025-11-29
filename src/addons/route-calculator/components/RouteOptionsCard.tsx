'use client'

import { useState } from 'react'
import { DurationSelector } from './DurationSelector'

interface RouteOptionsCardProps {
  startTime: string
  onStartTimeChange: (time: string) => void
  selectedDuration: number
  onDurationChange: (duration: number) => void
}

export function RouteOptionsCard({
  startTime,
  onStartTimeChange,
  selectedDuration,
  onDurationChange
}: RouteOptionsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Collapsed state
  if (!isExpanded) {
    return (
      <div className="starting-location-card-compact" onClick={() => setIsExpanded(true)}>
        <div className="starting-location-icon">⚙️</div>
        <div className="starting-location-compact-info">
          <div className="starting-location-label">Route Options</div>
          <div className="starting-location-display">
            Starts {startTime} • {selectedDuration} min showings
          </div>
        </div>
        <div className="property-expand-indicator">▼</div>
      </div>
    )
  }

  // Expanded state
  return (
    <div className="starting-location-card-expanded">
      <div className="text-right">
        <button
          className="collapse-link"
          onClick={() => setIsExpanded(false)}
          aria-label="Collapse route options"
        >
          collapse ▲
        </button>
      </div>

      {/* Start Time */}
      <div className="settings-field">
        <label htmlFor="route-start-time" className="input-label">
          START TIME
        </label>
        <input
          type="time"
          id="route-start-time"
          className="time-input"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
        />
      </div>

      {/* Duration Selector */}
      <div className="settings-field">
        <DurationSelector
          selectedDuration={selectedDuration}
          onChange={onDurationChange}
        />
      </div>
    </div>
  )
}
