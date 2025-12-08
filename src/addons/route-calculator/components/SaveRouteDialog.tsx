'use client'

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
  onClose
}: SaveRouteDialogProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-route-title"
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: '2rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="save-route-title" className="section-title" style={{ marginTop: 0 }}>SAVE ROUTE</h2>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="route-name" className="input-label">ROUTE NAME *</label>
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
          <label htmlFor="route-date" className="input-label">DATE</label>
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
      </div>
    </div>
  )
}
