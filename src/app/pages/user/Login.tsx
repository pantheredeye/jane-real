"use client";

import { useState, useTransition } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { finishPasskeyLogin, startPasskeyLogin } from "./functions";
import "./login.css";

export function Login() {
  const [result, setResult] = useState("");
  const [isPending, startTransition] = useTransition();

  const passkeyLogin = async () => {
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

  const handlePerformPasskeyLogin = () => {
    startTransition(() => void passkeyLogin());
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="halftone-shadow"></div>

        <h1 className="login-title">RouteFast</h1>
        <p className="login-subtitle">Welcome Back!</p>

        <div className="login-form">
          <p className="login-explainer">
            Click the button below to log in with your passkey.
          </p>

          <button
            onClick={handlePerformPasskeyLogin}
            disabled={isPending}
            className="login-button login-button-primary"
          >
            {isPending ? "Logging In..." : "Log In with Passkey"}
          </button>

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
    </div>
  );
}
