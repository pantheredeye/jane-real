"use client";

import { EventCard } from "./EventCard";
import { ReminderCard } from "./ReminderCard";
import { RouteSummaryCard } from "./RouteSummaryCard";
import type {
  EventCardData,
  ReminderCardData,
  RouteSummaryCardData,
} from "./cardTypes";

export type AgentMessageRole = "user" | "agent";

export interface ToolCallView {
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

export interface AgentMessageProps {
  role: AgentMessageRole;
  content: string;
  toolCalls?: ToolCallView[];
  events?: EventCardData[];
  reminders?: ReminderCardData[];
  pendingConfirm?: boolean;
  sending?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

function extractCards(toolCalls: ToolCallView[] | undefined): {
  previewEvents: EventCardData[];
  previewReminders: ReminderCardData[];
  routes: RouteSummaryCardData[];
} {
  const previewEvents: EventCardData[] = [];
  const previewReminders: ReminderCardData[] = [];
  const routes: RouteSummaryCardData[] = [];
  if (!toolCalls) return { previewEvents, previewReminders, routes };

  for (const call of toolCalls) {
    const result = call.result;
    if (!result) continue;

    if (result.needsConfirmation && result.preview) {
      const preview = result.preview as Record<string, unknown>;
      if (call.name === "createEvent" || call.name === "updateEvent") {
        const event = asEvent(preview);
        if (event) previewEvents.push(event);
      } else if (call.name === "createReminder") {
        const reminder = asReminder(preview);
        if (reminder) previewReminders.push(reminder);
      }
    }

    if (call.name === "optimizeDay" && result.ok && result.data) {
      const route = asRouteSummary(result.data);
      if (route) routes.push(route);
    }
  }
  return { previewEvents, previewReminders, routes };
}

function asEvent(raw: unknown): EventCardData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.title !== "string" ||
    typeof o.date !== "string" ||
    typeof o.time !== "string"
  ) {
    return null;
  }
  return {
    id: o.id,
    title: o.title,
    type: (o.type as EventCardData["type"]) ?? "OTHER",
    date: o.date,
    time: o.time,
    durationMinutes:
      typeof o.durationMinutes === "number" ? o.durationMinutes : 30,
    address: typeof o.address === "string" ? o.address : null,
    contactName: typeof o.contactName === "string" ? o.contactName : null,
    contactPhone: typeof o.contactPhone === "string" ? o.contactPhone : null,
    contactEmail: typeof o.contactEmail === "string" ? o.contactEmail : null,
    notes: typeof o.notes === "string" ? o.notes : null,
    status: (o.status as EventCardData["status"]) ?? "SCHEDULED",
  };
}

function asReminder(raw: unknown): ReminderCardData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.message !== "string") return null;
  const remindAt =
    typeof o.remindAt === "string"
      ? o.remindAt
      : o.remindAt instanceof Date
        ? o.remindAt.toISOString()
        : null;
  if (!remindAt) return null;
  return {
    id: o.id,
    message: o.message,
    remindAt,
    status: (o.status as ReminderCardData["status"]) ?? "PENDING",
    eventId: typeof o.eventId === "string" ? o.eventId : null,
  };
}

interface RouteStopRaw {
  propertyIndex?: number;
  appointmentTime?: string | Date;
  travelTime?: number;
  property?: { address?: string; showingDuration?: number };
}

function asRouteSummary(raw: unknown): RouteSummaryCardData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const routeId = data.routeId;
  const route = data.route as Record<string, unknown> | undefined;
  const events = data.events as Array<Record<string, unknown>> | undefined;
  if (typeof routeId !== "string" || !route || !Array.isArray(events)) {
    return null;
  }
  const items = route.items as RouteStopRaw[] | undefined;
  if (!Array.isArray(items)) return null;

  const stops = items.map((item, i): RouteSummaryCardData["stops"][number] => {
    const event = events[i] ?? {};
    const appt = item.appointmentTime;
    const apptIso =
      typeof appt === "string"
        ? appt
        : appt instanceof Date
          ? appt.toISOString()
          : "";
    return {
      eventId: typeof event.id === "string" ? event.id : `stop-${i}`,
      title:
        typeof event.title === "string"
          ? event.title
          : item.property?.address ?? `Stop ${i + 1}`,
      address: item.property?.address ?? null,
      appointmentTime: apptIso,
      travelMinutes:
        typeof item.travelTime === "number" ? item.travelTime : 0,
      showingMinutes:
        typeof item.property?.showingDuration === "number"
          ? item.property.showingDuration
          : 30,
    };
  });

  const totalMinutes =
    typeof route.totalTime === "number" ? route.totalTime : 0;
  const totalDrivingMinutes =
    typeof route.totalDrivingTime === "number" ? route.totalDrivingTime : 0;
  const totalShowingMinutes =
    typeof route.totalShowingTime === "number" ? route.totalShowingTime : 0;
  const startTime =
    typeof route.startTime === "string"
      ? route.startTime
      : route.startTime instanceof Date
        ? route.startTime.toISOString()
        : stops[0]?.appointmentTime ?? "";
  const endTime =
    typeof route.endTime === "string"
      ? route.endTime
      : route.endTime instanceof Date
        ? route.endTime.toISOString()
        : stops[stops.length - 1]?.appointmentTime ?? "";

  return {
    routeId,
    stops,
    totalMinutes,
    totalDrivingMinutes,
    totalShowingMinutes,
    startTime,
    endTime,
  };
}

export function AgentMessage({
  role,
  content,
  toolCalls,
  events,
  reminders,
  pendingConfirm,
  sending,
  onConfirm,
  onCancel,
}: AgentMessageProps) {
  const className = `agent-msg agent-msg--${role}`;
  const { previewEvents, previewReminders, routes } = extractCards(toolCalls);
  const hasCards =
    (events && events.length > 0) ||
    (reminders && reminders.length > 0) ||
    previewEvents.length > 0 ||
    previewReminders.length > 0 ||
    routes.length > 0;

  return (
    <div className={className}>
      <div className="agent-msg__bubble">{content}</div>

      {hasCards && (
        <div className="agent-msg__cards">
          {previewEvents.map((e) => (
            <EventCard key={`pe-${e.id}`} event={e} preview />
          ))}
          {previewReminders.map((r) => (
            <ReminderCard key={`pr-${r.id}`} reminder={r} preview />
          ))}
          {events?.map((e) => (
            <EventCard key={`e-${e.id}`} event={e} />
          ))}
          {reminders?.map((r) => (
            <ReminderCard key={`r-${r.id}`} reminder={r} />
          ))}
          {routes.map((r) => (
            <RouteSummaryCard key={`route-${r.routeId}`} route={r} />
          ))}
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
