'use client'

import { useState, ReactNode } from 'react'
import { BottomBar } from './BottomBar'
import { SettingsSheet } from './SettingsSheet'
import { MenuSheet } from './MenuSheet'
import type { PropertyInput } from '../types'

interface AppShellProps {
  // Children for main viewport
  children: ReactNode

  // Property management
  properties: PropertyInput[]
  onClearAll: () => void

  // Calculate
  onCalculate: () => void
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
  const [settingsOpen, setSettingsOpen] = useState(false)
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
          <button
            className="settings-btn"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="main-viewport">
        {children}
      </main>

      {/* Bottom Bar */}
      <BottomBar
        onCalculatePress={onCalculate}
        isCalculating={isCalculating}
        showSuccess={showSuccess}
        isCalculationDirty={isCalculationDirty}
        propertyCount={properties.length}
      />

      {/* Settings Sheet */}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        propertyCount={properties.length}
        onClearAll={onClearAll}
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
