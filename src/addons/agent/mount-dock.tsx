import { createRoot } from "react-dom/client";
import { AgentDock } from "./components/AgentDock";
import { VoiceProvider } from "./contexts/VoiceContext";

const mount = document.getElementById("agent-dock-root");
if (mount) {
  createRoot(mount).render(
    <VoiceProvider>
      <AgentDock />
    </VoiceProvider>,
  );
}
