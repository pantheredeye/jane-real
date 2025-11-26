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
