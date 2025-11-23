'use client'

interface BottomBarProps {
  onAddPress: () => void
  onSettingsPress: () => void
  onCalculatePress: () => void
  isCalculating: boolean
  showSuccess: boolean
  propertyCount: number
}

export function BottomBar({
  onAddPress,
  onSettingsPress,
  onCalculatePress,
  isCalculating,
  showSuccess,
  propertyCount
}: BottomBarProps) {
  return (
    <div className="bottom-bar">
      <button
        className="bottom-bar-btn bottom-bar-btn-secondary"
        onClick={onAddPress}
      >
        + ADD
        {propertyCount > 0 && (
          <span className="bottom-bar-badge">{propertyCount}</span>
        )}
      </button>

      <button
        className="bottom-bar-btn bottom-bar-btn-secondary"
        onClick={onSettingsPress}
      >
        SETTINGS
      </button>

      <button
        className={`bottom-bar-btn bottom-bar-btn-primary ${showSuccess ? 'btn-success' : ''}`}
        onClick={onCalculatePress}
        disabled={isCalculating || propertyCount === 0}
      >
        {isCalculating ? 'CALC...' : showSuccess ? '✓ DONE' : 'CALCULATE'}
      </button>
    </div>
  )
}
