'use client'

import { Drawer } from 'vaul'
import { DurationSelector } from './DurationSelector'
import type { PropertyInput } from '../types'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  properties: PropertyInput[]
  startingPropertyIndex: number
  onStartingPropertyIndexChange: (index: number) => void
  startTime: string
  onStartTimeChange: (time: string) => void
  selectedDuration: number
  onDurationChange: (duration: number) => void
}

export function SettingsSheet({
  open,
  onOpenChange,
  properties,
  startingPropertyIndex,
  onStartingPropertyIndexChange,
  startTime,
  onStartTimeChange,
  selectedDuration,
  onDurationChange
}: SettingsSheetProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <Drawer.Portal>
        <Drawer.Overlay />
        <Drawer.Content aria-describedby={undefined}>
          <Drawer.Handle />
          <div className="sheet-content">
            <Drawer.Title className="sheet-title">SETTINGS</Drawer.Title>

            {/* Starting Point */}
            <div className="starting-point-container">
              <label htmlFor="sheet-starting-point" className="input-label">
                STARTING POINT
              </label>
              <select
                id="sheet-starting-point"
                className="starting-point-dropdown"
                value={startingPropertyIndex}
                onChange={(e) => onStartingPropertyIndexChange(Number(e.target.value))}
              >
                {properties.length === 0 ? (
                  <option value={0}>First property (auto-selected)</option>
                ) : (
                  properties.map((property, index) => (
                    <option key={property.id} value={index}>
                      {index + 1}. {property.parsedAddress.length > 35
                        ? property.parsedAddress.substring(0, 35) + '...'
                        : property.parsedAddress}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Start Time */}
            <div className="start-time-container">
              <label htmlFor="sheet-start-time" className="input-label">
                START TIME *
              </label>
              <input
                type="time"
                id="sheet-start-time"
                className="time-input"
                value={startTime}
                required
                onChange={(e) => onStartTimeChange(e.target.value)}
              />
            </div>

            {/* Duration */}
            <DurationSelector
              selectedDuration={selectedDuration}
              onChange={onDurationChange}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
