"use client";

import { useState, useTransition } from "react";
import { setPassword } from "./accountActions";

export function SetPasswordPanel({ hasPassword }: { hasPassword: boolean }) {
  const [done, setDone] = useState(hasPassword);
  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (done) return null;

  const handleSubmit = () => {
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    startTransition(async () => {
      const result = await setPassword(password);
      if (!result.success) {
        setError(result.error || "Could not save password");
        return;
      }
      setDone(true);
    });
  };

  return (
    <section className="passkey-panel" aria-labelledby="set-password-heading">
      <h2 id="set-password-heading" className="passkey-panel-title">Speed up sign-in</h2>
      <p className="passkey-panel-status">
        You're using magic links. Set a password and skip checking your email next time.
      </p>

      <div className="form-group">
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPasswordValue(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          disabled={isPending}
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirm-password">Confirm password</label>
        <input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isPending) handleSubmit();
          }}
        />
      </div>

      <div className="passkey-panel-actions">
        <button
          type="button"
          className="passkey-btn passkey-btn-primary"
          onClick={handleSubmit}
          disabled={isPending || !password}
        >
          {isPending ? "Saving..." : "Set password"}
        </button>
      </div>

      {error && (
        <div className="passkey-message passkey-message-error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
