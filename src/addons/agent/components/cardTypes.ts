// Wire-format types for tool-result cards. Mirrors Prisma models but with
// string dates (JSON-serialized) since cards run client-side.

export type EventTypeValue =
  | "SHOWING"
  | "CLOSING"
  | "INSPECTION"
  | "APPRAISAL"
  | "LAWYER"
  | "TITLE"
  | "MEETING"
  | "OPEN_HOUSE"
  | "DEADLINE"
  | "OTHER";

export type EventStatusValue = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export type ReminderStatusValue = "PENDING" | "SENT" | "DISMISSED";

export interface EventCardData {
  id: string;
  title: string;
  type: EventTypeValue;
  date: string;
  time: string;
  durationMinutes: number;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  status: EventStatusValue;
}

export interface ReminderCardData {
  id: string;
  message: string;
  remindAt: string;
  status: ReminderStatusValue;
  eventId: string | null;
}

export interface RouteStop {
  eventId: string;
  title: string;
  address: string | null;
  appointmentTime: string;
  travelMinutes: number;
  showingMinutes: number;
}

export interface RouteSummaryCardData {
  routeId: string;
  stops: RouteStop[];
  totalMinutes: number;
  totalDrivingMinutes: number;
  totalShowingMinutes: number;
  startTime: string;
  endTime: string;
}
