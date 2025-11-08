"use client";

import { useState } from "react";
import TheaterModal from "@/app/components/shared/theaterModal/TheaterModal";
import DemoContent from "./DemoContent";

export default function DemoButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSignupClick = () => {
    // Close modal and redirect to signup
    setIsModalOpen(false);
    window.location.href = "/signup";
  };

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
        <DemoContent onSignupClick={handleSignupClick} />
      </TheaterModal>
    </>
  );
}
