"use client";

import { useState } from "react";
import TheaterModal from "./TheaterModal";

export default function DemoButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="cta-button"
        style={{ marginLeft: "20px" }}
      >
        See It In Action
      </button>

      <TheaterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {/* Placeholder content for now */}
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: "48px", marginBottom: "20px" }}>
            Demo Coming Soon!
          </h2>
          <p style={{ fontSize: "18px", lineHeight: "1.6" }}>
            The theater modal animation is working! 🎉
            <br />
            <br />
            Next step: Add the demo content with PropertyInputBox and results display.
          </p>
        </div>
      </TheaterModal>
    </>
  );
}
