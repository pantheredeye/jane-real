'use client'

import { useEffect, useRef } from 'react'

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

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'CONFIRM',
  cancelText = 'CANCEL',
  variant = 'info',
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isLoading, onCancel])

  // Focus trap and initial focus
  useEffect(() => {
    if (!isOpen) return

    // Focus confirm button on open
    confirmButtonRef.current?.focus()

    // Store previous active element
    const previouslyFocused = document.activeElement as HTMLElement

    return () => {
      // Restore focus on close
      previouslyFocused?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  // Variant color mapping
  const variantColors = {
    danger: 'var(--accent-danger)',
    warning: '#f59e0b', // amber
    info: '#3b82f6' // blue
  }

  const titleColor = variantColors[variant]

  return (
    <div
      className="error-modal-overlay"
      onClick={isLoading ? undefined : onCancel}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="glass-card error-modal-content"
        style={{ padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <h2
          id="confirm-dialog-title"
          className="section-title"
          style={{ marginTop: 0, color: titleColor }}
        >
          {title}
        </h2>

        <div
          id="confirm-dialog-message"
          className="error-message-text"
          style={{ color: 'rgba(255, 255, 255, 0.9)' }}
        >
          {message}
        </div>

        <div className="error-modal-actions">
          <button
            className="calculate-btn"
            style={{
              backgroundColor: '#6c757d',
              minWidth: '120px'
            }}
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            className="calculate-btn"
            style={{
              backgroundColor: titleColor,
              minWidth: '120px'
            }}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'LOADING...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
