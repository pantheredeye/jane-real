"use client";

interface CTAButtonProps {
  showNote?: boolean;
}

export default function CTAButton({ showNote = false }: CTAButtonProps) {
  const handleClick = () => {
    window.location.href = "/user/signup";
  };

  return (
    <button onClick={handleClick} className="cta-button">
      Start Routing Faster
      {showNote && <span className="cta-note">No charge until trial ends</span>}
    </button>
  );
}
