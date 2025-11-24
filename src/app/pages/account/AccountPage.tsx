// TODO: Account settings page
// - Profile info (name, email)
// - Subscription status
// - Change password / passkey management
// - Delete account

export function AccountPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Archivo Black, sans-serif', marginBottom: '1rem' }}>
        ACCOUNT SETTINGS
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Account management coming soon.
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
