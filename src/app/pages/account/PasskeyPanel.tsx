"use client";

import { useState, useTransition } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import {
  startPasskeyAddition,
  finishPasskeyAddition,
  removePasskey,
} from "../user/functions";

type Passkey = {
  id: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function defaultLabel() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPhone|iPad/i.test(ua)) return "iPhone";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows PC";
  return "Device";
}

export function PasskeyPanel({
  initial,
  showFailureBanner = false,
}: {
  initial: Passkey[];
  showFailureBanner?: boolean;
}) {
  const [passkeys, setPasskeys] = useState<Passkey[]>(initial);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [banner, setBanner] = useState(showFailureBanner);
  const [resetting, setResetting] = useState(false);

  const registerFreshPasskey = async () => {
    const suggested = defaultLabel();
    const label = prompt("Name this device (e.g. iPhone, Work MacBook)", suggested)?.trim();
    if (label === undefined) return false; // user cancelled

    const options = await startPasskeyAddition();
    const registration = await startRegistration({ optionsJSON: options });
    const result = await finishPasskeyAddition(registration, label || undefined);
    if (!result.success) {
      setMessage({ kind: "error", text: result.error || "Could not set up fingerprint or face sign-in" });
      return false;
    }
    setPasskeys((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: label || null,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      },
    ]);
    return true;
  };

  const handleAdd = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const ok = await registerFreshPasskey();
        if (ok) setMessage({ kind: "success", text: "Fingerprint or face sign-in enabled!" });
      } catch (error) {
        if (error instanceof Error && error.name === "NotAllowedError") {
          setMessage({ kind: "error", text: "Sign-in setup was cancelled." });
          return;
        }
        console.error("Passkey registration error:", error);
        setMessage({ kind: "error", text: "Could not set up fingerprint or face sign-in. Please try again." });
      }
    });
  };

  const handleRemove = (id: string, label: string | null) => {
    const name = label || "this device";
    if (!confirm(`Remove ${name}? You won't be able to sign in with fingerprint or face from it anymore.`)) {
      return;
    }
    setMessage(null);
    setRemovingId(id);
    startTransition(async () => {
      const result = await removePasskey(id);
      setRemovingId(null);
      if (!result.success) {
        setMessage({ kind: "error", text: result.error || "Could not remove this device" });
        return;
      }
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
      setMessage({ kind: "success", text: "Device removed." });
    });
  };

  const handleReset = () => {
    if (
      !confirm(
        "This will delete your current fingerprint/face setup. You'll set it up fresh after. Continue?",
      )
    ) {
      return;
    }
    setMessage(null);
    setResetting(true);
    startTransition(async () => {
      try {
        const result = await removePasskey();
        if (!result.success) {
          setMessage({ kind: "error", text: result.error || "Could not reset fingerprint or face sign-in" });
          return;
        }
        setPasskeys([]);
        setBanner(false);

        const ok = await registerFreshPasskey();
        if (ok) {
          setMessage({
            kind: "success",
            text: "Fingerprint or face sign-in reset. You're all set!",
          });
        } else {
          setMessage({
            kind: "success",
            text: "Old sign-in cleared. Tap 'Add this device' when you're ready to set up a new one.",
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name === "NotAllowedError") {
          setMessage({
            kind: "success",
            text: "Old sign-in cleared. Tap 'Add this device' when you're ready to set up a new one.",
          });
          return;
        }
        console.error("Passkey reset error:", error);
        setMessage({ kind: "error", text: "Could not reset fingerprint or face sign-in. Please try again." });
      } finally {
        setResetting(false);
      }
    });
  };

  return (
    <section className="passkey-panel">
      <h2 className="passkey-panel-title">Fingerprint or face sign-in</h2>
      <p className="passkey-panel-status">
        {passkeys.length === 0
          ? "No devices set up for fingerprint or face sign-in"
          : `${passkeys.length} device${passkeys.length === 1 ? "" : "s"} set up`}
      </p>

      {banner && (
        <div className="passkey-failure-banner" role="alert">
          <div className="passkey-failure-banner-text">
            ⚠ Your fingerprint or face sign-in has failed recently.
          </div>
          <button
            type="button"
            className="passkey-btn passkey-btn-warning passkey-btn-small"
            onClick={handleReset}
            disabled={isPending}
          >
            {resetting ? "Resetting..." : "Reset it"}
          </button>
        </div>
      )}

      {passkeys.length > 0 && (
        <ul className="passkey-list">
          {passkeys.map((p) => (
            <li key={p.id} className="passkey-list-item">
              <div className="passkey-list-info">
                <div className="passkey-list-label">{p.label || "Unnamed device"}</div>
                <div className="passkey-list-meta">
                  Added {formatDate(p.createdAt)}
                  {p.lastUsedAt ? ` · Last used ${formatDate(p.lastUsedAt)}` : " · Never used"}
                </div>
              </div>
              <button
                type="button"
                className="passkey-btn passkey-btn-danger passkey-btn-small"
                onClick={() => handleRemove(p.id, p.label)}
                disabled={isPending && removingId === p.id}
              >
                {isPending && removingId === p.id ? "Removing..." : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="passkey-panel-actions">
        <button
          type="button"
          className="passkey-btn passkey-btn-primary"
          onClick={handleAdd}
          disabled={isPending && removingId === null && !resetting}
        >
          {isPending && removingId === null && !resetting ? "Setting up..." : "Add this device"}
        </button>

        {passkeys.length > 0 && (
          <button
            type="button"
            className="passkey-btn passkey-btn-warning"
            onClick={handleReset}
            disabled={isPending}
          >
            {resetting ? "Resetting..." : "Fingerprint or face sign-in not working? Reset it"}
          </button>
        )}
      </div>

      {message && (
        <div className={`passkey-message passkey-message-${message.kind}`} role="alert">
          {message.text}
        </div>
      )}
    </section>
  );
}
