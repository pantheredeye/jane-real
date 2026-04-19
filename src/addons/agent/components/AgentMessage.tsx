"use client";

export type AgentMessageRole = "user" | "agent";

export interface AgentMessageProps {
  role: AgentMessageRole;
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    result?: { needsConfirmation?: boolean; preview?: unknown } | null;
  }>;
  pendingConfirm?: boolean;
  sending?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function AgentMessage({
  role,
  content,
  toolCalls,
  pendingConfirm,
  sending,
  onConfirm,
  onCancel,
}: AgentMessageProps) {
  const className = `agent-msg agent-msg--${role}`;
  return (
    <div className={className}>
      <div className="agent-msg__bubble">{content}</div>

      {toolCalls && toolCalls.length > 0 && (
        <div className="agent-msg__cards" aria-hidden="true">
          {/* Placeholder: EventCard/ReminderCard/RouteSummaryCard render here in a later bead. */}
        </div>
      )}

      {pendingConfirm && role === "agent" && (
        <div className="agent-msg__confirm" role="group" aria-label="Confirm action">
          <button
            type="button"
            className="agent-msg__confirm-btn agent-msg__confirm-btn--primary"
            onClick={onConfirm}
            disabled={sending}
          >
            Confirm
          </button>
          <button
            type="button"
            className="agent-msg__confirm-btn agent-msg__confirm-btn--secondary"
            onClick={onCancel}
            disabled={sending}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
