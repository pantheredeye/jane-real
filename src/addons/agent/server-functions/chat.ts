import { db } from "@/db";
import { env } from "cloudflare:workers";
import type { Event, Reminder, User, Tenant } from "@generated/prisma";
import { AGENT_TOOLS, runAgentLoop, type Message } from "../llm";
import type { ConversationTurn } from "../durableObject";
import { makeExecuteHandler } from "../handlers";
import { buildSystemPrompt } from "../prompts";
import {
  DEFAULT_PREFERENCES,
  UserPreferencesSchema,
  type UserPreferences,
} from "./preferences";
import type { ToolCallResult } from "../llm";
import type { PropertyInput } from "../../route-calculator/types";

export interface ChatResult {
  reply: string;
  toolCalls: ToolCallResult[];
  events?: Event[];
  reminders?: Reminder[];
  properties?: PropertyInput[];
}

function parsePreferences(raw: string | null | undefined): UserPreferences {
  if (!raw) return { ...DEFAULT_PREFERENCES };
  try {
    const parsed = JSON.parse(raw) as unknown;
    return UserPreferencesSchema.parse({
      ...DEFAULT_PREFERENCES,
      ...(parsed as object),
    });
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function turnsToMessages(turns: ConversationTurn[]): Message[] {
  const out: Message[] = [];
  for (const t of turns) {
    if (t.role === "user") {
      out.push({ role: "user", content: t.content });
    } else if (t.role === "assistant") {
      out.push({ role: "assistant", content: t.content || null });
    } else if (t.role === "system") {
      out.push({ role: "system", content: t.content });
    }
    // Skip tool turns — resolved within a single agent loop, not replayed.
  }
  return out;
}

function todayRangeInTz(
  timezone: string | null,
): { from: string; to: string } {
  const tz = timezone ?? "UTC";
  try {
    const ymd = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    return { from: ymd, to: ymd };
  } catch {
    const iso = new Date().toISOString().slice(0, 10);
    return { from: iso, to: iso };
  }
}

export async function runChat(args: {
  message: string;
  user: User;
  tenant: Tenant;
}): Promise<ChatResult> {
  const { message, user, tenant } = args;

  const prefs = parsePreferences(user.preferences);

  const doId = env.AGENT_STATE_DO.idFromName(user.id);
  const stub = env.AGENT_STATE_DO.get(doId);

  const [turns, summary] = await Promise.all([
    stub.getHistory(20),
    stub.getContextSummary(),
  ]);
  const history = turnsToMessages(turns);

  const { from, to } = todayRangeInTz(prefs.timezone);
  const [todayEvents, pendingReminders] = await Promise.all([
    db.event.count({
      where: {
        tenantId: tenant.id,
        status: "SCHEDULED",
        date: { gte: from, lte: to },
      },
    }),
    db.reminder.count({
      where: { tenantId: tenant.id, status: "PENDING" },
    }),
  ]);

  const systemPrompt = buildSystemPrompt({
    user: { name: user.name, email: user.email },
    preferences: prefs,
    counts: { todayEvents, pendingReminders },
    now: new Date(),
  });

  const ctx = {
    db,
    userId: user.id,
    tenantId: tenant.id,
    userPreferences: prefs,
    env,
  };

  const result = await runAgentLoop({
    userMessage: message,
    history,
    contextSummary: summary ?? undefined,
    tools: AGENT_TOOLS,
    executeHandler: makeExecuteHandler(ctx),
    ctx,
    systemPrompt,
  });

  await stub.addMessage("user", message);
  await stub.addMessage("assistant", result.reply, result.toolCalls);
  await stub.pruneAndSummarize();

  return result;
}
