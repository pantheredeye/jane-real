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
      {showNote && <span className="cta-note">15 free calculations to start</span>}
    </button>
  );
}
