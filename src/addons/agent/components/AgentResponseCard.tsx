"use client";

import { useEffect, useRef, useState } from "react";
import { useVoice, type VoiceResult } from "../contexts/VoiceContext";
import { EventCard } from "./EventCard";
import { ReminderCard } from "./ReminderCard";
import type { EventCardData, ReminderCardData } from "./cardTypes";
import type { SeedMessage } from "./ChatPanel";

const DISMISS_MS = 30_000;
const MAX_ENTRIES = 3;
const SNIPPET_MAX = 140;

interface Entry {
  key: number;
  result: VoiceResult;
  // ms timestamp when this entry should auto-dismiss; null = sticky
  // (newest entry is sticky until a newer one arrives or the user closes it)
  dismissAt: number | null;
}

interface ToolCallLite {
  id: string;
  name: string;
  result?: {
    ok?: boolean;
    data?: unknown;
    needsConfirmation?: boolean;
    preview?: unknown;
    warning?: string;
    error?: string;
  } | null;
}

interface AgentResponseCardProps {
  onOpenChat: (seed: SeedMessage[], scrollId: string) => void;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

interface DerivedEntry {
  seed: SeedMessage[];
  scrollId: string;
  firstEvent: EventCardData | null;
  firstReminder: ReminderCardData | null;
  snippet: string;
}

function derive(entry: Entry): DerivedEntry {
  const r = entry.result;
  const userId = `vu-${entry.key}`;
  const agentId = `va-${entry.key}`;
  const events = (r.events as EventCardData[] | undefined) ?? [];
  const reminders = (r.reminders as ReminderCardData[] | undefined) ?? [];
  const toolCalls = (r.toolCalls as ToolCallLite[] | undefined) ?? [];
  return {
    seed: [
      { id: userId, role: "user", content: r.transcription },
      {
        id: agentId,
        role: "agent",
        content: r.reply,
        toolCalls,
        events,
        reminders,
      },
    ],
    scrollId: agentId,
    firstEvent: events[0] ?? null,
    firstReminder: !events[0] ? reminders[0] ?? null : null,
    snippet: truncate(r.reply, SNIPPET_MAX),
  };
}

export function AgentResponseCard({ onOpenChat }: AgentResponseCardProps) {
  const { result } = useVoice();
  const [entries, setEntries] = useState<Entry[]>([]);
  const keyRef = useRef(0);
  const lastResultRef = useRef<VoiceResult | null>(null);

  // New voice result → push onto stack, age previously-sticky entries.
  useEffect(() => {
    if (!result || result === lastResultRef.current) return;
    lastResultRef.current = result;
    keyRef.current += 1;
    const key = keyRef.current;
    setEntries((prev) => {
      const now = Date.now();
      const aged = prev.map((e) => ({
        ...e,
        dismissAt: e.dismissAt ?? now + DISMISS_MS,
      }));
      const next: Entry = { key, result, dismissAt: null };
      return [...aged, next].slice(-MAX_ENTRIES);
    });
  }, [result]);

  // Prune timed-out entries. Re-schedules whenever entries change.
  useEffect(() => {
    const scheduled = entries.filter((e) => e.dismissAt !== null);
    if (scheduled.length === 0) return;
    const next = Math.min(
      ...scheduled.map((e) => e.dismissAt as number),
    );
    const delay = Math.max(0, next - Date.now());
    const id = setTimeout(() => {
      setEntries((prev) =>
        prev.filter(
          (e) => e.dismissAt === null || e.dismissAt > Date.now(),
        ),
      );
    }, delay);
    return () => clearTimeout(id);
  }, [entries]);

  const pause = (key: number) => {
    setEntries((prev) =>
      prev.map((e) => (e.key === key ? { ...e, dismissAt: null } : e)),
    );
  };

  const resume = (key: number) => {
    setEntries((prev) =>
      prev.map((e) =>
        // Don't restart a timer on the sticky newest.
        e.key === key && e.key !== keyRef.current
          ? { ...e, dismissAt: Date.now() + DISMISS_MS }
          : e,
      ),
    );
  };

  const dismiss = (key: number) => {
    setEntries((prev) => prev.filter((e) => e.key !== key));
  };

  if (entries.length === 0) return null;

  return (
    <div className="agent-response-stack">
      {entries.map((entry) => {
        const { seed, scrollId, firstEvent, firstReminder, snippet } =
          derive(entry);
        const open = () => {
          dismiss(entry.key);
          onOpenChat(seed, scrollId);
        };
        return (
          <div
            key={entry.key}
            className="agent-response-card"
            role="status"
            aria-live="polite"
            onPointerEnter={() => pause(entry.key)}
            onPointerLeave={() => resume(entry.key)}
            onFocus={() => pause(entry.key)}
            onBlur={() => resume(entry.key)}
          >
            <div
              role="button"
              tabIndex={0}
              className="agent-response-card__body"
              onClick={open}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open();
                }
              }}
              aria-label="Open chat to see full response"
            >
              <div className="agent-response-card__snippet">{snippet}</div>
              {firstEvent && (
                <div
                  className="agent-response-card__card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EventCard event={firstEvent} />
                </div>
              )}
              {firstReminder && (
                <div
                  className="agent-response-card__card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ReminderCard reminder={firstReminder} />
                </div>
              )}
            </div>
            <button
              type="button"
              className="agent-response-card__close"
              onClick={() => dismiss(entry.key)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
