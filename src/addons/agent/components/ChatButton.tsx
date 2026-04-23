"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useBadge } from "../hooks/useBadge";
import { useVoice } from "../contexts/VoiceContext";
import { AgentResponseCard } from "./AgentResponseCard";
import { ChatPanel, type SeedMessage } from "./ChatPanel";

const LONG_PRESS_MS = 500;
const SWIPE_UP_THRESHOLD = 40;
const MOVE_CANCEL_THRESHOLD = 12;

function vibrate(ms: number) {
  if (typeof navigator === "undefined") return;
  const v = (navigator as Navigator & { vibrate?: (p: number) => boolean })
    .vibrate;
  if (typeof v === "function") v.call(navigator, ms);
}

export function ChatButton() {
  const [open, setOpen] = useState(false);
  const [seedMessages, setSeedMessages] = useState<SeedMessage[] | undefined>(
    undefined,
  );
  const [scrollTargetId, setScrollTargetId] = useState<string | undefined>(
    undefined,
  );
  const { events, reminders } = useBadge();
  const total = events + reminders;

  const voice = useVoice();
  const { state, amplitude, timeLeft, startRecording, stopRecording } = voice;

  const isRecording = state === "recording";
  const isProcessing = state === "processing";

  // Long-press + swipe-up gesture state
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const gestureHandledRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const openPanel = useCallback((seed?: SeedMessage[], scrollId?: string) => {
    setSeedMessages(seed);
    setScrollTargetId(scrollId);
    setOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
  }, []);

  const toggleRecording = useCallback(async () => {
    if (isProcessing) return;
    if (isRecording) {
      vibrate(50);
      stopRecording();
    } else {
      vibrate(50);
      await startRecording();
    }
  }, [isRecording, isProcessing, startRecording, stopRecording]);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (isProcessing) return;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      gestureHandledRef.current = false;
      (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
      clearLongPress();
      longPressTimerRef.current = setTimeout(() => {
        gestureHandledRef.current = true;
        longPressTimerRef.current = null;
        // Don't open the panel if we're mid-recording; cancel recording first
        if (isRecording) {
          // Long-press during recording: open panel without stopping
          // (keep behaviour simple — just open)
        }
        openPanel();
      }, LONG_PRESS_MS);
    },
    [clearLongPress, isProcessing, isRecording, openPanel],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const start = pointerStartRef.current;
      if (!start) return;
      const dy = e.clientY - start.y;
      const dx = e.clientX - start.x;
      // Swipe up → open panel
      if (dy < -SWIPE_UP_THRESHOLD && !gestureHandledRef.current) {
        gestureHandledRef.current = true;
        clearLongPress();
        openPanel();
        return;
      }
      // Any meaningful movement cancels the long-press timer
      if (Math.abs(dx) > MOVE_CANCEL_THRESHOLD || Math.abs(dy) > MOVE_CANCEL_THRESHOLD) {
        clearLongPress();
      }
    },
    [clearLongPress, openPanel],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      clearLongPress();
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (gestureHandledRef.current) {
        gestureHandledRef.current = false;
        return;
      }
      if (!start) return;
      const dy = e.clientY - start.y;
      const dx = e.clientX - start.x;
      if (Math.abs(dy) > MOVE_CANCEL_THRESHOLD || Math.abs(dx) > MOVE_CANCEL_THRESHOLD) {
        return;
      }
      void toggleRecording();
    },
    [clearLongPress, toggleRecording],
  );

  const handlePointerCancel = useCallback(() => {
    clearLongPress();
    pointerStartRef.current = null;
    gestureHandledRef.current = false;
  }, [clearLongPress]);

  useEffect(() => () => clearLongPress(), [clearLongPress]);

  // Recording visual: amplitude-driven glow
  const recordingGlow = useMemo(() => {
    if (!isRecording) return undefined;
    return {
      boxShadow: `0 0 ${12 + amplitude * 32}px ${
        4 + amplitude * 14
      }px rgba(239, 68, 68, ${0.35 + amplitude * 0.45}), 4px 4px 0 rgba(15, 23, 42, 0.22)`,
    };
  }, [isRecording, amplitude]);

  const ariaLabel = isRecording
    ? "Stop recording"
    : isProcessing
      ? "Processing audio"
      : total > 0
        ? `Voice input (${total} pending). Long-press or swipe up for chat.`
        : "Voice input. Long-press or swipe up for chat.";

  const buttonClasses = [
    "chat-fab",
    isRecording ? "chat-fab--recording" : "",
    isProcessing ? "chat-fab--processing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleCardTap = useCallback(
    (seed: SeedMessage[], scrollId: string) => {
      openPanel(seed, scrollId);
    },
    [openPanel],
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <AgentResponseCard onOpenChat={handleCardTap} />
      <button
        type="button"
        className={buttonClasses}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        disabled={isProcessing}
        style={recordingGlow}
        aria-label={ariaLabel}
        aria-pressed={isRecording}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span
          className={`chat-fab__ring${isRecording ? " chat-fab__ring--active" : ""}`}
          aria-hidden="true"
        />
        {isProcessing ? (
          <span className="chat-fab__spinner" aria-hidden="true" role="status" />
        ) : isRecording ? (
          <span aria-hidden="true">■</span>
        ) : (
          <span aria-hidden="true">🎙</span>
        )}
        {isRecording && (
          <span className="chat-fab__timer" aria-live="polite">
            {formatTime(timeLeft)}
          </span>
        )}
        {!isRecording && !isProcessing && total > 0 && (
          <span className="chat-fab__badge" aria-hidden="true">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      <ChatPanel
        open={open}
        onClose={closePanel}
        seedMessages={seedMessages}
        scrollToMessageId={scrollTargetId}
      />
    </>
  );
}
