'use client'

interface RouteOptionsCardProps {
  startTime: string
  onStartTimeChange: (time: string) => void
  selectedDuration: number
  onDurationChange: (duration: number) => void
  isExpanded: boolean
  onToggleExpanded: () => void
}

// Format duration for display (extracted from PropertyControls.tsx)
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

export function RouteOptionsCard({
  startTime,
  onStartTimeChange,
  selectedDuration,
  onDurationChange,
  isExpanded,
  onToggleExpanded
}: RouteOptionsCardProps) {

  // Stepper handlers for custom duration
  const decrementDuration = () => {
    const newDuration = Math.max(5, selectedDuration - 5)
    onDurationChange(newDuration)
  }

  const incrementDuration = () => {
    const newDuration = Math.min(180, selectedDuration + 5)
    onDurationChange(newDuration)
  }

  // Collapsed state
  if (!isExpanded) {
    return (
      <div className="route-options-card-compact">
        <button
          className="route-options-toggle-btn"
          onClick={onToggleExpanded}
          aria-expanded={false}
          aria-controls="route-options-content"
          aria-label={`Expand route options: Starts ${startTime}, ${selectedDuration} minute showings`}
        >
          <span className="route-icon">⚙️</span>
          <span className="route-text">
            Starts {startTime} • {selectedDuration} min showings
          </span>
          <span className="expand-icon" aria-hidden="true">▼</span>
        </button>
      </div>
    )
  }

  // Expanded state
  return (
    <div className="route-options-card-expanded" id="route-options-content">
      <div className="text-right">
        <button
          className="collapse-link"
          onClick={onToggleExpanded}
          aria-label="Collapse route options"
        >
          collapse ▲
        </button>
      </div>

      {/* Start Time */}
      <div className="settings-field">
        <label htmlFor="route-start-time" className="field-label">
          Start time
        </label>
        <input
          type="time"
          id="route-start-time"
          className="time-input-large"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
        />
      </div>

      {/* Duration Presets */}
      <div className="settings-field">
        <label className="field-label">Showing duration</label>
        <div className="duration-presets">
          {[15, 30, 45, 60].map((duration) => (
            <button
              key={duration}
              className={`duration-btn ${selectedDuration === duration ? 'active' : ''}`}
              onClick={() => onDurationChange(duration)}
            >
              {duration}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Duration Stepper */}
      <div className="settings-field">
        <label className="field-label">Or custom duration</label>
        <div className="duration-stepper">
          <button
            className="stepper-btn"
            onClick={decrementDuration}
            disabled={selectedDuration <= 5}
            aria-label="Decrease duration by 5 minutes"
          >
            −
          </button>
          <div className="duration-display">
            {formatDuration(selectedDuration)}
          </div>
          <button
            className="stepper-btn"
            onClick={incrementDuration}
            disabled={selectedDuration >= 180}
            aria-label="Increase duration by 5 minutes"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
