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

  // Settings
  startTime: string
  onStartTimeChange: (time: string) => void
  selectedDuration: number
  onDurationChange: (duration: number) => void

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
}

export function AppShell({
  children,
  properties,
  onClearAll,
  startTime,
  onStartTimeChange,
  selectedDuration,
  onDurationChange,
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
  hasCalculatedRoute
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

        <span className="route-title">
          {routeName || 'Untitled Route'}
          {isDirty && <span className="dirty-indicator">*</span>}
        </span>

        <button
          className="settings-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
        >
          ⚙
        </button>
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
        selectedDuration={selectedDuration}
        onDurationChange={onDurationChange}
        startTime={startTime}
        onStartTimeChange={onStartTimeChange}
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
