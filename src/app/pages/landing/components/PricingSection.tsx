import CTAButton from "./CTAButton";

export default function PricingSection() {
  return (
    <section className="pricing">
      <div className="halftone-shadow"></div>
      <h2>Just $1 Per Day</h2>
      <div className="price-big">(Only When You Use It)</div>
      <p className="price-sub">Billed monthly for days used.</p>
      <p className="details">
        Use it 5 times this month? Pay $5.
        <br />
        Use it daily? ~$30/month.
      </p>
      <p className="no-commitment">No subscriptions. No surprises.</p>
      <CTAButton showNote={true} />
    </section>
  );
}
