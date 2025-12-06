'use client'

import { useState, ReactNode } from 'react'
import { BottomBar } from './BottomBar'
import { MenuSheet } from './MenuSheet'
import type { PropertyInput } from '../types'

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

      {/* Bottom Bar */}
      <BottomBar
        onCalculatePress={onCalculate}
        onPaste={onPaste}
        isCalculating={isCalculating}
        showSuccess={showSuccess}
        isCalculationDirty={isCalculationDirty}
        propertyCount={properties.length}
      />

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
