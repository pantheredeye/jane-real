import CTAButton from "./CTAButton";

export default function PricingSection() {
  return (
    <section className="pricing">
      <div className="halftone-shadow"></div>
      <h2>Start Free for 30 Days</h2>
      <div className="price-big">$9.99/mo</div>
      <p className="price-sub">or $49.99/year (save $70)</p>
      <p className="details">
        Full access during your trial.
        <br />
        Cancel anytime, no questions asked.
      </p>
      <p className="no-commitment">No charge until trial ends. Cancel anytime.</p>
      <CTAButton showNote={true} />
    </section>
  );
}
