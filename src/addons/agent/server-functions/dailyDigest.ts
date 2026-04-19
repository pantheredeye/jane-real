import { Resend } from "resend";
import { env } from "cloudflare:workers";
import { db } from "@/db";
import type { EventType } from "@generated/prisma";

type WorkerEnv = Env & {
  RESEND_API_KEY?: string;
  DIGEST_FROM_EMAIL?: string;
};

interface StoredPreferences {
  timezone?: string | null;
  dailyDigest?: boolean;
}

interface DigestEvent {
  id: string;
  type: EventType;
  title: string;
  time: string;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
}

interface DigestReminder {
  id: string;
  message: string;
}

export interface DigestRunResult {
  attempted: number;
  sent: number;
  skipped: number;
}

const TYPE_ICONS: Record<EventType, string> = {
  SHOWING: "🏠",
  CLOSING: "🔑",
  INSPECTION: "🔍",
  APPRAISAL: "💰",
  LAWYER: "⚖️",
  TITLE: "📜",
  MEETING: "🤝",
  OPEN_HOUSE: "🚪",
  DEADLINE: "⏰",
  OTHER: "📌",
};

function parsePreferences(raw: string | null): StoredPreferences {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as StoredPreferences;
  } catch {
    return {};
  }
}

function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEventLineHtml(e: DigestEvent): string {
  const icon = TYPE_ICONS[e.type] ?? "📌";
  const parts: string[] = [
    `<strong>${escapeHtml(e.time)}</strong> ${icon} ${escapeHtml(e.title)}`,
  ];
  if (e.address) parts.push(`<br><span style="color:#555">${escapeHtml(e.address)}</span>`);
  if (e.contactName) {
    const phone = e.contactPhone ? ` (${escapeHtml(e.contactPhone)})` : "";
    parts.push(`<br><span style="color:#555">${escapeHtml(e.contactName)}${phone}</span>`);
  }
  return `<li style="margin-bottom:10px">${parts.join("")}</li>`;
}

function renderEventLineText(e: DigestEvent): string {
  const icon = TYPE_ICONS[e.type] ?? "*";
  const lines: string[] = [`${e.time} ${icon} ${e.title}`];
  if (e.address) lines.push(`  ${e.address}`);
  if (e.contactName) {
    lines.push(`  ${e.contactName}${e.contactPhone ? ` (${e.contactPhone})` : ""}`);
  }
  return lines.join("\n");
}

function renderBody(
  events: DigestEvent[],
  reminders: DigestReminder[],
): { html: string; text: string } {
  const appLink = "https://routefast.app";
  const empty = events.length === 0 && reminders.length === 0;

  if (empty) {
    const html = `<p>Good morning!</p><p>Nothing scheduled today!</p><p><a href="${appLink}">Open RouteFast</a></p>`;
    const text = `Good morning!\n\nNothing scheduled today!\n\n${appLink}\n`;
    return { html, text };
  }

  const eventItems = events.map(renderEventLineHtml).join("");
  const reminderItems = reminders
    .map((r) => `<li>${escapeHtml(r.message)}</li>`)
    .join("");

  const html = [
    `<p>Good morning! Today's schedule:</p>`,
    events.length > 0 ? `<ul style="padding-left:20px">${eventItems}</ul>` : "",
    reminders.length > 0
      ? `<p><strong>Pending reminders</strong></p><ul style="padding-left:20px">${reminderItems}</ul>`
      : "",
    `<p><a href="${appLink}">Open RouteFast</a></p>`,
  ].join("");

  const textParts: string[] = ["Good morning! Today's schedule:", ""];
  for (const e of events) textParts.push(renderEventLineText(e));
  if (reminders.length > 0) {
    textParts.push("", "Pending reminders:");
    for (const r of reminders) textParts.push(`- ${r.message}`);
  }
  textParts.push("", appLink, "");
  return { html, text: textParts.join("\n") };
}

// Iterates users opted into the daily digest and emails them today's
// scheduled events + pending reminders. Called on the daily cron.
export async function runDailyDigest(): Promise<DigestRunResult> {
  const workerEnv = env as WorkerEnv;
  if (!workerEnv.RESEND_API_KEY) {
    console.error("[dailyDigest] RESEND_API_KEY not configured");
    return { attempted: 0, sent: 0, skipped: 0 };
  }

  const fromEmail = workerEnv.DIGEST_FROM_EMAIL ?? "reminders@routefast.app";
  const resend = new Resend(workerEnv.RESEND_API_KEY);

  const users = await db.user.findMany({
    where: { preferences: { contains: '"dailyDigest":true' } },
    select: { id: true, email: true, preferences: true, name: true },
  });

  let sent = 0;
  let skipped = 0;
  for (const u of users) {
    const prefs = parsePreferences(u.preferences);
    if (!prefs.dailyDigest) {
      skipped++;
      continue;
    }
    const tz = prefs.timezone ?? "UTC";
    const today = todayInTimezone(tz);

    const events = await db.event.findMany({
      where: { userId: u.id, status: "SCHEDULED", date: today },
      orderBy: { time: "asc" },
      select: {
        id: true,
        type: true,
        title: true,
        time: true,
        address: true,
        contactName: true,
        contactPhone: true,
      },
    });

    const reminders = await db.reminder.findMany({
      where: { userId: u.id, status: "PENDING" },
      orderBy: { remindAt: "asc" },
      select: { id: true, message: true },
    });

    const { html, text } = renderBody(events, reminders);
    const greetingName = u.name ? `, ${u.name.split(" ")[0]}` : "";
    const subject =
      events.length === 0 && reminders.length === 0
        ? `Your day${greetingName}: nothing scheduled`
        : `Your day${greetingName}: ${events.length} event${events.length === 1 ? "" : "s"}`;

    try {
      await resend.emails.send({
        from: `RouteFast <${fromEmail}>`,
        to: u.email,
        subject,
        html,
        text,
      });
      sent++;
    } catch (err) {
      skipped++;
      console.error(
        "[dailyDigest] send failed for",
        u.id,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return { attempted: users.length, sent, skipped };
}
