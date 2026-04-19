import type { Prisma } from "@generated/prisma";
import type {
  AgentContext,
  CreateReminderInput,
  DismissReminderInput,
  ListRemindersInput,
  ToolResult,
} from "../types";
import {
  CreateReminderInputSchema,
  DismissReminderInputSchema,
  ListRemindersInputSchema,
} from "../types";

export async function createReminder(
  input: CreateReminderInput,
  ctx: AgentContext,
): Promise<ToolResult> {
  const parsed = CreateReminderInputSchema.parse(input);
  const { db, userId, tenantId } = ctx;

  if (parsed.eventId) {
    const event = await db.event.findFirst({
      where: { id: parsed.eventId, tenantId },
      select: { id: true },
    });
    if (!event) {
      return { ok: false, error: "Event not found or not accessible" };
    }
  }

  const reminder = await db.reminder.create({
    data: {
      userId,
      tenantId,
      eventId: parsed.eventId,
      message: parsed.message,
      remindAt: parsed.remindAt,
    },
  });

  return { ok: true, data: reminder };
}

export async function listReminders(
  input: ListRemindersInput,
  ctx: AgentContext,
): Promise<ToolResult> {
  const parsed = ListRemindersInputSchema.parse(input);
  const { db, tenantId } = ctx;

  const where: Prisma.ReminderWhereInput = { tenantId };
  if (parsed.status) where.status = parsed.status;

  if (parsed.dateRange) {
    const { from, to } = parsed.dateRange;
    const cond: Prisma.DateTimeFilter = {};
    if (from) cond.gte = from;
    if (to) cond.lte = to;
    if (from || to) where.remindAt = cond;
  }

  const reminders = await db.reminder.findMany({
    where,
    orderBy: { remindAt: "asc" },
  });

  return { ok: true, data: reminders };
}

export async function dismissReminder(
  input: DismissReminderInput,
  ctx: AgentContext,
): Promise<ToolResult> {
  const parsed = DismissReminderInputSchema.parse(input);
  const { db, tenantId } = ctx;

  const existing = await db.reminder.findFirst({
    where: { id: parsed.reminderId, tenantId },
  });
  if (!existing) {
    return { ok: false, error: "Reminder not found or not accessible" };
  }

  const updated = await db.reminder.update({
    where: { id: parsed.reminderId },
    data: { status: "DISMISSED" },
  });

  return { ok: true, data: updated };
}
