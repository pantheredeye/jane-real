"use client";

import { useState, useTransition } from "react";
import { requestPasswordReset } from "./passwordReset";
import "./login.css";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async () => {
    if (!email.trim()) {
      setResult("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setResult("Please enter a valid email address");
      return;
    }

    try {
      const response = await requestPasswordReset(email);

      if (response.success) {
        setSent(true);
        setResult("If an account exists with that email, we've sent a password reset link.");
      } else {
        setResult(response.error || "Failed to send reset email. Please try again.");
      }
    } catch {
      setResult("Too many attempts or network error. Try again in a few minutes.");
    }
  };

  const handlePerformSubmit = () => {
    startTransition(() => void handleSubmit());
  };

  if (sent) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="halftone-shadow"></div>

          <h1 className="login-title">Check Your Email</h1>
          <p className="login-subtitle">Password Reset Link Sent</p>

          <div className="login-form">
            <p className="login-explainer">
              If an account exists with <strong>{email}</strong>, we've sent a password reset link.
              Check your inbox and click the link to reset your password.
            </p>

            <p className="login-explainer" style={{ marginTop: '20px' }}>
              The link will expire in 1 hour.
            </p>

            <div style={{ marginTop: '30px' }}>
              <a href="/user/auth" className="login-button login-button-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="halftone-shadow"></div>

        <h1 className="login-title">Forgot Password</h1>
        <p className="login-subtitle">Reset Your Password</p>

        <div className="login-form">
          <p className="login-explainer">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) {
                  handlePerformSubmit();
                }
              }}
              placeholder="jane@example.com"
              className="login-input"
              disabled={isPending}
              autoComplete="email"
              autoFocus
            />
          </div>

          <button
            onClick={handlePerformSubmit}
            disabled={isPending}
            className="login-button login-button-primary"
          >
            {isPending ? "Sending..." : "Send Reset Link"}
          </button>

          {result && !sent && (
            <div className={`login-result error`}>
              {result}
            </div>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <a href="/user/auth" className="login-link">
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
