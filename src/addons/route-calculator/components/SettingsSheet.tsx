'use client'

import { Drawer } from 'vaul'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  // Clear all
  propertyCount: number
  onClearAll: () => void
}

export function SettingsSheet({
  open,
  onOpenChange,
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
            <Drawer.Title className="sheet-title">SETTINGS</Drawer.Title>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Route options are now inline for easier access. Use this menu for advanced settings.
            </p>

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

            {propertyCount === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                No settings available. Add properties to get started.
              </p>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
