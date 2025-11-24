// TODO: Share & Earn / Referral program
// - Referral link generation
// - Referral tracking
// - Rewards display
// - Schema needs: Referral model (referrer, referee, status, reward)

export function SharePage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Archivo Black, sans-serif', marginBottom: '1rem' }}>
        SHARE & EARN
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Referral program coming soon. Share RouteFast with fellow agents and earn rewards!
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
