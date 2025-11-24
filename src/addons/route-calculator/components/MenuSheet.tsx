'use client'

import { Drawer } from 'vaul'

interface MenuSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNewRoute: () => void
  onOpenRoute: () => void
  onSaveRoute: () => void
  isDirty: boolean
  hasRoute: boolean
}

export function MenuSheet({
  open,
  onOpenChange,
  onNewRoute,
  onOpenRoute,
  onSaveRoute,
  isDirty,
  hasRoute
}: MenuSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay />
        <Drawer.Content aria-describedby={undefined}>
          <Drawer.Handle />
          <div className="sheet-content">
            <Drawer.Title className="sheet-title">MENU</Drawer.Title>

            {/* Route Management */}
            <div className="menu-section">
              <h3 className="menu-section-title">ROUTES</h3>
              <button
                className="menu-item"
                onClick={() => {
                  onNewRoute()
                  onOpenChange(false)
                }}
              >
                <span className="menu-item-icon">+</span>
                <span>New Route</span>
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  onOpenRoute()
                  onOpenChange(false)
                }}
              >
                <span className="menu-item-icon">📂</span>
                <span>Open Route</span>
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  onSaveRoute()
                  onOpenChange(false)
                }}
                disabled={!hasRoute}
              >
                <span className="menu-item-icon">💾</span>
                <span>Save Route</span>
                {isDirty && <span className="menu-item-badge">*</span>}
              </button>
            </div>

            {/* Account */}
            <div className="menu-section">
              <h3 className="menu-section-title">ACCOUNT</h3>
              <a href="/account" className="menu-item">
                <span className="menu-item-icon">👤</span>
                <span>Account Settings</span>
              </a>
              <a href="/share" className="menu-item">
                <span className="menu-item-icon">🎁</span>
                <span>Share & Earn</span>
              </a>
            </div>

            {/* Legal */}
            <div className="menu-section">
              <h3 className="menu-section-title">LEGAL</h3>
              <a href="/legal/privacy" className="menu-item">
                <span className="menu-item-icon">🔒</span>
                <span>Privacy Policy</span>
              </a>
              <a href="/legal/terms" className="menu-item">
                <span className="menu-item-icon">📄</span>
                <span>Terms of Service</span>
              </a>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
