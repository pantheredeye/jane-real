import type { Prisma } from "@generated/prisma";
import type {
  AgentContext,
  CancelEventInput,
  CreateEventInput,
  ListEventsInput,
  ToolResult,
  UpdateEventInput,
} from "../types";
import {
  CancelEventInputSchema,
  CreateEventInputSchema,
  ListEventsInputSchema,
  UpdateEventInputSchema,
} from "../types";
import { zonedTimeToUtc } from "../utils/timezone";

const DEFAULT_DURATION_MINUTES = 30;

interface TimeRange {
  start: number;
  end: number;
}

function toRange(time: string, duration: number): TimeRange {
  const [h, m] = time.split(":").map(Number);
  const start = (h ?? 0) * 60 + (m ?? 0);
  return { start, end: start + duration };
}

function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}

export async function createEvent(
  input: CreateEventInput,
  ctx: AgentContext,
): Promise<ToolResult> {
  const parsed = CreateEventInputSchema.parse(input);
  const { db, userId, tenantId, userPreferences } = ctx;
  const durationMinutes = parsed.durationMinutes ?? DEFAULT_DURATION_MINUTES;

  const sameDay = await db.event.findMany({
    where: { tenantId, date: parsed.date, status: "SCHEDULED" },
    select: { id: true, title: true, time: true, durationMinutes: true },
  });

  const newRange = toRange(parsed.time, durationMinutes);
  const conflicts = sameDay.filter((e) =>
    overlaps(newRange, toRange(e.time, e.durationMinutes)),
  );

  const warning =
    conflicts.length > 0
      ? `Time conflict with ${conflicts.length} existing event${conflicts.length === 1 ? "" : "s"}: ${conflicts
          .map((c) => `${c.title} at ${c.time}`)
          .join(", ")}`
      : undefined;

  const preview = {
    type: parsed.type,
    title: parsed.title,
    date: parsed.date,
    time: parsed.time,
    durationMinutes,
    address: parsed.address,
    contactName: parsed.contactName,
    contactPhone: parsed.contactPhone,
    contactEmail: parsed.contactEmail,
    notes: parsed.notes,
    conflicts: conflicts.map((c) => ({
      id: c.id,
      title: c.title,
      time: c.time,
    })),
  };

  if (!parsed.confirmed) {
    return { ok: true, needsConfirmation: true, preview, warning };
  }

  const event = await db.event.create({
    data: {
      userId,
      tenantId,
      title: parsed.title,
      type: parsed.type,
      date: parsed.date,
      time: parsed.time,
      durationMinutes,
      address: parsed.address,
      coordinates: parsed.coordinates
        ? JSON.stringify(parsed.coordinates)
        : null,
      sourceUrl: parsed.sourceUrl,
      contactName: parsed.contactName,
      contactPhone: parsed.contactPhone,
      contactEmail: parsed.contactEmail,
      notes: parsed.notes,
      metadata: parsed.metadata ? JSON.stringify(parsed.metadata) : null,
    },
  });

  let reminder = null;
  if (
    userPreferences.autoReminder &&
    userPreferences.autoReminderMinutes > 0
  ) {
    const tz = userPreferences.timezone ?? "UTC";
    const eventUtc = zonedTimeToUtc(parsed.date, parsed.time, tz);
    const remindAt = new Date(
      eventUtc.getTime() - userPreferences.autoReminderMinutes * 60_000,
    );
    reminder = await db.reminder.create({
      data: {
        userId,
        tenantId,
        eventId: event.id,
        message: `Reminder: ${parsed.title} at ${parsed.time}`,
        remindAt,
      },
    });
  }

  return { ok: true, data: { event, reminder }, warning };
}

export async function listEvents(
  input: ListEventsInput,
  ctx: AgentContext,
): Promise<ToolResult> {
  const parsed = ListEventsInputSchema.parse(input);
  const { db, tenantId } = ctx;

  const where: Prisma.EventWhereInput = { tenantId };
  if (parsed.type) where.type = parsed.type;
  if (parsed.status) where.status = parsed.status;

  if (parsed.dateRange) {
    const { from, to } = parsed.dateRange;
    const dateCond: Prisma.StringFilter = {};
    if (from) dateCond.gte = from;
    if (to) dateCond.lte = to;
    if (from || to) where.date = dateCond;
  }

  if (parsed.hasAddress === true) {
    where.address = { not: null };
  } else if (parsed.hasAddress === false) {
    where.address = null;
  }

  const events = await db.event.findMany({
    where,
    orderBy: [{ date: "asc" }, { time: "asc" }],
    include: {
      reminders: { where: { status: { not: "DISMISSED" } } },
    },
  });

  return { ok: true, data: events };
}

export async function updateEvent(
  input: UpdateEventInput,
  ctx: AgentContext,
): Promise<ToolResult> {
  const parsed = UpdateEventInputSchema.parse(input);
  const { db, tenantId } = ctx;

  const existing = await db.event.findFirst({
    where: { id: parsed.eventId, tenantId },
  });
  if (!existing) {
    return { ok: false, error: "Event not found or not accessible" };
  }

  if (!parsed.confirmed) {
    return {
      ok: true,
      needsConfirmation: true,
      preview: { current: existing, changes: parsed.fields },
    };
  }

  const f = parsed.fields;
  const data: Prisma.EventUpdateInput = {};
  if (f.title !== undefined) data.title = f.title;
  if (f.type !== undefined) data.type = f.type;
  if (f.date !== undefined) data.date = f.date;
  if (f.time !== undefined) data.time = f.time;
  if (f.durationMinutes !== undefined) data.durationMinutes = f.durationMinutes;
  if (f.address !== undefined) data.address = f.address;
  if (f.coordinates !== undefined)
    data.coordinates = f.coordinates ? JSON.stringify(f.coordinates) : null;
  if (f.sourceUrl !== undefined) data.sourceUrl = f.sourceUrl;
  if (f.contactName !== undefined) data.contactName = f.contactName;
  if (f.contactPhone !== undefined) data.contactPhone = f.contactPhone;
  if (f.contactEmail !== undefined) data.contactEmail = f.contactEmail;
  if (f.notes !== undefined) data.notes = f.notes;
  if (f.metadata !== undefined)
    data.metadata = f.metadata ? JSON.stringify(f.metadata) : null;
  if (f.status !== undefined) data.status = f.status;

  const updated = await db.event.update({
    where: { id: parsed.eventId },
    data,
  });

  return { ok: true, data: updated };
}

export async function cancelEvent(
  input: CancelEventInput,
  ctx: AgentContext,
): Promise<ToolResult> {
  const parsed = CancelEventInputSchema.parse(input);
  const { db, tenantId } = ctx;

  const existing = await db.event.findFirst({
    where: { id: parsed.eventId, tenantId },
  });
  if (!existing) {
    return { ok: false, error: "Event not found or not accessible" };
  }

  if (!parsed.confirmed) {
    return {
      ok: true,
      needsConfirmation: true,
      preview: existing,
      warning: "Cancelling will also dismiss any pending reminders.",
    };
  }

  const updated = await db.event.update({
    where: { id: parsed.eventId },
    data: { status: "CANCELLED" },
  });

  const dismissed = await db.reminder.updateMany({
    where: {
      eventId: parsed.eventId,
      tenantId,
      status: { not: "DISMISSED" },
    },
    data: { status: "DISMISSED" },
  });

  return { ok: true, data: { event: updated, remindersDismissed: dismissed.count } };
}
