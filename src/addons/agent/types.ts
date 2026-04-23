import { z } from "zod";
import type { PrismaClient } from "@generated/prisma";
import type { UserPreferences } from "./server-functions/preferences";

export interface AgentContext {
  db: PrismaClient;
  userId: string;
  tenantId: string;
  userPreferences: UserPreferences;
  env: Env;
}

export interface ToolResult<T = unknown> {
  ok: boolean;
  data?: T;
  needsConfirmation?: boolean;
  preview?: unknown;
  warning?: string;
  error?: string;
}

const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:MM");

export const EventTypeSchema = z.enum([
  "SHOWING",
  "CLOSING",
  "INSPECTION",
  "APPRAISAL",
  "LAWYER",
  "TITLE",
  "MEETING",
  "OPEN_HOUSE",
  "DEADLINE",
  "OTHER",
]);
export type EventTypeValue = z.infer<typeof EventTypeSchema>;

export const EventStatusSchema = z.enum([
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
]);
export type EventStatusValue = z.infer<typeof EventStatusSchema>;

export const ReminderStatusSchema = z.enum(["PENDING", "SENT", "DISMISSED"]);
export type ReminderStatusValue = z.infer<typeof ReminderStatusSchema>;

const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const MetadataSchema = z.record(z.string(), z.unknown());

const DateInputSchema = z.union([z.string().datetime(), z.date()]).transform(
  (v) => (v instanceof Date ? v : new Date(v)),
);

export const CreateEventInputSchema = z.object({
  type: EventTypeSchema,
  title: z.string().min(1, "Title required"),
  date: DateSchema,
  time: TimeSchema,
  durationMinutes: z.number().int().positive().max(1440).optional(),
  address: z.string().min(1).optional(),
  coordinates: CoordinatesSchema.optional(),
  sourceUrl: z.string().url().optional(),
  contactName: z.string().min(1).optional(),
  contactPhone: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  notes: z.string().optional(),
  metadata: MetadataSchema.optional(),
  confirmed: z.boolean().optional(),
});
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

export const ListEventsInputSchema = z.object({
  dateRange: z
    .object({
      from: DateSchema.optional(),
      to: DateSchema.optional(),
    })
    .optional(),
  type: EventTypeSchema.optional(),
  status: EventStatusSchema.optional(),
  hasAddress: z.boolean().optional(),
});
export type ListEventsInput = z.infer<typeof ListEventsInputSchema>;

export const UpdateEventFieldsSchema = z.object({
  title: z.string().min(1).optional(),
  type: EventTypeSchema.optional(),
  date: DateSchema.optional(),
  time: TimeSchema.optional(),
  durationMinutes: z.number().int().positive().max(1440).optional(),
  address: z.string().nullable().optional(),
  coordinates: CoordinatesSchema.nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  notes: z.string().nullable().optional(),
  metadata: MetadataSchema.nullable().optional(),
  status: EventStatusSchema.optional(),
});
export type UpdateEventFields = z.infer<typeof UpdateEventFieldsSchema>;

export const UpdateEventInputSchema = z.object({
  eventId: z.string().min(1),
  fields: UpdateEventFieldsSchema,
  confirmed: z.boolean().optional(),
});
export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;

export const CancelEventInputSchema = z.object({
  eventId: z.string().min(1),
  confirmed: z.boolean().optional(),
});
export type CancelEventInput = z.infer<typeof CancelEventInputSchema>;

export const CreateReminderInputSchema = z.object({
  message: z.string().min(1),
  remindAt: DateInputSchema,
  eventId: z.string().min(1).optional(),
});
export type CreateReminderInput = z.infer<typeof CreateReminderInputSchema>;

export const ListRemindersInputSchema = z.object({
  status: ReminderStatusSchema.optional(),
  dateRange: z
    .object({
      from: DateInputSchema.optional(),
      to: DateInputSchema.optional(),
    })
    .optional(),
});
export type ListRemindersInput = z.infer<typeof ListRemindersInputSchema>;

export const DismissReminderInputSchema = z.object({
  reminderId: z.string().min(1),
});
export type DismissReminderInput = z.infer<typeof DismissReminderInputSchema>;

export const OptimizeDayInputSchema = z.object({
  date: DateSchema,
});
export type OptimizeDayInput = z.infer<typeof OptimizeDayInputSchema>;

export const LookupPropertyInputSchema = z.object({
  query: z.string().min(1),
});
export type LookupPropertyInput = z.infer<typeof LookupPropertyInputSchema>;

export const AddPropertyToRouteInputSchema = z.object({
  query: z.string().min(1),
});
export type AddPropertyToRouteInput = z.infer<typeof AddPropertyToRouteInputSchema>;

export const ExportItineraryInputSchema = z.object({
  format: z.enum(["client", "detailed"]),
  route: z.unknown(),
});
export type ExportItineraryInput = z.infer<typeof ExportItineraryInputSchema>;
