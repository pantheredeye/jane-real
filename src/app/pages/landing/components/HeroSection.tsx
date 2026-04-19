import CTAButton from "./CTAButton";
import ScreenshotComicStrip from "./ScreenshotComicStrip";

interface HeroSectionProps {
  isLoggedIn: boolean;
}

export default function HeroSection({ isLoggedIn }: HeroSectionProps) {
  return (
    <>
      <section className="hero">
        <div className="halftone-shadow"></div>

        {/* Clean Oval Badge */}
        <div className="hero-badge">
          <span>
            15 SEC
            <br />
            NOT
            <br />
            15 MIN!
          </span>
        </div>

        <h1>RouteFast!</h1>
        <p className="tagline">From Property Links to Perfect Route in Seconds</p>
        <p className="description">
          Paste Zillow URLs. Type addresses. Mix and match.
          <br />
          Calculate optimal route. Lock in appointment times.
          <br />
          <strong>Done in 15 seconds, not 15 minutes.</strong>
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          {isLoggedIn ? (
            <CTAButton href="/route/" label="Open Route Calculator" />
          ) : (
            <>
              <CTAButton />
              <p className="hero-secondary-link">
                Already have an account? <a href="/user/auth">Log in</a>
              </p>
            </>
          )}
        </div>
      </section>

      {/* Screenshot Comic Strip */}
      <ScreenshotComicStrip />
    </>
  );
}
