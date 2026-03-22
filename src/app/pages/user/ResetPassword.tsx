"use client";

import { useState, useTransition, useEffect } from "react";
import { resetPassword } from "./passwordReset";
import { validatePasswordStrength } from "./password";
import "./login.css";

export function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [result, setResult] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setResult("Invalid reset link - no token found");
    }
  }, []);

  const handleSubmit = async () => {
    if (!password) {
      setResult("Please enter a password");
      return;
    }

    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      setResult(validation.error || "Password too weak");
      return;
    }

    if (password !== confirmPassword) {
      setResult("Passwords don't match");
      return;
    }

    if (!token) {
      setResult("Invalid reset link");
      return;
    }

    const response = await resetPassword(token, password);

    if (response.success) {
      setSuccess(true);
      setResult("Password reset successfully!");
    } else {
      setResult(response.error || "Failed to reset password. Please try again.");
    }
  };

  const handlePerformSubmit = () => {
    startTransition(() => void handleSubmit());
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="halftone-shadow"></div>

          <h1 className="login-title">Success!</h1>
          <p className="login-subtitle">Password Reset Complete</p>

          <div className="login-form">
            <p className="login-explainer">
              Your password has been reset successfully. You can now log in with your new password.
            </p>

            <div style={{ marginTop: '30px' }}>
              <a href="/user/login" className="login-button login-button-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Go to Login
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

        <h1 className="login-title">Reset Password</h1>
        <p className="login-subtitle">Set Your New Password</p>

        <div className="login-form">
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) {
                  handlePerformSubmit();
                }
              }}
              placeholder="At least 12 characters"
              className="login-input"
              disabled={isPending}
              autoComplete="new-password"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) {
                  handlePerformSubmit();
                }
              }}
              placeholder="Re-enter your password"
              className="login-input"
              disabled={isPending}
              autoComplete="new-password"
            />
          </div>

          <button
            onClick={handlePerformSubmit}
            disabled={isPending || !token}
            className="login-button login-button-primary"
          >
            {isPending ? "Resetting..." : "Reset Password"}
          </button>

          {result && !success && (
            <div className={`login-result error`}>
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
