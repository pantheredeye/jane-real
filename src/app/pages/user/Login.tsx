"use client";

import { useState, useTransition } from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import {
  finishPasskeyLogin,
  finishPasskeyRegistration,
  startPasskeyLogin,
  startPasskeyRegistration,
} from "./functions";
import "./login.css";

export function Login() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState("");
  const [isPending, startTransition] = useTransition();

  const passkeyLogin = async () => {
    // 1. Get a challenge from the worker
    const options = await startPasskeyLogin();

    // 2. Ask the browser to sign the challenge
    const login = await startAuthentication({ optionsJSON: options });

    // 3. Give the signed challenge to the worker to finish the login process
    const success = await finishPasskeyLogin(login);

    if (!success) {
      setResult("Login failed");
    } else {
      setResult("Login successful!");
      window.location.href = "/route/";
    }
  };

  const passkeyRegister = async () => {
    if (!username.trim()) {
      setResult("Please enter a username");
      return;
    }

    // 1. Get a challenge from the worker
    const options = await startPasskeyRegistration(username);

    // 2. Ask the browser to sign the challenge
    const registration = await startRegistration({ optionsJSON: options });

    // 3. Give the signed challenge to the worker to finish the registration process
    const success = await finishPasskeyRegistration(username, registration);

    if (!success) {
      setResult("Registration failed");
    } else {
      setResult("Registration successful!");
      window.location.href = "/route/";
    }
  };

  const handlePerformPasskeyLogin = () => {
    startTransition(() => void passkeyLogin());
  };

  const handlePerformPasskeyRegister = () => {
    startTransition(() => void passkeyRegister());
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="halftone-shadow"></div>

        <h1 className="login-title">RouteFast</h1>
        <p className="login-subtitle">Welcome Back!</p>

        <div className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="login-input"
              disabled={isPending}
            />
          </div>

          <div className="button-group">
            <button
              onClick={handlePerformPasskeyLogin}
              disabled={isPending}
              className="login-button login-button-secondary"
            >
              {isPending ? "..." : "Login with Passkey"}
            </button>
            <button
              onClick={handlePerformPasskeyRegister}
              disabled={isPending}
              className="login-button login-button-primary"
            >
              {isPending ? "..." : "Create Account"}
            </button>
          </div>

          {result && (
            <div className={`login-result ${result.includes("successful") ? "success" : "error"}`}>
              {result}
            </div>
          )}
        </div>

        <div className="login-info">
          <p><strong>New here?</strong> Enter a username and click "Create Account"</p>
          <p><strong>Returning?</strong> Just click "Login with Passkey"</p>
        </div>
      </div>
    </div>
  );
}
