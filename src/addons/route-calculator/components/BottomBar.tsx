'use client'

interface BottomBarProps {
  onWorkspacePress: () => void
  onCalculatePress: () => void
  isCalculating: boolean
  showSuccess: boolean
  propertyCount: number
}

export function BottomBar({
  onWorkspacePress,
  onCalculatePress,
  isCalculating,
  showSuccess,
  propertyCount
}: BottomBarProps) {
  return (
    <div className="bottom-bar">
      <button
        className="bottom-bar-btn bottom-bar-btn-secondary"
        onClick={onWorkspacePress}
      >
        WORKSPACE
        {propertyCount > 0 && (
          <span className="bottom-bar-badge">{propertyCount}</span>
        )}
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
