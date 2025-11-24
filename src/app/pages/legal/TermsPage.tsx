// TODO: Terms of Service content
// - Usage terms
// - Limitations
// - Liability
// - Termination

export function TermsPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Archivo Black, sans-serif', marginBottom: '1rem' }}>
        TERMS OF SERVICE
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Terms of service content coming soon.
      </p>
      <a
        href="/route"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: '#3b82f6',
          color: 'white',
          textDecoration: 'none',
          fontFamily: 'Bebas Neue, sans-serif',
          letterSpacing: '1px'
        }}
      >
        BACK TO ROUTES
      </a>
    </div>
  )
}
