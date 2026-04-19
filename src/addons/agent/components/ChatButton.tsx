"use client";

import { useState } from "react";
import { useBadge } from "../hooks/useBadge";
import { ChatPanel } from "./ChatPanel";

export function ChatButton() {
  const [open, setOpen] = useState(false);
  const { events, reminders } = useBadge();
  const total = events + reminders;

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen(true)}
        aria-label={
          total > 0
            ? `Open agent chat (${total} pending)`
            : "Open agent chat"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span aria-hidden="true">💬</span>
        {total > 0 && (
          <span className="chat-fab__badge" aria-hidden="true">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      <ChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
