"use client";

import type { VoiceRecorderState } from "../hooks/useVoiceRecorder";

interface VoiceMicButtonProps {
  state: VoiceRecorderState;
  amplitude: number;
  timeLeft: number;
  onTap: () => void;
  className?: string;
  showLabel?: boolean;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceMicButton({
  state,
  amplitude,
  timeLeft,
  onTap,
  className,
  showLabel = true,
}: VoiceMicButtonProps) {
  const isRecording = state === "recording";
  const isProcessing = state === "processing";

  const glow = isRecording
    ? {
        boxShadow: `0 0 ${12 + amplitude * 32}px ${
          4 + amplitude * 14
        }px rgba(239, 68, 68, ${0.35 + amplitude * 0.45}), 4px 4px 0 rgba(15, 23, 42, 0.2)`,
      }
    : undefined;

  const buttonClasses = [
    "voice-mic__button",
    isRecording ? "voice-mic__button--recording" : "",
    isProcessing ? "voice-mic__button--processing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const ariaLabel = isRecording
    ? "Stop recording"
    : isProcessing
      ? "Processing audio"
      : "Start voice input";

  return (
    <div className={`voice-mic${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className={buttonClasses}
        onClick={onTap}
        disabled={isProcessing}
        style={glow}
        aria-label={ariaLabel}
        aria-pressed={isRecording}
      >
        <span
          className={`voice-mic__ring${
            isRecording ? " voice-mic__ring--active" : ""
          }`}
          aria-hidden="true"
        />
        {isProcessing ? (
          <span
            className="voice-mic__spinner"
            aria-hidden="true"
            role="status"
          />
        ) : isRecording ? (
          <span aria-hidden="true">■</span>
        ) : (
          <span aria-hidden="true">🎙</span>
        )}
      </button>

      {isRecording && (
        <div className="voice-mic__timer" aria-live="polite">
          {formatTime(timeLeft)}
        </div>
      )}

      {showLabel && state === "idle" && (
        <p className="voice-mic__label">Tap to speak</p>
      )}
      {showLabel && isRecording && (
        <p className="voice-mic__label">Listening… tap to stop</p>
      )}
      {showLabel && isProcessing && (
        <p className="voice-mic__label">Transcribing…</p>
      )}
      {state === "error" && (
        <p className="voice-mic__label voice-mic__label--error" role="alert">
          Couldn&rsquo;t process audio
        </p>
      )}
      {state === "permission-denied" && (
        <p className="voice-mic__label voice-mic__label--error" role="alert">
          Microphone access needed
        </p>
      )}
    </div>
  );
}
