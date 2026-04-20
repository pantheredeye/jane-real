'use client'

import { AlertDialog } from '../../../app/components/ui/AlertDialog'

interface ErrorModalProps {
  isOpen: boolean
  errorMessage: string
  onClose: () => void
  onRetry: () => void
}

export function ErrorModal({ isOpen, errorMessage, onClose, onRetry }: ErrorModalProps) {
  return (
    <AlertDialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="error-modal-backdrop" />
        <AlertDialog.Popup
          className="glass-card error-modal-content"
          style={{
            padding: '2rem',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
          }}
        >
          <AlertDialog.Title
            className="section-title"
            style={{ marginTop: 0, color: 'var(--accent-danger)' }}
          >
            ⚠️ ROUTE CALCULATION FAILED
          </AlertDialog.Title>

          <AlertDialog.Description
            render={<div />}
            className="error-message-text"
          >
            {errorMessage}
          </AlertDialog.Description>

          <div className="error-modal-actions">
            <AlertDialog.Close
              className="btn-action btn-action-secondary"
              style={{ minWidth: '120px' }}
            >
              CLOSE
            </AlertDialog.Close>
            <button
              className="btn-action btn-action-primary"
              style={{ minWidth: '120px' }}
              onClick={onRetry}
              autoFocus
            >
              TRY AGAIN
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
