"use client";

interface CTAButtonProps {
  showNote?: boolean;
  href?: string;
  label?: string;
  note?: string;
}

export default function CTAButton({
  showNote = false,
  href = "/user/auth",
  label = "Start Routing Faster",
  note = "15 free calculations to start",
}: CTAButtonProps) {
  const handleClick = () => {
    window.location.href = href;
  };

  return (
    <button onClick={handleClick} className="cta-button">
      {label}
      {showNote && <span className="cta-note">{note}</span>}
    </button>
  );
}
