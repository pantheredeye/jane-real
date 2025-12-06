'use client'

import type { SavedRoute } from '../types'

interface SavedRoutesSectionProps {
  savedRoutes: SavedRoute[]
  isLoadingRoutes: boolean
  onDeleteRoute: (routeId: string) => void
}

export function SavedRoutesSection({
  savedRoutes,
  isLoadingRoutes,
  onDeleteRoute
}: SavedRoutesSectionProps) {
  if (savedRoutes.length === 0) return null

  return (
    <section className="input-section glass-card" style={{ marginTop: '2rem' }}>
      <h2 className="section-title">MY SAVED ROUTES</h2>
      <p className="section-description">
        Load previously saved routes or delete them.
      </p>

      {isLoadingRoutes ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Loading routes...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {savedRoutes.map((route) => (
            <div
              key={route.id}
              style={{
                padding: '1rem',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{route.name}</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
                  {new Date(route.date).toLocaleDateString()} • {route.properties.length} properties • Created by {route.createdBy.name || route.createdBy.email}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="calculate-btn"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    minWidth: 'auto'
                  }}
                  onClick={async () => {
                    // TODO: Implement load route
                  }}
                >
                  📂 LOAD
                </button>
                <button
                  className="calculate-btn"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    minWidth: 'auto',
                    backgroundColor: '#dc3545'
                  }}
                  onClick={() => onDeleteRoute(route.id)}
                >
                  🗑️ DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
