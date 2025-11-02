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
      </div>
    </>
  );
}
