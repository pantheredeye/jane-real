"use client";

import { useCallback, useState } from "react";
import type { ReminderCardData } from "./cardTypes";

function formatRelative(remindAt: string): string {
  const target = new Date(remindAt);
  if (Number.isNaN(target.getTime())) return remindAt;
  const now = Date.now();
  const diffMs = target.getTime() - now;
  const absMin = Math.round(Math.abs(diffMs) / 60_000);
  const past = diffMs < 0;

  if (absMin < 1) return past ? "just now" : "in less than a minute";
  if (absMin < 60) {
    return past ? `${absMin}m ago` : `in ${absMin}m`;
  }
  const absHr = Math.round(absMin / 60);
  if (absHr < 24) {
    return past ? `${absHr}h ago` : `in ${absHr}h`;
  }
  const absDays = Math.round(absHr / 24);
  if (absDays < 7) {
    return past ? `${absDays}d ago` : `in ${absDays}d`;
  }
  return target.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatExact(remindAt: string): string {
  const d = new Date(remindAt);
  if (Number.isNaN(d.getTime())) return remindAt;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export interface ReminderCardProps {
  reminder: ReminderCardData;
  preview?: boolean;
}

export function ReminderCard({ reminder, preview }: ReminderCardProps) {
  const [dismissing, setDismissing] = useState(false);
  const [dismissed, setDismissed] = useState(
    reminder.status === "DISMISSED",
  );
  const [error, setError] = useState<string | null>(null);

  const handleDismiss = useCallback(async () => {
    if (dismissing || dismissed || preview) return;
    setDismissing(true);
    setError(null);
    try {
      const res = await fetch(
        `/agent/reminders/${encodeURIComponent(reminder.id)}/dismiss`,
        { method: "POST", credentials: "same-origin" },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? `Failed (${res.status})`);
        return;
      }
      setDismissed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDismissing(false);
    }
  }, [reminder.id, dismissing, dismissed, preview]);

  return (
    <article
      className={`agent-card agent-card--reminder${
        preview ? " agent-card--preview" : ""
      }${dismissed ? " agent-card--dismissed" : ""}`}
      aria-label={`Reminder: ${reminder.message}`}
    >
      <header className="agent-card__header">
        <span className="agent-card__icon" aria-hidden="true">
          🔔
        </span>
        <div className="agent-card__heading">
          <h3 className="agent-card__title">{reminder.message}</h3>
          <span className="agent-card__pill" title={formatExact(reminder.remindAt)}>
            {formatRelative(reminder.remindAt)}
          </span>
        </div>
        {preview && <span className="agent-card__badge">Preview</span>}
      </header>

      {reminder.eventId && !preview && (
        <div className="agent-card__body">
          <div className="agent-card__row">
            <span className="agent-card__label">Linked event</span>
            <a
              className="agent-card__link"
              href={`#event-${reminder.eventId}`}
            >
              View event
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="agent-card__error" role="alert">
          {error}
        </div>
      )}

      {!preview && (
        <div className="agent-card__actions">
          <button
            type="button"
            className="agent-card__action"
            onClick={handleDismiss}
            disabled={dismissing || dismissed}
          >
            {dismissed ? "Dismissed" : dismissing ? "Dismissing…" : "Dismiss"}
          </button>
        </div>
      )}
    </article>
  );
}
