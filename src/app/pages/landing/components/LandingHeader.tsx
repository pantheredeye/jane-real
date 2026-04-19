interface LandingHeaderProps {
  isLoggedIn: boolean;
}

export default function LandingHeader({ isLoggedIn }: LandingHeaderProps) {
  return (
    <header className="landing-header">
      <a href="/" className="landing-header-brand">RouteFast</a>
      <nav className="landing-header-nav" aria-label="Primary">
        <a href="/about" className="landing-header-link">About</a>
        {isLoggedIn ? (
          <a href="/route/" className="landing-header-cta">Open App</a>
        ) : (
          <>
            <a href="/user/auth" className="landing-header-link">Log In</a>
            <a href="/user/auth" className="landing-header-cta">Start Free</a>
          </>
        )}
      </nav>
    </header>
  );
}
