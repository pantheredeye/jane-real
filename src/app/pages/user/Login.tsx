"use client";

import { useState, useTransition } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { finishPasskeyLogin, startPasskeyLogin, loginWithPassword } from "./functions";
import { ensureTimezone } from "@/addons/agent/server-functions/preferences";
import { detectTimezone } from "@/addons/agent/utils/timezone";
import "./login.css";

async function captureTimezone() {
  const tz = detectTimezone();
  if (!tz) return;
  try {
    await ensureTimezone(tz);
  } catch (err) {
    console.error("ensureTimezone failed", err);
  }
}

export function Login() {
  const [authMode, setAuthMode] = useState<"password" | "passkey">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");
  const [isPending, startTransition] = useTransition();

  const handlePasswordLogin = async () => {
    if (!email.trim()) {
      setResult("Please enter your email");
      return;
    }

    if (!password) {
      setResult("Please enter your password");
      return;
    }

    const result = await loginWithPassword(email, password);
    if (result.success) {
      setResult("Login successful!");
      await captureTimezone();
      window.location.href = "/route/";
    } else {
      setResult(result.error || "Login failed. Please try again.");
    }
  };

  const handlePasskeyLogin = async () => {
    try {
      const options = await startPasskeyLogin();
      const login = await startAuthentication({ optionsJSON: options });
      const success = await finishPasskeyLogin(login);

      if (!success) {
        setResult("Fingerprint or face sign-in isn't set up for your account. Use password instead.");
        setAuthMode("password");
        return;
      }

      setResult("Login successful!");
      await captureTimezone();
      window.location.href = "/route/";
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        setResult("No fingerprint or face sign-in found on this device. Try password login or reset via email.");
        setAuthMode("password");
        return;
      }
      setResult("Fingerprint or face sign-in failed. Try password instead.");
      setAuthMode("password");
    }
  };

  const handlePerformLogin = () => {
    startTransition(() =>
      void (authMode === "password" ? handlePasswordLogin() : handlePasskeyLogin())
    );
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="halftone-shadow"></div>

        <h1 className="login-title">RouteFast</h1>
        <p className="login-subtitle">Welcome Back!</p>

        <div className="login-form">
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
              Fingerprint / Face
            </button>
          </div>

          {authMode === "password" ? (
            <>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isPending) {
                      handlePerformLogin();
                    }
                  }}
                  placeholder="jane@example.com"
                  className="login-input"
                  disabled={isPending}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isPending) {
                      handlePerformLogin();
                    }
                  }}
                  placeholder="Enter your password"
                  className="login-input"
                  disabled={isPending}
                  autoComplete="current-password"
                />
              </div>

              <button
                onClick={handlePerformLogin}
                disabled={isPending}
                className="login-button login-button-primary"
              >
                {isPending ? "Logging In..." : "Log In"}
              </button>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <a href="/user/forgot-password" className="login-link">
                  Forgot password?
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="login-explainer">
                Sign in with fingerprint or face on this device.
              </p>

              <button
                onClick={handlePerformLogin}
                disabled={isPending}
                className="login-button login-button-primary"
              >
                {isPending ? "Signing In..." : "Sign in with fingerprint or face"}
              </button>
            </>
          )}

          {result && (
            <div className={`login-result ${result.includes("successful") ? "success" : "error"}`}>
              {result}
            </div>
          )}
        </div>

        <div className="login-footer">
          <p>
            Need an account?{" "}
            <a href="/user/signup" className="login-link">
              Sign up
            </a>
          </p>
        </div>
      </div>

      <div className="page-footer">
        <a href="https://digitalglue.dev" target="_blank" rel="noopener noreferrer" className="footer-link">
          Crafted by Digital Glue
        </a>
      </div>
    </div>
  );
}
