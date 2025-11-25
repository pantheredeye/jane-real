'use client'

import { Drawer } from 'vaul'
import { DurationSelector } from './DurationSelector'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  // Settings
  selectedDuration: number
  onDurationChange: (duration: number) => void
  startTime: string
  onStartTimeChange: (time: string) => void

  // Start location
  startFromType: 'current' | 'property' | 'custom'
  onStartFromTypeChange: (type: 'current' | 'property' | 'custom') => void
  customStartAddress: string
  onCustomStartAddressChange: (address: string) => void
  onRequestLocation: () => void
  hasCurrentLocation: boolean
  startingPropertyIndex: number
  onStartingPropertyIndexChange: (index: number) => void
  propertyAddresses: string[]

  // Clear all
  propertyCount: number
  onClearAll: () => void
}

export function SettingsSheet({
  open,
  onOpenChange,
  selectedDuration,
  onDurationChange,
  startTime,
  onStartTimeChange,
  startFromType,
  onStartFromTypeChange,
  customStartAddress,
  onCustomStartAddressChange,
  onRequestLocation,
  hasCurrentLocation,
  startingPropertyIndex,
  onStartingPropertyIndexChange,
  propertyAddresses,
  propertyCount,
  onClearAll
}: SettingsSheetProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible={true}
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="settings-sheet-overlay" />
        <Drawer.Content
          className="settings-sheet"
          aria-describedby={undefined}
        >
          <Drawer.Handle />
          <div className="sheet-content">
            <Drawer.Title className="sheet-title">ROUTE SETTINGS</Drawer.Title>

            {/* Start Time */}
            <div className="settings-field">
              <label htmlFor="settings-start-time" className="input-label">
                START TIME
              </label>
              <input
                type="time"
                id="settings-start-time"
                className="time-input"
                value={startTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
              />
            </div>

            {/* Duration */}
            <div className="settings-field">
              <DurationSelector
                selectedDuration={selectedDuration}
                onChange={onDurationChange}
              />
            </div>

            {/* Start From */}
            <div className="settings-field">
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
                    value="property"
                    checked={startFromType === 'property'}
                    onChange={() => onStartFromTypeChange('property')}
                  />
                  <span>Specific property</span>
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
              {startFromType === 'property' && (
                <select
                  className="property-select"
                  value={startingPropertyIndex}
                  onChange={(e) => onStartingPropertyIndexChange(Number(e.target.value))}
                  disabled={propertyAddresses.length === 0}
                >
                  {propertyAddresses.map((address, idx) => (
                    <option key={idx} value={idx}>
                      {idx + 1}. {address.length > 40 ? address.slice(0, 40) + '...' : address}
                    </option>
                  ))}
                </select>
              )}
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

            {/* Clear All */}
            {propertyCount > 0 && (
              <div className="settings-field settings-danger-zone">
                <button
                  className="settings-clear-btn"
                  onClick={() => {
                    onClearAll()
                    onOpenChange(false)
                  }}
                >
                  CLEAR ALL PROPERTIES ({propertyCount})
                </button>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
