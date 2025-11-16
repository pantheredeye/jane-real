"use client";

import "./screenshot-comic-strip.css";
import enterAddressImg from "./images/squareAddAddress.webp";
import buildListImg from "./images/squareBuildList.webp";
import calculateImg from "./images/squareCalculate.webp";
import resultsImg from "./images/squareResults.webp";

const steps = [
  { number: 1, label: "Add Addresses", description: "Paste Zillow URLs or type addresses", type: "action", image: enterAddressImg },
  { number: 2, label: "Build List", description: "See properties added to your route", type: "result", image: buildListImg },
  { number: 3, label: "Calculate", description: "Optimize the order and timing", type: "action", image: calculateImg },
  { number: 4, label: "Results", description: "Get your perfect showing schedule", type: "result", image: resultsImg },
];

export default function ScreenshotComicStrip() {
  return (
    <section className="screenshot-comic-strip">
      <h2 className="comic-strip-title">See How It Works</h2>

      <div className="comic-strip-container">
        {steps.map((step) => (
          <div key={step.number} className={`comic-panel panel-${step.type}`} data-type={step.type}>
            {/* Screenshot container */}
            <div className="screenshot-container">
              <img
                src={step.image}
                alt={`Step ${step.number}: ${step.label}`}
                className="screenshot-image"
              />

              {/* Step title at bottom with number */}
              <div className="step-title">{step.number}. {step.label}</div>
            </div>

            {/* Optional description below */}
            <p className="step-description">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
