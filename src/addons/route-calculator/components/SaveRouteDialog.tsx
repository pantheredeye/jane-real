'use client'

import { Dialog } from '../../../app/components/ui/Dialog'

interface SaveRouteDialogProps {
  isOpen: boolean
  routeName: string
  routeDate: string
  isSaving: boolean
  onRouteNameChange: (name: string) => void
  onRouteDateChange: (date: string) => void
  onSave: () => void
  onClose: () => void
}

export function SaveRouteDialog({
  isOpen,
  routeName,
  routeDate,
  isSaving,
  onRouteNameChange,
  onRouteDateChange,
  onSave,
  onClose,
}: SaveRouteDialogProps) {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSaving) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="error-modal-backdrop" />
        <Dialog.Popup
          className="glass-card"
          style={{
            maxWidth: '500px',
            width: 'calc(100% - 2rem)',
            padding: '2rem',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
          }}
        >
          <Dialog.Title className="section-title" style={{ marginTop: 0 }}>
            SAVE ROUTE
          </Dialog.Title>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="route-name" className="input-label">
              ROUTE NAME *
            </label>
            <input
              id="route-name"
              type="text"
              className="time-input"
              style={{ width: '100%' }}
              value={routeName}
              onChange={(e) => onRouteNameChange(e.target.value)}
              placeholder="e.g., Downtown Showings - March 15"
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="route-date" className="input-label">
              DATE
            </label>
            <input
              id="route-date"
              type="date"
              className="time-input"
              style={{ width: '100%' }}
              value={routeDate}
              onChange={(e) => onRouteDateChange(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              className="btn-action btn-action-secondary"
              style={{ minWidth: '100px' }}
              onClick={onClose}
              disabled={isSaving}
            >
              CANCEL
            </button>
            <button
              className="btn-action btn-action-primary"
              style={{ minWidth: '100px' }}
              onClick={onSave}
              disabled={isSaving || !routeName.trim()}
            >
              {isSaving ? 'SAVING...' : 'SAVE'}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
