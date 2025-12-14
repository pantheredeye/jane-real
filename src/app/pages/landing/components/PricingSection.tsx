import CTAButton from "./CTAButton";

export default function PricingSection() {
  return (
    <section className="pricing">
      <div className="halftone-shadow"></div>
      <h2>15 Free Route Calculations</h2>
      <div className="price-big">$9.99/mo</div>
      <p className="price-sub">or $49.99/year (save $70)</p>
      <p className="details">
        Your free calculations never expire.
        <br />
        Perfect for agents who need it when the moment strikes.
      </p>
      <p className="no-commitment">Subscribe when you're ready. Cancel anytime.</p>
      <CTAButton showNote={true} />
    </section>
  );
}
