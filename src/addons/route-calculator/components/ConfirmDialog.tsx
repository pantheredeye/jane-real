'use client'

import { AlertDialog } from '../../../app/components/ui/AlertDialog'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const variantColors = {
  danger: 'var(--accent-danger)',
  warning: '#f59e0b',
  info: '#3b82f6',
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'CONFIRM',
  cancelText = 'CANCEL',
  variant = 'info',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleColor = variantColors[variant]

  return (
    <AlertDialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onCancel()
      }}
    >
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
            style={{ marginTop: 0, color: titleColor }}
          >
            {title}
          </AlertDialog.Title>

          <AlertDialog.Description
            render={<div />}
            className="error-message-text"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            {message}
          </AlertDialog.Description>

          <div className="error-modal-actions">
            <button
              className="btn-action btn-action-secondary"
              style={{ minWidth: '120px' }}
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              className="btn-action btn-action-primary"
              style={{ backgroundColor: titleColor, minWidth: '120px' }}
              onClick={onConfirm}
              disabled={isLoading}
              autoFocus
            >
              {isLoading ? 'LOADING...' : confirmText}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
