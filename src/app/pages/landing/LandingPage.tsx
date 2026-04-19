import { RequestInfo } from "rwsdk/worker";
import ThemeSwitcher from "./components/ThemeSwitcher";
import LandingHeader from "./components/LandingHeader";
import HeroSection from "./components/HeroSection";
import PricingSection from "./components/PricingSection";
import FeaturesSection from "./components/FeaturesSection";

export default function LandingPage({ ctx }: RequestInfo) {
  const isLoggedIn = Boolean(ctx.user);

  return (
    <>
      <ThemeSwitcher />

      <div className="landing-page">
        <LandingHeader isLoggedIn={isLoggedIn} />
        <HeroSection isLoggedIn={isLoggedIn} />
        <PricingSection isLoggedIn={isLoggedIn} />
        <FeaturesSection />

        <footer className="landing-footer">
          <a href="/about" className="footer-link">About RouteFast</a>
          <span className="footer-divider">•</span>
          <a href="/legal/privacy" className="footer-link">Privacy</a>
          <span className="footer-divider">•</span>
          <a href="/legal/terms" className="footer-link">Terms</a>
          <span className="footer-divider">•</span>
          <a href="https://digitalglue.dev" target="_blank" rel="noopener noreferrer" className="footer-link">Crafted by Digital Glue</a>
        </footer>
      </div>
    </>
  );
}
