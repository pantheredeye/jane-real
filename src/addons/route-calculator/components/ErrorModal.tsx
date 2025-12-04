'use client'

import { useEffect, useRef } from 'react'

interface ErrorModalProps {
  isOpen: boolean
  errorMessage: string
  onClose: () => void
  onRetry: () => void
}

export function ErrorModal({ isOpen, errorMessage, onClose, onRetry }: ErrorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const retryButtonRef = useRef<HTMLButtonElement>(null)

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Focus trap and initial focus
  useEffect(() => {
    if (!isOpen) return

    // Focus retry button on open
    retryButtonRef.current?.focus()

    // Store previous active element
    const previouslyFocused = document.activeElement as HTMLElement

    return () => {
      // Restore focus on close
      previouslyFocused?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="error-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="glass-card error-modal-content"
        style={{ padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-message"
      >
        <h2
          id="error-modal-title"
          className="section-title"
          style={{ marginTop: 0, color: 'var(--accent-danger)' }}
        >
          ⚠️ ROUTE CALCULATION FAILED
        </h2>

        <div
          id="error-modal-message"
          className="error-message-text"
        >
          {errorMessage}
        </div>

        <div className="error-modal-actions">
          <button
            className="calculate-btn"
            style={{
              backgroundColor: '#6c757d',
              minWidth: '120px'
            }}
            onClick={onClose}
          >
            CLOSE
          </button>
          <button
            ref={retryButtonRef}
            className="calculate-btn"
            style={{ minWidth: '120px' }}
            onClick={onRetry}
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    </div>
  )
}
