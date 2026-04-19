"use client";

import { useState, useTransition } from "react";
import { dismissPasswordNudge } from "./accountActions";

export function PasswordNudgeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (dismissed) return null;

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissPasswordNudge();
      setDismissed(true);
    });
  };

  return (
    <div className="password-nudge" role="status">
      <div className="password-nudge-text">
        Tired of checking your email? <strong>Add a password</strong> to sign in faster.
      </div>
      <div className="password-nudge-actions">
        <a href="/account" className="password-nudge-btn password-nudge-btn-primary">
          Set now
        </a>
        <button
          type="button"
          className="password-nudge-btn password-nudge-btn-secondary"
          onClick={handleDismiss}
          disabled={isPending}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
