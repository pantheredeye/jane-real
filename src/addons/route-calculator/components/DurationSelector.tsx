'use client'

// TODO: Convert to controlled component with props (like AddressInput)
// TODO: Add interface: { selectedDuration: number, onChange: (duration: number) => void }
// TODO: Remove internal useState, use props.selectedDuration and props.onChange instead  
// TODO: This allows HomePage to manage all form state centrally
// CONTEXT: First form submission needs all data (addresses + startTime + startingPoint + duration)
// CONTEXT: Future submissions will be granular (individual property updates, freeze times, re-optimize)
// CONTEXT: HomePage will have: addresses, startingPropertyIndex, startTime, selectedDuration states


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