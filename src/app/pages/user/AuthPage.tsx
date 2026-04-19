"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import {
  finishPasskeyLogin,
  startPasskeyLogin,
  loginWithPassword,
  signupWithPassword,
} from "./functions";
import { lookupAuthMethod, type AuthLookupResult } from "./authLookup";
import { requestMagicLink } from "./magicLink";
import "./auth.css";

type Step = "email" | "method" | "check-email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 60;

export function AuthPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<AuthLookupResult | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [passkeyAttempted, setPasskeyAttempted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const passkeyAutoFiredRef = useRef(false);

  useEffect(() => {
    if (step === "email") emailInputRef.current?.focus();
    if (step === "method" && (!lookup?.hasPasskey || passkeyAttempted)) {
      passwordInputRef.current?.focus();
    }
  }, [step, lookup, passkeyAttempted]);

  useEffect(() => {
    if (step !== "method") return;
    if (!lookup?.exists || !lookup.hasPasskey) return;
    if (passkeyAttempted) return;
    if (passkeyAutoFiredRef.current) return;
    passkeyAutoFiredRef.current = true;
    const timer = setTimeout(() => {
      void runPasskeyAuto();
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, lookup, passkeyAttempted]);

  useEffect(() => {
    if (step !== "check-email") return;
    setResendIn(RESEND_SECONDS);
    const timer = setInterval(() => {
      setResendIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step !== "check-email") return;
    setPollTimedOut(false);
    let elapsed = 0;
    const maxMs = 10 * 60 * 1000;
    const id = setInterval(async () => {
      elapsed += 3000;
      if (elapsed >= maxMs) {
        clearInterval(id);
        setPollTimedOut(true);
        return;
      }
      try {
        const r = await fetch("/api/auth/status");
        const data = (await r.json()) as { authenticated?: boolean };
        if (data.authenticated) {
          clearInterval(id);
          window.location.href = "/route/";
        }
      } catch {
        // ignore transient network errors
      }
    }, 3000);
    return () => clearInterval(id);
  }, [step]);

  const resetToEmail = () => {
    setStep("email");
    setEmail("");
    setLookup(null);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setPasskeyAttempted(false);
    passkeyAutoFiredRef.current = false;
  };

  const submitEmail = async () => {
    setError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email to continue");
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }

    const result = await lookupAuthMethod(trimmed);
    if (result.rateLimited) {
      setError("Too many attempts. Try again in a few minutes.");
      return;
    }
    setEmail(trimmed);
    setLookup(result);
    setStep("method");
  };

  const handlePasswordLogin = async () => {
    setError("");
    if (!password) {
      setError("Enter your password");
      return;
    }
    const result = await loginWithPassword(email, password);
    if (result.success) {
      window.location.href = "/route/";
    } else {
      setError(result.error || "Sign-in failed. Please try again.");
    }
  };

  const handlePasswordSignup = async () => {
    setError("");
    if (!password) {
      setError("Choose a password");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    const result = await signupWithPassword(email, password);
    if (result.success) {
      window.location.href = "/route/";
    } else {
      setError(result.error || "Signup failed. Please try again.");
    }
  };

  const handlePasskey = async () => {
    setError("");
    try {
      const options = await startPasskeyLogin();
      const login = await startAuthentication({ optionsJSON: options });
      const success = await finishPasskeyLogin(login);
      if (!success) {
        setPasskeyAttempted(true);
        return;
      }
      window.location.href = "/route/";
    } catch (err) {
      console.error("Passkey failed:", err);
      setPasskeyAttempted(true);
    }
  };

  const runPasskeyAuto = async () => {
    await handlePasskey();
  };

  const handleMagicLink = async () => {
    setError("");
    const result = await requestMagicLink(email);
    if (result.success) {
      setStep("check-email");
    } else {
      setError(result.error || "Failed to send sign-in email. Please try again.");
    }
  };

  const runAction = (fn: () => Promise<void>) => {
    startTransition(() => void fn());
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="halftone-shadow"></div>

        <h1 className="auth-title">RouteFast</h1>

        {step === "email" && (
          <div className="auth-step">
            <p className="auth-subtitle">Sign in or create account</p>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isPending) runAction(submitEmail);
                }}
                placeholder="jane@example.com"
                className="auth-input"
                disabled={isPending}
                autoComplete="email"
                autoFocus
              />
            </div>

            <button
              onClick={() => runAction(submitEmail)}
              disabled={isPending}
              className="login-button login-button-primary"
            >
              {isPending ? "Checking..." : "Continue"}
            </button>

            <p className="auth-consent">
              By continuing, you agree to our{" "}
              <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="auth-link">
                Terms
              </a>{" "}
              and{" "}
              <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="auth-link">
                Privacy
              </a>
              .
            </p>

            {error && (
              <div className="auth-result error" role="alert">
                {error}
              </div>
            )}
          </div>
        )}

        {step === "method" && lookup && (
          <div className="auth-step">
            <p className="auth-step-header">
              {lookup.exists ? "Welcome back," : "Let's set you up,"}{" "}
              <strong>{email}</strong>{" "}
              <button
                type="button"
                onClick={resetToEmail}
                className="auth-inline-link"
                disabled={isPending}
              >
                different?
              </button>
            </p>

            {lookup.exists && lookup.hasPasskey && !passkeyAttempted ? (
              <div className="auth-auto-trigger" role="status" aria-live="polite">
                <div className="auth-spinner" aria-hidden />
                <p className="auth-auto-trigger-text">
                  Signing you in with fingerprint or face…
                </p>
              </div>
            ) : lookup.exists ? (
              <>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    ref={passwordInputRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isPending) runAction(handlePasswordLogin);
                    }}
                    placeholder="Enter your password"
                    className="auth-input"
                    disabled={isPending}
                    autoComplete="current-password"
                    autoFocus={!lookup.hasPasskey}
                  />
                </div>

                <button
                  onClick={() => runAction(handlePasswordLogin)}
                  disabled={isPending}
                  className="login-button login-button-primary"
                >
                  {isPending ? "Signing in..." : "Sign in"}
                </button>

                <button
                  onClick={() => runAction(handleMagicLink)}
                  disabled={isPending}
                  className="login-button login-button-secondary"
                >
                  {isPending ? "Sending..." : "Email me a magic link"}
                </button>

                <div className="auth-footer-actions">
                  <a href="/user/forgot-password" className="auth-link">
                    Forgot password?
                  </a>
                </div>

                {lookup.hasPasskey && passkeyAttempted && (
                  <p className="auth-recovery-banner">
                    Having trouble with fingerprint/face? After signing in, you can reset it in Account settings.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    ref={passwordInputRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isPending) runAction(handlePasswordSignup);
                    }}
                    placeholder="At least 8 characters"
                    className="auth-input"
                    disabled={isPending}
                    autoComplete="new-password"
                    autoFocus
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
                      if (e.key === "Enter" && !isPending) runAction(handlePasswordSignup);
                    }}
                    placeholder="Re-enter your password"
                    className="auth-input"
                    disabled={isPending}
                    autoComplete="new-password"
                  />
                </div>

                <button
                  onClick={() => runAction(handlePasswordSignup)}
                  disabled={isPending}
                  className="login-button login-button-primary"
                >
                  {isPending ? "Creating account..." : "Create account"}
                </button>

                <div className="auth-divider"><span>or</span></div>

                <button
                  onClick={() => runAction(handleMagicLink)}
                  disabled={isPending}
                  className="login-button login-button-secondary"
                >
                  {isPending ? "Sending..." : "Email me a magic link — no password needed"}
                </button>

                <p className="auth-signup-note">15 free route calculations to start.</p>
              </>
            )}

            {error && (
              <div className="auth-result error" role="alert">
                {error}
              </div>
            )}
          </div>
        )}

        {step === "check-email" && (
          <div className="auth-step">
            <div className="auth-envelope" aria-hidden>
              ✉
            </div>
            <h2 className="auth-step-title">Check your email</h2>
            <p className="auth-explainer">
              {pollTimedOut
                ? "Done on another device? Refresh this page to continue."
                : <>We sent a sign-in link to <strong>{email}</strong>. Tap the link to continue. It works for 15 minutes.</>}
            </p>

            {resendIn > 0 ? (
              <p className="auth-resend-countdown">
                Didn't get it? Resend in 0:{resendIn.toString().padStart(2, "0")}
              </p>
            ) : (
              <button
                onClick={() => runAction(handleMagicLink)}
                disabled={isPending}
                className="login-button login-button-secondary"
              >
                {isPending ? "Sending..." : "Resend"}
              </button>
            )}

            <button
              type="button"
              onClick={resetToEmail}
              className="auth-restart"
              disabled={isPending}
            >
              Wrong email? Start over
            </button>

            {error && (
              <div className="auth-result error" role="alert">
                {error}
              </div>
            )}
          </div>
        )}
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
      </div>
    </div>
  );
}
