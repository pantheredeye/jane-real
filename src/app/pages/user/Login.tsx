"use client";

import { useState, useTransition } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { finishPasskeyLogin, startPasskeyLogin, loginWithPassword } from "./functions";
import "./login.css";

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

    try {
      const success = await loginWithPassword(email, password);
      if (success) {
        setResult("Login successful!");
        window.location.href = "/route/";
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setResult(error?.message || "Login failed. Please try again.");
    }
  };

  const handlePasskeyLogin = async () => {
    try {
      // 1. Get a challenge from the worker
      const options = await startPasskeyLogin();

      // 2. Ask the browser to sign the challenge
      const login = await startAuthentication({ optionsJSON: options });

      // 3. Give the signed challenge to the worker to finish the login process
      const success = await finishPasskeyLogin(login);

      if (!success) {
        setResult("Login failed. Please try again.");
      } else {
        setResult("Login successful!");
        window.location.href = "/route/";
      }
    } catch (error) {
      console.error("Login error:", error);
      setResult("Login failed. Please try again.");
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
              Passkey
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
            </>
          ) : (
            <>
              <p className="login-explainer">
                Click the button below to log in with your passkey.
              </p>

              <button
                onClick={handlePerformLogin}
                disabled={isPending}
                className="login-button login-button-primary"
              >
                {isPending ? "Logging In..." : "Log In with Passkey"}
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
