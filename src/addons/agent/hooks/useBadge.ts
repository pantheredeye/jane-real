"use client";

import { useEffect, useState } from "react";

export interface BadgeCounts {
  events: number;
  reminders: number;
}

interface BadgeApi {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
}

const DEFAULT: BadgeCounts = { events: 0, reminders: 0 };
const POLL_MS = 300_000;

// Polls /agent/badge, returns current counts, and mirrors total to the PWA
// icon via navigator.setAppBadge when supported.
export function useBadge(): BadgeCounts {
  const [counts, setCounts] = useState<BadgeCounts>(DEFAULT);

  useEffect(() => {
    let cancelled = false;

    async function poll(): Promise<void> {
      try {
        const res = await fetch("/agent/badge", {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<BadgeCounts>;
        if (cancelled) return;
        const next: BadgeCounts = {
          events: typeof data.events === "number" ? data.events : 0,
          reminders: typeof data.reminders === "number" ? data.reminders : 0,
        };
        setCounts(next);

        const nav = navigator as unknown as BadgeApi;
        const total = next.events + next.reminders;
        if (total > 0) {
          await nav.setAppBadge?.(total);
        } else {
          await nav.clearAppBadge?.();
        }
      } catch {
        // Network errors silently retry on next tick.
      }
    }

    void poll();
    const id = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return counts;
}
