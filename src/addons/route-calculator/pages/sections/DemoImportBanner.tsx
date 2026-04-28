'use client'

import type { useDemoImport } from '../../hooks/useDemoImport'

interface DemoImportBannerProps {
  demoImport: ReturnType<typeof useDemoImport>
}

export default function DemoImportBanner({ demoImport }: DemoImportBannerProps) {
  if (!demoImport.showDemoImportBanner || !demoImport.demoProperties) return null

  return (
    <div
      style={{
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem' }}>🎉</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#60a5fa' }}>
            Continue from Demo?
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
            {demoImport.demoProperties.length} {demoImport.demoProperties.length === 1 ? 'property' : 'properties'} ready to import.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          className="btn-action btn-action-secondary"
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.8rem',
            minWidth: 'auto'
          }}
          onClick={demoImport.handleDismissDemoImport}
        >
          No Thanks
        </button>
        <button
          className="btn-action btn-action-primary"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.8rem',
            minWidth: 'auto'
          }}
          onClick={demoImport.handleImportDemoProperties}
        >
          ✓ Import
        </button>
      </div>
    </div>
  )
}
