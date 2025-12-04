'use client'

const DURATION_OPTIONS = [15, 30, 45, 60]

interface DurationSelectorProps {
  selectedDuration: number
  onChange: (duration: number) => void
}

export function DurationSelector({ selectedDuration, onChange }: DurationSelectorProps) {
  const handleDurationSelect = (duration: number) => {
    onChange(duration)
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