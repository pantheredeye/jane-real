"use client";

import { useCallback, useState } from "react";
import type { EventCardData, EventTypeValue } from "./cardTypes";

const TYPE_ICON: Record<EventTypeValue, string> = {
  SHOWING: "🏠",
  CLOSING: "📝",
  INSPECTION: "🔍",
  APPRAISAL: "💰",
  LAWYER: "⚖️",
  TITLE: "📜",
  MEETING: "🤝",
  OPEN_HOUSE: "🚪",
  DEADLINE: "⏰",
  OTHER: "📌",
};

function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time: string, durationMinutes: number): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const start = new Date();
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function buildSummary(event: EventCardData): string {
  const lines = [
    `${event.title} (${event.type})`,
    `${formatDate(event.date)} · ${formatTime(event.time, event.durationMinutes)}`,
  ];
  if (event.address) lines.push(event.address);
  if (event.contactName || event.contactPhone) {
    lines.push(
      [event.contactName, event.contactPhone].filter(Boolean).join(" · "),
    );
  }
  return lines.join("\n");
}

export interface EventCardProps {
  event: EventCardData;
  preview?: boolean;
}

export function EventCard({ event, preview }: EventCardProps) {
  const [copied, setCopied] = useState(false);
  const icon = TYPE_ICON[event.type] ?? TYPE_ICON.OTHER;
  const directionsHref = event.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address)}`
    : null;
  const callHref = event.contactPhone ? `tel:${event.contactPhone}` : null;

  const handleShare = useCallback(async () => {
    const summary = buildSummary(event);
    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({ title: event.title, text: summary });
        return;
      }
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User-cancelled share or clipboard denied — silent.
    }
  }, [event]);

  return (
    <article
      className={`agent-card agent-card--event${preview ? " agent-card--preview" : ""}`}
      aria-label={`Event: ${event.title}`}
    >
      <header className="agent-card__header">
        <span className="agent-card__icon" aria-hidden="true">
          {icon}
        </span>
        <div className="agent-card__heading">
          <h3 className="agent-card__title">{event.title}</h3>
          <span className="agent-card__pill">{event.type.replace("_", " ")}</span>
        </div>
        {preview && <span className="agent-card__badge">Preview</span>}
      </header>

      <div className="agent-card__body">
        <div className="agent-card__row">
          <span className="agent-card__label">When</span>
          <span>
            {formatDate(event.date)} · {formatTime(event.time, event.durationMinutes)}
          </span>
        </div>
        {event.address && (
          <div className="agent-card__row">
            <span className="agent-card__label">Where</span>
            <span>{event.address}</span>
          </div>
        )}
        {(event.contactName || event.contactPhone) && (
          <div className="agent-card__row">
            <span className="agent-card__label">Contact</span>
            <span>
              {[event.contactName, event.contactPhone].filter(Boolean).join(" · ")}
            </span>
          </div>
        )}
      </div>

      <div className="agent-card__actions">
        {directionsHref && (
          <a
            className="agent-card__action"
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Directions
          </a>
        )}
        {callHref && (
          <a className="agent-card__action" href={callHref}>
            Call
          </a>
        )}
        <button
          type="button"
          className="agent-card__action"
          onClick={handleShare}
        >
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
    </article>
  );
}
