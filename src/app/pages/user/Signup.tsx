"use client";

import { useState, useTransition } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import {
  checkEmailAvailable,
  finishPasskeyRegistration,
  startPasskeyRegistration,
  signupWithPassword,
} from "./functions";
import "./signup.css";

export function Signup() {
  const [authMode, setAuthMode] = useState<"password" | "passkey">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [result, setResult] = useState("");
  const [isPending, startTransition] = useTransition();

  const handlePasswordSignup = async () => {
    if (!email.trim()) {
      setResult("Please enter your email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setResult("Please enter a valid email address");
      return;
    }

    if (!password) {
      setResult("Please enter a password");
      return;
    }

    if (password !== confirmPassword) {
      setResult("Passwords don't match");
      return;
    }

    if (!agreedToTerms) {
      setResult("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    const result = await signupWithPassword(email, password);
    if (result.success) {
      setResult("Account created successfully!");
      window.location.href = "/route/";
    } else {
      setResult(result.error || "Signup failed. Please try again.");
    }
  };

  const handlePasskeySignup = async () => {
    if (!email.trim()) {
      setResult("Please enter your email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setResult("Please enter a valid email address");
      return;
    }

    if (!agreedToTerms) {
      setResult("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    try {
      // 1. Check if email is already registered
      const isAvailable = await checkEmailAvailable(email);
      if (!isAvailable) {
        setResult("account-exists");
        return;
      }

      // 2. Get a challenge from the worker
      const options = await startPasskeyRegistration(email);

      // 3. Ask the browser to create a passkey
      const registration = await startRegistration({ optionsJSON: options });

      // 4. Finish the registration process
      const success = await finishPasskeyRegistration(email, registration);

      if (!success) {
        setResult("Signup failed. Please try again.");
      } else {
        setResult("Account created successfully!");
        // Redirect to route calculator after successful signup
        window.location.href = "/route/";
      }
    } catch (error) {
      console.error("Signup error:", error);
      setResult("Signup failed. Please try again.");
    }
  };

  const handlePerformSignup = () => {
    startTransition(() =>
      void (authMode === "password" ? handlePasswordSignup() : handlePasskeySignup())
    );
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="halftone-shadow"></div>

        <h1 className="signup-title">RouteFast</h1>
        <p className="signup-subtitle">Start with 15 Free Calculations</p>

        <div className="signup-form">
          <div className="auth-mode-toggle">
            <button
              type="button"
              className={`auth-mode-btn ${authMode === "password" ? "active" : ""}`}
              onClick={() => setAuthMode("password")}
              disabled={isPending}
            >
              Password
            </button>
            <button
              type="button"
              className={`auth-mode-btn ${authMode === "passkey" ? "active" : ""}`}
              onClick={() => setAuthMode("passkey")}
              disabled={isPending}
            >
              Passkey
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) {
                  handlePerformSignup();
                }
              }}
              placeholder="jane@example.com"
              className="signup-input"
              disabled={isPending}
              autoComplete="email"
              autoFocus
            />
          </div>

          {authMode === "password" ? (
            <>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isPending) {
                      handlePerformSignup();
                    }
                  }}
                  placeholder="At least 12 characters"
                  className="signup-input"
                  disabled={isPending}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isPending) {
                      handlePerformSignup();
                    }
                  }}
                  placeholder="Re-enter your password"
                  className="signup-input"
                  disabled={isPending}
                  autoComplete="new-password"
                />
              </div>
            </>
          ) : (
            <p className="signup-explainer">
              We'll create a secure passkey for your account—no password needed.
            </p>
          )}

          <div className="terms-checkbox-container">
            <label className="terms-checkbox-label">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="terms-checkbox"
                disabled={isPending}
              />
              <span>
                I agree to the{" "}
                <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="terms-link">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="terms-link">
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          <button
            onClick={handlePerformSignup}
            disabled={isPending || !agreedToTerms}
            className="signup-button"
          >
            {isPending ? "Creating Account..." : "Create Account"}
          </button>

          {result && (
            <div className={`signup-result ${result.includes("successful") ? "success" : "error"}`}>
              {result === "account-exists" ? (
                <>
                  An account with this email already exists.{" "}
                  <a href="/user/login" className="signup-link">
                    Log in instead
                  </a>
                </>
              ) : (
                result
              )}
            </div>
          )}
        </div>

        <div className="signup-footer">
          <p>
            Already have an account?{" "}
            <a href="/user/login" className="signup-link">
              Log in
            </a>
          </p>
        </div>
      </div>

      <div className="page-footer">
        <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="footer-link">
          Terms of Service
        </a>
        <span className="footer-divider">•</span>
        <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="footer-link">
          Privacy Policy
        </a>
        <span className="footer-divider">•</span>
        <a href="mailto:barrett@digitalglue.dev" className="footer-link">
          Contact
        </a>
        <span className="footer-divider">•</span>
        <a href="https://digitalglue.dev" target="_blank" rel="noopener noreferrer" className="footer-link">
          Crafted by Digital Glue
        </a>
      </div>
    </div>
  );
}
