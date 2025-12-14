import ThemeSwitcher from "./components/ThemeSwitcher";
import HeroSection from "./components/HeroSection";
import PricingSection from "./components/PricingSection";
import FeaturesSection from "./components/FeaturesSection";

export default function LandingPage() {
  return (
    <>
      <ThemeSwitcher />

      <div className="landing-page">
        <HeroSection />
        <PricingSection />
        <FeaturesSection />

        <footer className="landing-footer">
          <a href="/about" className="footer-link">About RouteFast</a>
          <span className="footer-divider">•</span>
          <a href="/legal/privacy" className="footer-link">Privacy</a>
          <span className="footer-divider">•</span>
          <a href="/legal/terms" className="footer-link">Terms</a>
        </footer>
      </div>
    </>
  );
}
