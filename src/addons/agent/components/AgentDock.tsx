"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useVoice, type VoiceResult } from "../contexts/VoiceContext";
import { useBadge } from "../hooks/useBadge";
import { ChatPanel, type SeedMessage } from "./ChatPanel";
import { EventCard } from "./EventCard";
import { ReminderCard } from "./ReminderCard";
import type { EventCardData, ReminderCardData } from "./cardTypes";
import {
  EVT_STATE_CHANGED,
  getState,
  requestState,
  type AgentIntegration,
  type PrimaryAction,
  type SecondaryAction,
} from "../dock-bridge";
import type { PropertyInput } from "../../route-calculator/types";
import { Menu } from "../../../app/components/ui/Menu";

const RECENT_MAX = 2;
const RECENT_SHEET_MAX = 4;
const SNIPPET_MAX = 240;
const STARTER_CHIPS = [
  "Add property",
  "What's my day?",
  "Cancel my 2pm",
  "Schedule showing",
  "Set reminder",
];

type DockMode = "collapsed" | "composer" | "history";

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

type Turn =
  | {
      kind: "chat";
      id: string;
      role: "user" | "agent";
      content: string;
      toolCalls?: ToolCallLite[];
      events?: EventCardData[];
      reminders?: ReminderCardData[];
    }
  | {
      kind: "property";
      id: string;
      parsedAddress: string;
      thumbnailUrl?: string;
    }
  | {
      kind: "typing";
      id: string;
    };

interface ChatApiResponse {
  reply?: string;
  toolCalls?: ToolCallLite[];
  events?: EventCardData[];
  reminders?: ReminderCardData[];
  properties?: PropertyInput[];
  error?: string;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AgentDock() {
  const voice = useVoice();
  const { events, reminders } = useBadge();
  const badgeTotal = events + reminders;

  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<DockMode>("collapsed");
  const [seedForHistory, setSeedForHistory] = useState<
    SeedMessage[] | undefined
  >(undefined);
  const [scrollTargetId, setScrollTargetId] = useState<string | undefined>(
    undefined,
  );

  const [primary, setPrimary] = useState<PrimaryAction | null>(null);
  const [secondary, setSecondary] = useState<SecondaryAction[]>([]);
  const [integration, setIntegration] = useState<AgentIntegration>({});

  const [isMobile, setIsMobile] = useState(false);
  const [chips, setChips] = useState<string[]>([]);
  const [chipsLoaded, setChipsLoaded] = useState(false);
  const [kbInset, setKbInset] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const sheetInputRef = useRef<HTMLTextAreaElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<number | null>(null);
  const lastVoiceResultRef = useRef<VoiceResult | null>(null);
  const idCounter = useRef(0);
  const integrationRef = useRef<AgentIntegration>({});
  integrationRef.current = integration;

  const nextId = () => `t${++idCounter.current}-${Date.now()}`;

  const isRecording = voice.state === "recording";
  const isProcessing = voice.state === "processing";

  // Publish collapsed-row height so pages reserve bottom padding.
  // We observe the row wrapper (not the outer dock) so opening the composer
  // sheet doesn't shift route-calc page padding.
  useEffect(() => {
    const el = rowRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const padding = 16;
      document.documentElement.style.setProperty(
        "--agent-dock-h",
        `${Math.round(entry.contentRect.height + padding)}px`,
      );
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--agent-dock-h");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const sync = () => {
      const s = getState();
      setPrimary(s.primary);
      setSecondary([...s.secondary]);
      setIntegration({ ...s.integration });
    };
    sync();
    window.addEventListener(EVT_STATE_CHANGED, sync);
    requestState();
    return () => window.removeEventListener(EVT_STATE_CHANGED, sync);
  }, []);

