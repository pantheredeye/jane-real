"use client";

import { type ReactNode } from "react";
import { DockProvider } from "../addons/agent/contexts/DockProvider";
import { VoiceProvider } from "../addons/agent/contexts/VoiceContext";
import { AgentDock } from "../addons/agent/components/AgentDock";

export function ChatShell({
  children,
  showChat,
}: {
  children: ReactNode;
  showChat: boolean;
}) {
  return (
    <DockProvider>
      <VoiceProvider>
        {children}
        {showChat && <AgentDock />}
      </VoiceProvider>
    </DockProvider>
  );
}
