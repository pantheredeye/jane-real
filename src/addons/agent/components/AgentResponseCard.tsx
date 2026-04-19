"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVoice } from "../contexts/VoiceContext";
import { EventCard } from "./EventCard";
import { ReminderCard } from "./ReminderCard";
import type {
  EventCardData,
  ReminderCardData,
} from "./cardTypes";
import type { SeedMessage } from "./ChatPanel";

const AUTO_DISMISS_MS = 3000;
const SNIPPET_MAX = 140;

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

export function AgentResponseCard({ onOpenChat }: AgentResponseCardProps) {
  const { result } = useVoice();
  const [visible, setVisible] = useState(false);
  const [resultKey, setResultKey] = useState(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResultRef = useRef(result);

  // Show card when a new result arrives; schedule auto-dismiss
  useEffect(() => {
    if (!result || result === lastResultRef.current) return;
    lastResultRef.current = result;
    setResultKey((k) => k + 1);
    setVisible(true);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, AUTO_DISMISS_MS);
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [result]);

  const cancelAutoDismiss = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  const { seed, scrollId, firstEvent, firstReminder, snippet } =
    useMemo(() => {
      if (!result) {
        return {
          seed: [] as SeedMessage[],
          scrollId: "",
          firstEvent: null as EventCardData | null,
          firstReminder: null as ReminderCardData | null,
          snippet: "",
        };
      }
      const userId = `vu-${resultKey}`;
      const agentId = `va-${resultKey}`;
      const events = (result.events as EventCardData[] | undefined) ?? [];
      const reminders = (result.reminders as ReminderCardData[] | undefined) ?? [];
      const toolCalls = (result.toolCalls as ToolCallLite[] | undefined) ?? [];
      const seedMessages: SeedMessage[] = [
        { id: userId, role: "user", content: result.transcription },
        {
          id: agentId,
          role: "agent",
          content: result.reply,
          toolCalls,
          events,
          reminders,
        },
      ];
      return {
        seed: seedMessages,
        scrollId: agentId,
        firstEvent: events[0] ?? null,
        firstReminder: !events[0] ? reminders[0] ?? null : null,
        snippet: truncate(result.reply, SNIPPET_MAX),
      };
    }, [result, resultKey]);

  if (!result || !visible) return null;

  return (
    <div
      className="agent-response-card"
      role="status"
      aria-live="polite"
      onPointerEnter={cancelAutoDismiss}
      onFocus={cancelAutoDismiss}
    >
      <div
        role="button"
        tabIndex={0}
        className="agent-response-card__body"
        onClick={() => {
          cancelAutoDismiss();
          setVisible(false);
          onOpenChat(seed, scrollId);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cancelAutoDismiss();
            setVisible(false);
            onOpenChat(seed, scrollId);
          }
        }}
        aria-label="Open chat to see full response"
      >
        <div className="agent-response-card__snippet">{snippet}</div>
        {firstEvent && (
          <div className="agent-response-card__card" onClick={(e) => e.stopPropagation()}>
            <EventCard event={firstEvent} />
          </div>
        )}
        {firstReminder && (
          <div className="agent-response-card__card" onClick={(e) => e.stopPropagation()}>
            <ReminderCard reminder={firstReminder} />
          </div>
        )}
      </div>
      <button
        type="button"
        className="agent-response-card__close"
        onClick={() => {
          cancelAutoDismiss();
          setVisible(false);
        }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
