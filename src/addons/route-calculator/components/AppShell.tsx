'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MenuSheet } from './MenuSheet'
import type { PropertyInput } from '../types'
import { useDock } from '../../agent/contexts/DockProvider'

interface AppShellProps {
  // Children for main viewport
  children: ReactNode

  // Property management
  properties: PropertyInput[]
  onClearAll: () => void

  // Calculate & Paste
  onCalculate: () => void
  onPaste: () => Promise<{ success: boolean; error?: string }>
  isCalculating: boolean
  showSuccess: boolean
  isCalculationDirty: boolean

  // Route identity
  routeName: string
  onRouteNameChange: (name: string) => void
  isDirty: boolean

  // Route management
  onNewRoute: () => void
  onOpenRoute: () => void
  onSaveRoute: () => void
  hasCalculatedRoute: boolean

  // Credits system
  creditsRemaining?: number
  isGrandfathered?: boolean
  isSubscribed?: boolean
}

export function AppShell({
  children,
  properties,
  onClearAll,
  onCalculate,
  onPaste,
  isCalculating,
  showSuccess,
  isCalculationDirty,
  routeName,
  onRouteNameChange,
  isDirty,
  onNewRoute,
  onOpenRoute,
  onSaveRoute,
  hasCalculatedRoute,
  creditsRemaining = 0,
  isGrandfathered = false,
  isSubscribed = false
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [pasteState, setPasteState] = useState<'idle' | 'pasting' | 'added' | 'invalid' | 'denied' | 'empty'>(
    'idle',
  )

  const { setPrimary, setSecondary } = useDock()

  // Keep fresh handler refs so the dock publishes don't stale-close.
  const onCalculateRef = useRef(onCalculate)
  onCalculateRef.current = onCalculate
  const onPasteRef = useRef(onPaste)
  onPasteRef.current = onPaste

  const propertyCount = properties.length
  const primaryDisabled =
    isCalculating || propertyCount === 0 || (showSuccess && !isCalculationDirty)
  const primaryLabel = isCalculating
    ? 'CALCULATING…'
    : showSuccess && !isCalculationDirty
      ? '✓ DONE'
      : isCalculationDirty
        ? `RECALCULATE${propertyCount > 0 ? ` (${propertyCount})` : ''}`
        : `CALCULATE${propertyCount > 0 ? ` (${propertyCount})` : ''}`
  const primarySuccess = showSuccess && !isCalculationDirty

  const pasteLabel = {
    idle: '📋 Paste address',
    pasting: 'Pasting…',
    added: '✓ Added',
    invalid: 'Invalid',
    denied: 'Clipboard denied',
    empty: 'Clipboard empty',
  }[pasteState]

  const handlePasteAction = async () => {
    setPasteState('pasting')
    const result = await onPasteRef.current()
    if (result.success) {
      setPasteState('added')
      setTimeout(() => setPasteState('idle'), 1500)
    } else {
      const nextState: typeof pasteState = result.error?.includes('permission')
        ? 'denied'
        : result.error?.includes('empty')
          ? 'empty'
          : 'invalid'
      setPasteState(nextState)
      setTimeout(() => setPasteState('idle'), 2000)
    }
  }

  // Publish primary (Calculate) + secondary (Paste) actions to the dock.
  useEffect(() => {
    setPrimary({
      label: primaryLabel,
      disabled: primaryDisabled,
      success: primarySuccess,
      onAction: () => onCalculateRef.current(),
    })
    setSecondary([
      {
        id: 'paste',
        label: pasteLabel,
        disabled: pasteState !== 'idle',
        onAction: () => {
          void handlePasteAction()
        },
      },
    ])
  }, [primaryLabel, primaryDisabled, primarySuccess, pasteLabel, pasteState, setPrimary, setSecondary])

  // Clear registrations on unmount so non-route-calc pages don't see stale actions.
  useEffect(() => {
    return () => {
      setPrimary(null)
      setSecondary([])
    }
  }, [setPrimary, setSecondary])

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="header-bar">
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <div className="route-title-section">
          <span className="route-title">
            {routeName || 'Untitled Route'}
            {isDirty && <span className="dirty-indicator">*</span>}
          </span>

          {/* Credits display under route title */}
          {creditsRemaining !== undefined && !isGrandfathered && !isSubscribed && (
            <div className={`credits-subtitle ${creditsRemaining < 5 ? 'credits-low' : ''} ${creditsRemaining < 3 ? 'credits-critical' : ''}`}>
              <span className="credits-text">
                {creditsRemaining} trial {creditsRemaining === 1 ? 'route' : 'routes'} remaining
              </span>
              <span className="credits-divider">•</span>
              <a href="/subscription/subscribe?reason=header" className="credits-buy-link">
               Subscribe Now!
              </a>
            </div>
          )}
        </div>

        <div className="header-actions">
          {properties.length > 0 && (
            <button
              className="clear-all-header-btn"
              onClick={onClearAll}
              aria-label={`Clear all ${properties.length} properties`}
            >
              Clear All
            </button>
          )}
        </div>
      </header>

      {/* Main Viewport */}
      <main className="main-viewport">
        {children}
      </main>

      {/* Menu Sheet */}
      <MenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onNewRoute={onNewRoute}
        onOpenRoute={onOpenRoute}
        onSaveRoute={onSaveRoute}
        isDirty={isDirty}
        hasRoute={hasCalculatedRoute}
      />
    </div>
  )
}
