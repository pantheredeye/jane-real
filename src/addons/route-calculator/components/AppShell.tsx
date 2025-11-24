'use client'

import { useState, ReactNode } from 'react'
import { BottomBar } from './BottomBar'
import { RouteWorkspace } from './RouteWorkspace'
import { MenuSheet } from './MenuSheet'
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
  startTime: string
  onStartTimeChange: (time: string) => void
  selectedDuration: number
  onDurationChange: (duration: number) => void

  // Start location
  startFromType: 'current' | 'first' | 'custom'
  onStartFromTypeChange: (type: 'current' | 'first' | 'custom') => void
  customStartAddress: string
  onCustomStartAddressChange: (address: string) => void
  onRequestLocation: () => void
  hasCurrentLocation: boolean

  // Calculate
  onCalculate: () => void
  isCalculating: boolean
  showSuccess: boolean

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
  onAddProperty,
  onEditProperty,
  onDeleteProperty,
  onClearAll,
  startTime,
  onStartTimeChange,
  selectedDuration,
  onDurationChange,
  onCalculate,
  isCalculating,
  showSuccess,
  routeName,
  onRouteNameChange,
  isDirty,
  onNewRoute,
  onOpenRoute,
  onSaveRoute,
  hasCalculatedRoute,
  startFromType,
  onStartFromTypeChange,
  customStartAddress,
  onCustomStartAddressChange,
  onRequestLocation,
  hasCurrentLocation
}: AppShellProps) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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
        onWorkspacePress={() => setWorkspaceOpen(true)}
        onCalculatePress={onCalculate}
        isCalculating={isCalculating}
        showSuccess={showSuccess}
        propertyCount={properties.length}
      />

      {/* Route Workspace Sheet */}
      <RouteWorkspace
        open={workspaceOpen}
        onOpenChange={setWorkspaceOpen}
        routeName={routeName}
        onRouteNameChange={onRouteNameChange}
        isDirty={isDirty}
        properties={properties}
        onAdd={onAddProperty}
        onEdit={onEditProperty}
        onDelete={onDeleteProperty}
        onClearAll={onClearAll}
        selectedDuration={selectedDuration}
        onDurationChange={onDurationChange}
        startTime={startTime}
        onStartTimeChange={onStartTimeChange}
        startFromType={startFromType}
        onStartFromTypeChange={onStartFromTypeChange}
        customStartAddress={customStartAddress}
        onCustomStartAddressChange={onCustomStartAddressChange}
        onRequestLocation={onRequestLocation}
        hasCurrentLocation={hasCurrentLocation}
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
