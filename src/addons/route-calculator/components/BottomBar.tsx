'use client'

import { useState } from 'react'

type PasteState = 'idle' | 'pasting' | 'added' | 'invalid' | 'denied' | 'empty'

interface BottomBarProps {
  onCalculatePress: () => void
  onPaste: () => Promise<{ success: boolean; error?: string }>
  isCalculating: boolean
  showSuccess: boolean
  isCalculationDirty: boolean
  propertyCount: number
}

export function BottomBar({
  onCalculatePress,
  onPaste,
  isCalculating,
  showSuccess,
  isCalculationDirty,
  propertyCount
}: BottomBarProps) {
  const [pasteState, setPasteState] = useState<PasteState>('idle')

  const handlePaste = async () => {
    setPasteState('pasting')
    const result = await onPaste()

    if (result.success) {
      setPasteState('added')
      setTimeout(() => setPasteState('idle'), 1500)
    } else {
      // Determine error state from error message
      const errorState: PasteState =
        result.error?.includes('permission') ? 'denied' :
        result.error?.includes('empty') ? 'empty' :
        'invalid'
      setPasteState(errorState)
      setTimeout(() => setPasteState('idle'), 2000)
    }
  }

  const pasteButtonText = {
    idle: 'PASTE',
    pasting: 'PASTING...',
    added: '✓ ADDED',
    invalid: 'INVALID',
    denied: 'DENIED',
    empty: 'EMPTY'
  }[pasteState]

  return (
    <div className="bottom-bar">
      <button
        className="bottom-bar-btn bottom-bar-btn-secondary"
        onClick={handlePaste}
        disabled={pasteState !== 'idle'}
      >
        {pasteButtonText}
      </button>
      <button
        className={`bottom-bar-btn bottom-bar-btn-primary ${showSuccess && !isCalculationDirty ? 'btn-success' : ''}`}
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
