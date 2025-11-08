"use client";

import "./screenshot-comic-strip.css";

const steps = [
  { number: 1, label: "Add Addresses", description: "Paste Zillow URLs or type addresses" },
  { number: 2, label: "Build List", description: "See properties added to your route" },
  { number: 3, label: "Calculate", description: "Optimize the order and timing" },
  { number: 4, label: "Results", description: "Get your perfect showing schedule" },
];

export default function ScreenshotComicStrip() {
  return (
    <section className="screenshot-comic-strip">
      <h2 className="comic-strip-title">See How It Works</h2>

      <div className="comic-strip-container">
        {steps.map((step) => (
          <div key={step.number} className="comic-panel">
            {/* Screenshot placeholder */}
            <div className="screenshot-placeholder">
              <div className="placeholder-text">Screenshot {step.number}</div>
            </div>

            {/* Step label overlay */}
            <div className="step-label">
              <span className="step-number">{step.number}:</span>
              <span className="step-title">{step.label}</span>
            </div>

            {/* Optional description below */}
            <p className="step-description">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
