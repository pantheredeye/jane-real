'use client'

import { useState } from 'react'

const DURATION_OPTIONS = [15, 30, 45, 60]

export function DurationSelector() {
  const [selectedDuration, setSelectedDuration] = useState(15)

  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration)
  }

  return (
    <div className="duration-container">
      <label className="input-label">SHOWING DURATION (MINUTES)</label>
      <div className="duration-presets">
        {DURATION_OPTIONS.map((duration) => (
          <button
            key={duration}
            className={`duration-btn ${selectedDuration === duration ? 'active' : ''}`}
            data-duration={duration}
            onClick={() => handleDurationSelect(duration)}
          >
            {duration}
          </button>
        ))}
      </div>
    </div>
  )
}