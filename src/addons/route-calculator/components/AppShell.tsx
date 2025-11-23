'use client'

import { useState, ReactNode } from 'react'
import { BottomBar } from './BottomBar'
import { AddSheet } from './AddSheet'
import { SettingsSheet } from './SettingsSheet'
import type { PropertyInput } from '../types'

interface AppShellProps {
  // Children for main viewport
  children: ReactNode

  // Property management
  properties: PropertyInput[]
  onAddProperty: (property: PropertyInput) => void
  onEditProperty: (id: string, newAddress: string) => void
  onDeleteProperty: (id: string) => void
  onClearAll: () => void

  // Settings
  startingPropertyIndex: number
  onStartingPropertyIndexChange: (index: number) => void
  startTime: string
  onStartTimeChange: (time: string) => void
  selectedDuration: number
  onDurationChange: (duration: number) => void

  // Calculate
  onCalculate: () => void
  isCalculating: boolean
  showSuccess: boolean

  // Route title (future: inline edit)
  routeTitle?: string
  onRouteTitleChange?: (title: string) => void
}

export function AppShell({
  children,
  properties,
  onAddProperty,
  onEditProperty,
  onDeleteProperty,
  onClearAll,
  startingPropertyIndex,
  onStartingPropertyIndexChange,
  startTime,
  onStartTimeChange,
  selectedDuration,
  onDurationChange,
  onCalculate,
  isCalculating,
  showSuccess,
  routeTitle = 'Untitled Route'
}: AppShellProps) {
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false)

  // TODO: Hamburger menu sheet for saved routes, account, etc.
  const handleHamburgerPress = () => {
    // Placeholder - will open menu sheet in future
    console.log('Hamburger menu - coming soon')
  }

  const handleHelpPress = () => {
    // Placeholder - will open help sheet or external link
    console.log('Help - coming soon')
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="header-bar">
        <button
          className="hamburger-btn"
          onClick={handleHamburgerPress}
          aria-label="Menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <span className="route-title">{routeTitle}</span>

        <button
          className="help-btn"
          onClick={handleHelpPress}
          aria-label="Help"
        >
          ?
        </button>
      </header>

      {/* Main Viewport */}
      <main className="main-viewport">
        {children}
      </main>

      {/* Bottom Bar */}
      <BottomBar
        onAddPress={() => setAddSheetOpen(true)}
        onSettingsPress={() => setSettingsSheetOpen(true)}
        onCalculatePress={onCalculate}
        isCalculating={isCalculating}
        showSuccess={showSuccess}
        propertyCount={properties.length}
      />

      {/* Add Sheet */}
      <AddSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        properties={properties}
        onAdd={onAddProperty}
        onEdit={onEditProperty}
        onDelete={onDeleteProperty}
        onClearAll={onClearAll}
      />

      {/* Settings Sheet */}
      <SettingsSheet
        open={settingsSheetOpen}
        onOpenChange={setSettingsSheetOpen}
        properties={properties}
        startingPropertyIndex={startingPropertyIndex}
        onStartingPropertyIndexChange={onStartingPropertyIndexChange}
        startTime={startTime}
        onStartTimeChange={onStartTimeChange}
        selectedDuration={selectedDuration}
        onDurationChange={onDurationChange}
      />
    </div>
  )
}
