"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  useVoiceRecorder,
  type VoiceRecorderState,
} from "../hooks/useVoiceRecorder";

export interface VoiceResult {
  transcription: string;
  reply: string;
  toolCalls?: unknown[];
  events?: unknown[];
  reminders?: unknown[];
}

export interface VoiceContextValue {
  state: VoiceRecorderState;
  amplitude: number;
  timeLeft: number;
  error: string | null;
  result: VoiceResult | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  reset: () => void;
  retry: () => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

interface VoiceProviderProps {
  children: ReactNode;
  endpoint?: string;
  maxDuration?: number;
  onResult?: (result: VoiceResult) => void;
  onError?: (message: string) => void;
}

export function VoiceProvider({
  children,
  endpoint = "/agent/voice",
  maxDuration = 120,
  onResult,
  onError,
}: VoiceProviderProps) {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceResult | null>(null);

  const handleAudio = useCallback(
    async (blob: Blob) => {
      setError(null);
      try {
        const buffer = await blob.arrayBuffer();
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": blob.type || "application/octet-stream",
          },
          body: buffer,
          credentials: "same-origin",
        });

        const data = (await res
          .json()
          .catch(() => ({}))) as Partial<VoiceResult> & { error?: string };

        if (!res.ok || data.error) {
          const msg = data.error ?? `Voice request failed (${res.status})`;
          setError(msg);
          onError?.(msg);
          recorder.setState("error");
          return;
        }

        if (
          typeof data.transcription !== "string" ||
          typeof data.reply !== "string"
        ) {
          const msg = "Invalid response from voice endpoint";
          setError(msg);
          onError?.(msg);
          recorder.setState("error");
          return;
        }

        const payload: VoiceResult = {
          transcription: data.transcription,
          reply: data.reply,
          toolCalls: data.toolCalls,
          events: data.events,
          reminders: data.reminders,
        };
        setResult(payload);
        recorder.setState("done");
        onResult?.(payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        onError?.(msg);
        recorder.setState("error");
      }
    },
    // recorder.setState is referenced below — stable ref from useVoiceRecorder
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, onResult, onError],
  );

  const recorder = useVoiceRecorder({
    maxDuration,
    onAudioReady: handleAudio,
  });

  const startRecording = useCallback(async () => {
    setError(null);
    setResult(null);
    await recorder.startRecording();
  }, [recorder]);

  const retry = useCallback(() => {
    setError(null);
    recorder.retryUpload();
  }, [recorder]);

  const value = useMemo<VoiceContextValue>(
    () => ({
      state: recorder.state,
      amplitude: recorder.amplitude,
      timeLeft: recorder.timeLeft,
      error,
      result,
      startRecording,
      stopRecording: recorder.stopRecording,
      cancelRecording: recorder.cancelRecording,
      reset: recorder.reset,
      retry,
    }),
    [
      recorder.state,
      recorder.amplitude,
      recorder.timeLeft,
      recorder.stopRecording,
      recorder.cancelRecording,
      recorder.reset,
      error,
      result,
      startRecording,
      retry,
    ],
  );

  return (
    <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
  );
}

export function useVoice(): VoiceContextValue {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    throw new Error("useVoice must be used within a <VoiceProvider>");
  }
  return ctx;
}

export function useOptionalVoice(): VoiceContextValue | null {
  return useContext(VoiceContext);
}
