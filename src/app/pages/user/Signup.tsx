"use client";

import { useState, useTransition } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import {
  checkEmailAvailable,
  finishPasskeyRegistration,
  startPasskeyRegistration,
} from "./functions";
import "./signup.css";

export function Signup() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSignup = async () => {
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
    startTransition(() => void handleSignup());
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="halftone-shadow"></div>

        <h1 className="signup-title">RouteFast</h1>
        <p className="signup-subtitle">Start Your Free Trial</p>

        <div className="signup-form">
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

          <p className="signup-explainer">
            We'll create a secure passkey for your account—no password needed.
          </p>

          <button
            onClick={handlePerformSignup}
            disabled={isPending}
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
    </div>
  );
}
