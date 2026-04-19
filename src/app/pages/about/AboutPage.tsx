import "./styles.css";

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Back to Home */}
      <nav className="about-nav">
        <a href="/" className="back-link">← Back to Home</a>
      </nav>

      {/* Hero: Why This Exists */}
      <section className="about-hero">
        <div className="halftone-shadow"></div>
        <h1>About RouteFast</h1>
        <p className="about-tagline">
          Mobile appointment scheduling shouldn't eat your day.
        </p>
        <p className="about-description">
          If you drive to multiple appointments—showing houses, installing auto glass,
          delivering bounce houses—you know the pain. Calculating drive times between
          stops, adding buffer time, figuring out when you'll actually arrive - It's a
          30-minute puzzle every single day.
          <br /><br />
          <strong>RouteFast turns that 30-minute headache into 15 seconds.</strong>
        </p>
      </section>

      {/* Story Section */}
      <section className="about-story">
        <h2>How This Started</h2>

        <div className="story-grid">
          <div className="story-card">
            <div className="story-badge">1</div>
            <h3>Built for a Friend</h3>
            <p>
              A friend in real estate was wasting hours every week planning showing routes.
              I'm a developer. I like solving problems. So I built her a tool.
            </p>
          </div>

          <div className="story-card">
            <div className="story-badge">2</div>
            <h3>Turned It Into a Product</h3>
            <p>
              She loved it. I realized this problem isn't
              just realtors—it's anyone who does mobile appointments. So I made it public.
              Over time I will expand it for other trades.
            </p>
          </div>

          <div className="story-card">
            <div className="story-badge">3</div>
            <h3>Feedback Drives Everything</h3>
            <p>
              I'm solo. I'm nimble. I can ship features fast when users ask for them.
              Your feedback gives me energy. Talk to me—I'll listen.
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy Panel */}
      <section className="about-philosophy">
        <div className="halftone-shadow"></div>
        <h2>Why I Charge</h2>
        <p>
          I love helping people. That's why I built this. But to keep improving it,
          adding features, and responding to your ideas, I need time. Charging a small
          subscription lets me dedicate real hours to making this better.
        </p>
        <p>
          <strong>If you find this useful, pay and share.</strong> If you don't, tell me why.
          Either way, I want to hear from you.
        </p>
      </section>

      {/* CTA Footer */}
      <section className="about-ctas">
        <h2>What's Next?</h2>

        <div className="cta-grid">
          <a href="/user/auth" className="about-cta-button primary">
            Click to Try for Free
            <span className="cta-note">15 free calculations to start</span>
          </a>

          <a href="#feedback" className="about-cta-button secondary">
            Give Feedback
            <span className="cta-note">Discord, chat, or direct message</span>
          </a>

          <a href="#share" className="about-cta-button secondary">
            Share with Friends
            <span className="cta-note">Referral rewards coming soon</span>
          </a>

          <a href="https://digitalglue.dev" target="_blank" rel="noopener noreferrer" className="about-cta-button tertiary">
            See My Other Work
            <span className="cta-note">digitalglue.dev</span>
          </a>
        </div>
      </section>

      {/* Footer Note */}
      <footer className="about-footer">
        <p>
          Built by a solo developer who loves solving problems. Currently focused on
          realtors, but expanding to other mobile professionals soon.
        </p>
        <p className="about-contact">
          Questions? Ideas? Just want to chat?{" "}
          <a href="mailto:barrett@routefast.app">barrett@routefast.app</a>
        </p>
      </footer>
    </div>
  );
}
