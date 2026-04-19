"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AgentMessage } from "./AgentMessage";

interface ToolCallLite {
  id: string;
  name: string;
  result?: { needsConfirmation?: boolean; preview?: unknown } | null;
}

interface ChatTurn {
  id: string;
  role: "user" | "agent";
  content: string;
  toolCalls?: ToolCallLite[];
  needsConfirmation?: boolean;
}

interface ChatApiResponse {
  reply?: string;
  toolCalls?: ToolCallLite[];
  error?: string;
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

const CONFIRM_MESSAGE = "Yes, please proceed.";

function hasNeedsConfirmation(calls: ToolCallLite[] | undefined): boolean {
  if (!calls) return false;
  return calls.some((c) => c.result?.needsConfirmation === true);
}

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const dragStartRef = useRef<number | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const sendMessage = useCallback(
    async (text: string, displayAsUser = true) => {
      setSending(true);
      setError(null);
      if (displayAsUser) {
        const userTurn: ChatTurn = {
          id: `u-${Date.now()}`,
          role: "user",
          content: text,
        };
        setMessages((m) => [...m, userTurn]);
      }
      try {
        const res = await fetch("/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => ({}))) as ChatApiResponse;
        if (!res.ok || data.error) {
          setError(data.error ?? `Request failed (${res.status})`);
          return;
        }
        const reply = data.reply ?? "";
        const calls = data.toolCalls ?? [];
        const agentTurn: ChatTurn = {
          id: `a-${Date.now()}`,
          role: "agent",
          content: reply,
          toolCalls: calls,
          needsConfirmation: hasNeedsConfirmation(calls),
        };
        setMessages((m) => {
          // Clear pending confirmation on any prior agent message so buttons only appear on latest.
          const cleared = m.map((t) =>
            t.role === "agent" && t.needsConfirmation
              ? { ...t, needsConfirmation: false }
              : t,
          );
          return [...cleared, agentTurn];
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSending(false);
      }
    },
    [],
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    void sendMessage(text);
  }, [input, sending, sendMessage]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirm = useCallback(() => {
    if (sending) return;
    void sendMessage(CONFIRM_MESSAGE);
  }, [sending, sendMessage]);

  const handleCancel = useCallback(() => {
    setMessages((m) =>
      m.map((t) =>
        t.role === "agent" && t.needsConfirmation
          ? { ...t, needsConfirmation: false }
          : t,
      ),
    );
  }, []);

  const handleHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartRef.current = e.clientY;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handleHandlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (start == null) return;
    const delta = e.clientY - start;
    if (delta > 60) onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="chat-panel-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="chat-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Agent chat"
      >
        <div
          className="chat-panel__handle"
          aria-label="Drag to close"
          role="button"
          tabIndex={0}
          onPointerDown={handleHandlePointerDown}
          onPointerUp={handleHandlePointerUp}
        />
        <div className="chat-panel__header">
          <h2 className="chat-panel__title">Agent</h2>
          <button
            type="button"
            className="chat-panel__close"
            onClick={onClose}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <div
          className="chat-panel__messages"
          ref={messagesRef}
          aria-live="polite"
        >
          {messages.length === 0 && !sending && (
            <div className="chat-panel__empty">
              Ask me to schedule a showing, set a reminder, or plan your day.
            </div>
          )}
          {messages.map((m) => (
            <AgentMessage
              key={m.id}
              role={m.role}
              content={m.content}
              toolCalls={m.toolCalls}
              pendingConfirm={m.needsConfirmation}
              sending={sending}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          ))}
          {sending && (
            <div
              className="agent-typing"
              aria-label="Agent is typing"
              role="status"
            >
              <span className="agent-typing__dot" />
              <span className="agent-typing__dot" />
              <span className="agent-typing__dot" />
            </div>
          )}
        </div>

        {error && (
          <div className="chat-panel__error" role="alert">
            {error}
          </div>
        )}

        <div className="chat-panel__composer">
          <textarea
            ref={inputRef}
            className="chat-panel__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            aria-label="Message"
          />
          <button
            type="button"
            className="chat-panel__send"
            onClick={handleSend}
            disabled={sending || input.trim().length === 0}
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </aside>
    </>
  );
}
