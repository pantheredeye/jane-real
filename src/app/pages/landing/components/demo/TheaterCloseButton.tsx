"use client";

import "./theater-close-button.css";

interface TheaterCloseButtonProps {
  onClick: () => void;
}

export default function TheaterCloseButton({ onClick }: TheaterCloseButtonProps) {
  return (
    <button
      className="theater-close-button"
      onClick={onClick}
      aria-label="Close modal"
      title="Close (or press ESC)"
    >
      <span className="theater-close-icon">✕</span>
    </button>
  );
}