  // VisualViewport-driven keyboard inset — only while composer open on mobile
  useEffect(() => {
    if (!isMobile || mode !== "composer") {
      setKbInset(0);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      setKbInset(
        Math.max(0, window.innerHeight - vv.height - vv.offsetTop),
      );
    };
    onResize();
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
      setKbInset(0);
    };
  }, [isMobile, mode]);

  const fetchChips = useCallback(async () => {
    try {
      const res = await fetch("/agent/recent-prompts", {
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as {
        prompts?: string[];
      };
      const fetched = Array.isArray(data.prompts) ? data.prompts : [];
      setChips(fetched.length > 0 ? fetched : STARTER_CHIPS);
    } catch {
      setChips(STARTER_CHIPS);
    } finally {
      setChipsLoaded(true);
    }
  }, []);

  // Forward agent-emitted properties to the page, and render a confirmation
  // turn in the thread. Called from both chat and voice response envelopes.
  const consumeProperties = useCallback(
    (properties: PropertyInput[] | undefined) => {
      if (!properties || properties.length === 0) return;
      const handler = integrationRef.current.onAgentPropertyAdded;
      const newTurns: Turn[] = [];
      for (const p of properties) {
        handler?.(p);
        newTurns.push({
          kind: "property",
          id: nextId(),
          parsedAddress: p.parsedAddress,
          thumbnailUrl: p.thumbnailUrl,
        });
      }
      setTurns((t) => [...t, ...newTurns]);
    },
    [],
  );

  useEffect(() => {
    const r = voice.result;
    if (!r || r === lastVoiceResultRef.current) return;
    lastVoiceResultRef.current = r;
    setTurns((prev) => [
      ...prev,
      { kind: "chat", id: nextId(), role: "user", content: r.transcription },
      {
        kind: "chat",
        id: nextId(),
        role: "agent",
        content: r.reply,
        toolCalls: r.toolCalls as ToolCallLite[] | undefined,
        events: r.events as EventCardData[] | undefined,
        reminders: r.reminders as ReminderCardData[] | undefined,
      },
    ]);
    consumeProperties(
      (r as { properties?: PropertyInput[] }).properties,
    );
  }, [voice.result, consumeProperties]);

  const closeComposer = useCallback(() => {
    setMode("collapsed");
  }, []);

  const openComposer = useCallback(() => {
    setMode("composer");
    if (!chipsLoaded) void fetchChips();
    requestAnimationFrame(() => {
      sheetInputRef.current?.focus();
    });
  }, [chipsLoaded, fetchChips]);

  const toggleRecording = useCallback(async () => {
    if (isProcessing) return;
    if (mode === "composer") setMode("collapsed");
    if (isRecording) voice.stopRecording();
    else await voice.startRecording();
  }, [isRecording, isProcessing, voice, mode]);

  const sendChat = useCallback(
    async (text: string) => {
      const userId = nextId();
      const typingId = nextId();
      setTurns((t) => [
        ...t,
        { kind: "chat", id: userId, role: "user", content: text },
        { kind: "typing", id: typingId },
      ]);
      try {
        const res = await fetch("/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => ({}))) as ChatApiResponse;
        if (!res.ok || data.error) {
          setTurns((t) => t.filter((x) => x.id !== typingId));
          setError(data.error ?? `Request failed (${res.status})`);
          return;
        }
        setTurns((t) => [
          ...t.filter((x) => x.id !== typingId),
          {
            kind: "chat",
            id: nextId(),
            role: "agent",
            content: data.reply ?? "",
            toolCalls: data.toolCalls,
            events: data.events,
            reminders: data.reminders,
          },
        ]);
        consumeProperties(data.properties);
        void fetchChips();
      } catch (err) {
        setTurns((t) => t.filter((x) => x.id !== typingId));
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [consumeProperties, fetchChips],
  );

  const submit = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setError(null);
    try {
      await sendChat(text);
    } finally {
      setSending(false);
    }
  }, [input, sending, sendChat]);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void submit();
      }
    },
    [submit],
  );

  const openHistoryFromTurn = useCallback(() => {
    const seed: SeedMessage[] = turns
      .filter((t): t is Extract<Turn, { kind: "chat" }> => t.kind === "chat")
      .map((t) => ({
        id: t.id,
        role: t.role,
        content: t.content,
        toolCalls: t.toolCalls,
        events: t.events,
        reminders: t.reminders,
      }));
    setSeedForHistory(seed);
    setScrollTargetId(seed[seed.length - 1]?.id);
    setMode("history");
  }, [turns]);

  const expandToHistory = openHistoryFromTurn;

  // ESC closes composer
  useEffect(() => {
    if (mode !== "composer") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeComposer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, closeComposer]);

  const onChipClick = useCallback((chip: string) => {
    setInput((v) => (v.trim().length > 0 ? `${v.trim()} ${chip}` : chip));
    requestAnimationFrame(() => {
      sheetInputRef.current?.focus();
    });
  }, []);

  const onHandlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      dragStartRef.current = e.clientY;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const onHandlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const start = dragStartRef.current;
      dragStartRef.current = null;
      if (start == null) return;
      const delta = e.clientY - start;
      if (delta > 50) closeComposer();
      else if (delta < -50) expandToHistory();
    },
    [closeComposer, expandToHistory],
  );

  const recent = useMemo(() => turns.slice(-RECENT_MAX), [turns]);
  const recentSheet = useMemo(
    () => turns.slice(-RECENT_SHEET_MAX),
    [turns],
  );
  const earlierCount = turns.length - recent.length;

  const micGlow = useMemo(() => {
    if (!isRecording) return undefined;
    return {
      boxShadow: `0 0 ${12 + voice.amplitude * 32}px ${
        4 + voice.amplitude * 14
      }px rgba(239, 68, 68, ${0.35 + voice.amplitude * 0.45}), 4px 4px 0 rgba(15,23,42,0.22)`,
    };
  }, [isRecording, voice.amplitude]);

  const micAriaLabel = isRecording
    ? "Stop recording"
    : isProcessing
      ? "Processing audio"
      : badgeTotal > 0
        ? `Voice input (${badgeTotal} pending)`
        : "Voice input";

  const micClasses = [
    "agent-dock__mic",
    isRecording ? "agent-dock__mic--recording" : "",
    isProcessing ? "agent-dock__mic--processing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const renderTurn = (t: Turn, clickable: boolean) => {
    if (t.kind === "typing") {
      return (
        <div
          key={t.id}
          className="agent-dock__turn agent-dock__turn--agent agent-dock__turn--typing"
          aria-label="Agent typing"
        >
          <span className="agent-dock__typing-dot" />
          <span className="agent-dock__typing-dot" />
          <span className="agent-dock__typing-dot" />
        </div>
      );
    }
    if (t.kind === "property") {
      return (
        <div
          key={t.id}
          className="agent-dock__turn agent-dock__turn--property"
          aria-label={`Agent added property ${t.parsedAddress}`}
        >
          <span className="agent-dock__turn-property-tag">✓ ADDED</span>
          {t.thumbnailUrl && (
            <img
              src={t.thumbnailUrl}
              alt=""
              className="agent-dock__turn-property-thumb"
            />
          )}
          <span className="agent-dock__turn-snippet">
            {truncate(t.parsedAddress, 80)}
          </span>
          <button
            type="button"
            className="agent-dock__turn-property-open"
            onClick={() => {
              const el = document.querySelector(".inline-list-section");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            OPEN ↗
          </button>
        </div>
      );
    }
    if (clickable) {
      return (
        <button
          type="button"
          key={t.id}
          className={`agent-dock__turn agent-dock__turn--${t.role}`}
          onClick={expandToHistory}
          aria-label={`Open chat — ${t.role} message`}
        >
          <span className="agent-dock__turn-snippet">
            {truncate(t.content, SNIPPET_MAX)}
          </span>
          {t.events && t.events[0] && (
            <span
              className="agent-dock__turn-card"
              onClick={(e) => e.stopPropagation()}
            >
              <EventCard event={t.events[0]} />
            </span>
          )}
          {(!t.events || !t.events[0]) &&
            t.reminders &&
            t.reminders[0] && (
              <span
                className="agent-dock__turn-card"
                onClick={(e) => e.stopPropagation()}
              >
                <ReminderCard reminder={t.reminders[0]} />
              </span>
            )}
        </button>
      );
    }
    return (
      <div
        key={t.id}
        className={`agent-dock__turn agent-dock__turn--${t.role}`}
      >
        <span className="agent-dock__turn-snippet">
          {truncate(t.content, SNIPPET_MAX)}
        </span>
        {t.events && t.events[0] && (
          <span className="agent-dock__turn-card">
            <EventCard event={t.events[0]} />
          </span>
        )}
        {(!t.events || !t.events[0]) && t.reminders && t.reminders[0] && (
          <span className="agent-dock__turn-card">
            <ReminderCard reminder={t.reminders[0]} />
          </span>
        )}
      </div>
    );
  };

  const dockStyle: CSSProperties = {
    ["--agent-kb-inset" as string]: `${kbInset}px`,
  };

  const composerOpen = isMobile && mode === "composer";
  const showInlineInput = !isMobile;

  return (
    <>
      <div
        ref={dockRef}
        className={`agent-dock${isRecording ? " agent-dock--recording" : ""}`}
        data-state={mode}
        data-mobile={isMobile ? "true" : "false"}
        style={dockStyle}
        role="region"
        aria-label="Agent dock"
      >
        {!isMobile && (recent.length > 0 || earlierCount > 0) && (
          <div className="agent-dock__strip" aria-live="polite">
            {earlierCount > 0 && (
              <button
                type="button"
                className="agent-dock__strip-expand"
                onClick={expandToHistory}
                aria-label="Open full chat history"
              >
                ↑ {earlierCount} earlier
              </button>
            )}
            {recent.map((t) => renderTurn(t, true))}
          </div>
        )}

        {composerOpen && (
          <div
            className="agent-dock__sheet"
            role="dialog"
            aria-label="Compose message"
          >
            <div
              className="agent-dock__sheet-handle"
              role="button"
              tabIndex={0}
              aria-label="Drag up for full chat, down to close"
              onPointerDown={onHandlePointerDown}
              onPointerUp={onHandlePointerUp}
            />
            <div className="agent-dock__chips" aria-label="Quick prompts">
              {(chips.length > 0 ? chips : STARTER_CHIPS).map((chip, i) => (
                <button
                  type="button"
                  key={`${chip}-${i}`}
                  className="agent-dock__chip"
                  onClick={() => onChipClick(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
            {recentSheet.length > 0 && (
              <div className="agent-dock__recent" aria-live="polite">
                {recentSheet.map((t) => renderTurn(t, false))}
              </div>
            )}
            <div className="agent-dock__composer">
              <textarea
                ref={sheetInputRef}
                className="agent-dock__composer-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the agent…"
                rows={3}
                aria-label="Message agent"
                disabled={isProcessing}
              />
              <button
                type="button"
                className="agent-dock__composer-send"
                onClick={() => void submit()}
                disabled={
                  sending || input.trim().length === 0 || isRecording
                }
                aria-label="Send message"
              >
                ▶
              </button>
            </div>
            <div className="agent-dock__kb-spacer" aria-hidden="true" />
          </div>
        )}

        {error && (
          <div className="agent-dock__error" role="alert">
            {error}
            <button
              type="button"
              className="agent-dock__error-dismiss"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        <div className="agent-dock__row" ref={rowRef}>
          <button
            type="button"
            className={micClasses}
            onClick={() => void toggleRecording()}
            disabled={isProcessing}
            style={micGlow}
            aria-label={micAriaLabel}
            aria-pressed={isRecording}
          >
            <span
              className={`agent-dock__mic-ring${
                isRecording ? " agent-dock__mic-ring--active" : ""
              }`}
              aria-hidden="true"
            />
            {isProcessing ? (
              <span className="agent-dock__mic-spinner" aria-hidden="true" />
            ) : isRecording ? (
              <span aria-hidden="true">■</span>
            ) : (
              <span aria-hidden="true">🎙</span>
            )}
            {isRecording && (
              <span className="agent-dock__mic-timer" aria-live="polite">
                {formatTime(voice.timeLeft)}
              </span>
            )}
            {!isRecording && !isProcessing && badgeTotal > 0 && (
              <span className="agent-dock__mic-badge" aria-hidden="true">
                {badgeTotal > 99 ? "99+" : badgeTotal}
              </span>
            )}
          </button>

          {isMobile && !isRecording && (
            <button
              type="button"
              className={`agent-dock__chat-btn${
                mode === "composer" ? " agent-dock__chat-btn--active" : ""
              }`}
              onClick={() =>
                mode === "composer" ? closeComposer() : openComposer()
              }
              aria-label={mode === "composer" ? "Close chat" : "Open chat"}
              aria-expanded={mode === "composer"}
            >
              <span aria-hidden="true">💬</span>
            </button>
          )}

          {isRecording ? (
            <div
              className="agent-dock__recording"
              role="status"
              aria-label="Recording in progress"
            >
              <span className="agent-dock__recording-label">Listening…</span>
              <span className="agent-dock__recording-time">
                {formatTime(voice.timeLeft)}
              </span>
            </div>
          ) : (
            showInlineInput && (
              <textarea
                ref={inputRef}
                className="agent-dock__input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the agent…"
                rows={1}
                aria-label="Message agent"
                disabled={isProcessing}
              />
            )
          )}

          {showInlineInput && (
            <button
              type="button"
              className="agent-dock__send"
              onClick={() => void submit()}
              disabled={
                sending || input.trim().length === 0 || isRecording
              }
              aria-label="Send message"
            >
              ▶
            </button>
          )}

          {primary && (
            <button
              type="button"
              className={`agent-dock__primary${
                primary.success ? " agent-dock__primary--success" : ""
              }`}
              onClick={primary.onAction}
              disabled={primary.disabled}
            >
              {primary.label}
            </button>
          )}

          {secondary.length > 0 && (
            <Menu.Root>
              <Menu.Trigger
                className="agent-dock__more"
                aria-label="More actions"
              >
                ⋯
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner side="top" align="end" sideOffset={8}>
                  <Menu.Popup className="agent-dock__menu">
                    {secondary.map((a) => (
                      <Menu.Item
                        key={a.id}
                        className="agent-dock__menu-item"
                        disabled={a.disabled}
                        onClick={a.onAction}
                      >
                        {a.label}
                      </Menu.Item>
                    ))}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          )}
        </div>
      </div>

      <ChatPanel
        open={mode === "history"}
        onClose={() => setMode("collapsed")}
        seedMessages={seedForHistory}
        scrollToMessageId={scrollTargetId}
      />
    </>
  );
}
