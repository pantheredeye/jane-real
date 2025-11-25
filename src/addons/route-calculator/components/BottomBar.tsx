'use client'

interface BottomBarProps {
  onCalculatePress: () => void
  isCalculating: boolean
  showSuccess: boolean
  isCalculationDirty: boolean
  propertyCount: number
}

export function BottomBar({
  onCalculatePress,
  isCalculating,
  showSuccess,
  isCalculationDirty,
  propertyCount
}: BottomBarProps) {
  return (
    <div className="bottom-bar">
      <button
        className={`bottom-bar-btn bottom-bar-btn-primary bottom-bar-btn-full ${showSuccess && !isCalculationDirty ? 'btn-success' : ''}`}
        onClick={onCalculatePress}
        disabled={isCalculating || propertyCount === 0 || (showSuccess && !isCalculationDirty)}
      >
        {isCalculating
          ? 'CALCULATING...'
          : showSuccess && !isCalculationDirty
          ? '✓ DONE'
          : isCalculationDirty
          ? `RECALCULATE${propertyCount > 0 ? ` (${propertyCount})` : ''}`
          : `CALCULATE${propertyCount > 0 ? ` (${propertyCount})` : ''}`}
      </button>
    </div>
  )
}
