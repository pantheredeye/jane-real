"use client";

import { useState, useEffect } from "react";
import { PropertyInputBox } from "@/addons/route-calculator/components/PropertyInputBox";
import type { PropertyInput } from "@/addons/route-calculator/types";
import "./demo-content.css";

interface DemoContentProps {
  onSignupClick: () => void;
}

export const DEMO_PROPERTIES_KEY = 'demo-properties';

export default function DemoContent({ onSignupClick }: DemoContentProps) {
  const [properties, setProperties] = useState<PropertyInput[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [usedExamples, setUsedExamples] = useState(false);

  // Save properties to localStorage whenever they change
  useEffect(() => {
    if (properties.length > 0) {
      localStorage.setItem(DEMO_PROPERTIES_KEY, JSON.stringify(properties));
    }
  }, [properties]);

  const handleAddProperty = (property: PropertyInput) => {
    setProperties([...properties, property]);
  };

  const handleUseExamples = () => {
    const exampleProperties: PropertyInput[] = [
      {
        id: crypto.randomUUID(),
        rawInput: "123 Main St, Denver, CO 80202",
        parsedAddress: "123 Main St, Denver, CO 80202",
        sourceUrl: undefined,
        thumbnailUrl: undefined,
        isExample: true, // Mark as example
      },
      {
        id: crypto.randomUUID(),
        rawInput: "456 Oak Ave, Denver, CO 80203",
        parsedAddress: "456 Oak Ave, Denver, CO 80203",
        sourceUrl: undefined,
        thumbnailUrl: undefined,
        isExample: true, // Mark as example
      },
      {
        id: crypto.randomUUID(),
        rawInput: "789 Elm St, Denver, CO 80204",
        parsedAddress: "789 Elm St, Denver, CO 80204",
        sourceUrl: undefined,
        thumbnailUrl: undefined,
        isExample: true, // Mark as example
      },
    ];
    setProperties(exampleProperties);
    setUsedExamples(true);
  };

  const handleCalculate = () => {
    // If empty, auto-fill examples
    if (properties.length === 0) {
      handleUseExamples();
    }
    setIsCalculated(true);
  };

  if (isCalculated) {
    // Show results
    return (
      <div className="demo-results">
        <h2 className="demo-results-title">Your Optimized Route</h2>

        {!usedExamples && (
          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            ℹ️ <strong>Demo Preview:</strong> Times and distances are randomized. Sign up for real routing!
          </div>
        )}

        <div className="demo-results-list">
          {properties.map((property, index) => (
            <div key={index} className="demo-result-item">
              <div className="demo-result-number">{index + 1}</div>
              <div className="demo-result-details">
                <div className="demo-result-address">{property.parsedAddress}</div>
                <div className="demo-result-time">
                  Start: {getFakeTime(index)} {index < properties.length - 1 && `• ${getFakeDuration()} min drive`}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="demo-results-summary">
          <div className="demo-summary-item">
            <strong>Total Drive Time:</strong> {getTotalDriveTime(properties.length)}
          </div>
          <div className="demo-summary-item">
            <strong>Total Showing Time:</strong> {getTotalShowingTime(properties.length)}
          </div>
        </div>

        <div className="demo-cta">
          <h3 className="demo-cta-title">
            {usedExamples
              ? "These are examples. Sign up for real routes!"
              : "Demo uses random times. Sign up for actual routing!"}
          </h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.5rem 0 1rem 0' }}>
            {!usedExamples && "Your addresses are saved and will be imported after signup!"}
          </p>
          <button onClick={onSignupClick} className="cta-button">
            Start Routing Faster
          </button>
        </div>
      </div>
    );
  }

  // Show input interface
  return (
    <div className="demo-input">
      <h2 className="demo-title">Try It Out!</h2>
      <p className="demo-subtitle">
        Add properties below to see how fast route optimization works.
      </p>

      <PropertyInputBox onAdd={handleAddProperty} />

      {properties.length > 0 && (
        <div className="demo-properties-list">
          <h3 className="demo-properties-title">Added Properties ({properties.length})</h3>
          {properties.map((property, index) => (
            <div key={index} className="demo-property-item">
              {index + 1}. {property.parsedAddress}
            </div>
          ))}
        </div>
      )}

      <div className="demo-actions">
        {properties.length === 0 && (
          <button onClick={handleUseExamples} className="demo-example-button">
            Use Example Addresses
          </button>
        )}

        <button
          onClick={handleCalculate}
          className="demo-calculate-button"
          disabled={properties.length === 0}
        >
          {properties.length === 0 ? "Add Properties or Use Examples" : "Calculate Optimal Route"}
        </button>
      </div>
    </div>
  );
}

// Helper functions for fake demo data
function getFakeTime(index: number): string {
  const startHour = 9;
  const startMinute = 43;
  const minutesPerStop = 37; // Includes drive + showing

  const totalMinutes = startMinute + (index * minutesPerStop);
  const hour = startHour + Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  return `${hour}:${minute.toString().padStart(2, '0')} AM`;
}

function getFakeDuration(): number {
  return Math.floor(Math.random() * 15) + 8; // 8-22 minutes
}

function getTotalDriveTime(numProperties: number): string {
  const minutes = (numProperties - 1) * 12; // Average drive time between properties
  return `${minutes} min`;
}

function getTotalShowingTime(numProperties: number): string {
  const totalMinutes = (numProperties - 1) * 37; // Drive + showing time
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${minutes}min`;
}
