'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'
import { PropertyInputBox } from './PropertyInputBox'
import { PropertyList } from './PropertyList'
import { DurationSelector } from './DurationSelector'
import type { PropertyInput } from '../types'

interface RouteWorkspaceProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  // Route identity
  routeName: string
  onRouteNameChange: (name: string) => void
  isDirty: boolean

  // Properties
  properties: PropertyInput[]
  onAdd: (property: PropertyInput) => void
  onEdit: (id: string, newAddress: string) => void
  onDelete: (id: string) => void
  onClearAll: () => void

  // Settings
  selectedDuration: number
  onDurationChange: (duration: number) => void
  startTime: string
  onStartTimeChange: (time: string) => void

  // Start location
  startFromType: 'current' | 'first' | 'custom'
  onStartFromTypeChange: (type: 'current' | 'first' | 'custom') => void
  customStartAddress: string
  onCustomStartAddressChange: (address: string) => void
  onRequestLocation: () => void
  hasCurrentLocation: boolean
}

export function RouteWorkspace({
  open,
  onOpenChange,
  routeName,
  onRouteNameChange,
  isDirty,
  properties,
  onAdd,
  onEdit,
  onDelete,
  onClearAll,
  selectedDuration,
  onDurationChange,
  startTime,
  onStartTimeChange,
  startFromType,
  onStartFromTypeChange,
  customStartAddress,
  onCustomStartAddressChange,
  onRequestLocation,
  hasCurrentLocation
}: RouteWorkspaceProps) {
  const [settingsExpanded, setSettingsExpanded] = useState(false)

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible={true}
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="workspace-sheet-overlay" />
        <Drawer.Content
          className="workspace-sheet"
          aria-describedby={undefined}
        >
          <Drawer.Handle />
          <div className="sheet-content">
            {/* Fixed top - Route name */}
            <div className="workspace-top">
              <Drawer.Title className="visually-hidden">Route Workspace</Drawer.Title>
              <input
                type="text"
                className="workspace-route-name"
                value={routeName}
                onChange={(e) => onRouteNameChange(e.target.value)}
                placeholder="Untitled Route"
                aria-label="Route name"
              />
              {isDirty && <span className="dirty-indicator">*</span>}
            </div>

            {/* Scrollable middle - Property list */}
            <div className="workspace-middle">
              <PropertyList
                properties={properties}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>

            {/* Fixed bottom - Input + Settings */}
            <div className="workspace-bottom">
              <PropertyInputBox onAdd={onAdd} />

              {/* Collapsible settings */}
              <div className="workspace-settings">
                <button
                  className="workspace-settings-toggle"
                  onClick={() => setSettingsExpanded(!settingsExpanded)}
                  aria-expanded={settingsExpanded}
                >
                  <span>SETTINGS</span>
                  <span className={`workspace-settings-chevron ${settingsExpanded ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </button>

                {settingsExpanded && (
                  <div className="workspace-settings-content">
                    {/* Start Time */}
                    <div className="start-time-container">
                      <label htmlFor="workspace-start-time" className="input-label">
                        START TIME
                      </label>
                      <input
                        type="time"
                        id="workspace-start-time"
                        className="time-input"
                        value={startTime}
                        onChange={(e) => onStartTimeChange(e.target.value)}
                      />
                    </div>

                    {/* Duration */}
                    <DurationSelector
                      selectedDuration={selectedDuration}
                      onChange={onDurationChange}
                    />

                    {/* Start From */}
                    <div className="start-from-container">
                      <label className="input-label">START FROM</label>
                      <div className="start-from-options">
                        <label className="start-from-option">
                          <input
                            type="radio"
                            name="startFrom"
                            value="current"
                            checked={startFromType === 'current'}
                            onChange={() => {
                              onStartFromTypeChange('current')
                              if (!hasCurrentLocation) {
                                onRequestLocation()
                              }
                            }}
                          />
                          <span>Current location</span>
                          {startFromType === 'current' && hasCurrentLocation && (
                            <span className="location-status">✓</span>
                          )}
                        </label>
                        <label className="start-from-option">
                          <input
                            type="radio"
                            name="startFrom"
                            value="first"
                            checked={startFromType === 'first'}
                            onChange={() => onStartFromTypeChange('first')}
                          />
                          <span>First property</span>
                        </label>
                        <label className="start-from-option">
                          <input
                            type="radio"
                            name="startFrom"
                            value="custom"
                            checked={startFromType === 'custom'}
                            onChange={() => onStartFromTypeChange('custom')}
                          />
                          <span>Custom address</span>
                        </label>
                      </div>
                      {startFromType === 'custom' && (
                        <input
                          type="text"
                          className="custom-start-input"
                          value={customStartAddress}
                          onChange={(e) => onCustomStartAddressChange(e.target.value)}
                          placeholder="Enter starting address..."
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Clear all button */}
              {properties.length > 0 && (
                <button
                  className="workspace-clear-btn"
                  onClick={onClearAll}
                >
                  CLEAR ALL ({properties.length})
                </button>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
