"use client";

import { useEffect, useState } from "react";
import TheaterCloseButton from "./TheaterCloseButton";
import "./theater-modal.css";

interface TheaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function TheaterModal({ isOpen, onClose, children }: TheaterModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to trigger animation after render
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 600); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      className={`theater-modal-overlay ${isAnimating ? "theater-modal-open" : ""}`}
      onClick={(e) => {
        // Close if clicking the overlay (not the content)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="theater-modal-container">
        {/* Close button */}
        <TheaterCloseButton onClick={onClose} />

        {/* Comic borders that expand during animation */}
        <div className="theater-modal-border theater-modal-border-top"></div>
        <div className="theater-modal-border theater-modal-border-right"></div>
        <div className="theater-modal-border theater-modal-border-bottom"></div>
        <div className="theater-modal-border theater-modal-border-left"></div>

        {/* Content area */}
        <div className="theater-modal-content">{children}</div>
      </div>
    </div>
  );
}
