import { DurableObject } from "cloudflare:workers";
import type { PrismaClient } from "@generated/prisma";

export type ConversationRole = "user" | "assistant" | "system" | "tool";

export interface ConversationTurn {
  id: number;
  role: ConversationRole;
  content: string;
  toolCalls: unknown[] | null;
  toolResults: unknown[] | null;
  timestamp: number;
}

export interface BadgeCounts {
  events: number;
  reminders: number;
}

const HISTORY_CAP = 40;
const PRUNE_BATCH = 20;
const KIMI_MODEL = "@cf/moonshotai/kimi-k2.5";

type ConversationRow = {
  id: number;
  role: string;
  content: string;
  tool_calls: string | null;
  tool_results: string | null;
  timestamp: number;
} & Record<string, SqlStorageValue>;

export class AgentStateDO extends DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        tool_calls TEXT,
        tool_results TEXT,
        timestamp INTEGER NOT NULL
      )`,
    );
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS context_summary (
        id INTEGER PRIMARY KEY,
        summary TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
    );
  }

  async addMessage(
    role: ConversationRole,
    content: string,
    toolCalls?: unknown[] | null,
    toolResults?: unknown[] | null,
  ): Promise<void> {
    this.ctx.storage.sql.exec(
      "INSERT INTO conversations (role, content, tool_calls, tool_results, timestamp) VALUES (?, ?, ?, ?, ?)",
      role,
      content,
      toolCalls ? JSON.stringify(toolCalls) : null,
      toolResults ? JSON.stringify(toolResults) : null,
      Date.now(),
    );
  }

  async getHistory(limit = 20): Promise<ConversationTurn[]> {
    const rows = this.ctx.storage.sql
      .exec<ConversationRow>(
        "SELECT id, role, content, tool_calls, tool_results, timestamp FROM conversations ORDER BY id DESC LIMIT ?",
        limit,
      )
      .toArray();
    return rows.reverse().map(rowToTurn);
  }

  async getRecentUserPrompts(limit = 5): Promise<string[]> {
    const rows = this.ctx.storage.sql
      .exec<{ content: string }>(
        "SELECT content FROM conversations WHERE role = 'user' ORDER BY id DESC LIMIT ?",
        limit * 4,
      )
      .toArray();
    const out: string[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      const trimmed = r.content.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trimmed.length > 60 ? `${trimmed.slice(0, 59)}…` : trimmed);
      if (out.length >= limit) break;
    }
    return out;
  }

  async getContextSummary(): Promise<string | null> {
    const row = this.ctx.storage.sql
      .exec<{ summary: string }>(
        "SELECT summary FROM context_summary WHERE id = 1",
      )
      .toArray()[0];
    return row?.summary ?? null;
  }

  async pruneAndSummarize(): Promise<void> {
    const countRow = this.ctx.storage.sql
      .exec<{ n: number }>("SELECT COUNT(*) AS n FROM conversations")
      .toArray()[0];
    const count = countRow?.n ?? 0;
    if (count <= HISTORY_CAP) return;

    const oldest = this.ctx.storage.sql
      .exec<ConversationRow>(
        "SELECT id, role, content, tool_calls, tool_results, timestamp FROM conversations ORDER BY id ASC LIMIT ?",
        PRUNE_BATCH,
      )
      .toArray();
    if (oldest.length === 0) return;

    const previous = await this.getContextSummary();
    const transcript = oldest
      .map((r) => formatTurnForSummary(rowToTurn(r)))
      .join("\n");

    const summary = await summarize(this.env, previous, transcript);
    if (!summary) return;

    this.ctx.storage.sql.exec(
      `INSERT INTO context_summary (id, summary, updated_at)
       VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET summary = excluded.summary, updated_at = excluded.updated_at`,
      summary,
      Date.now(),
    );

    const lastPrunedId = oldest[oldest.length - 1].id;
    this.ctx.storage.sql.exec(
      "DELETE FROM conversations WHERE id <= ?",
      lastPrunedId,
    );
  }

  async clearHistory(): Promise<void> {
    this.ctx.storage.sql.exec("DELETE FROM conversations");
    this.ctx.storage.sql.exec("DELETE FROM context_summary");
  }

  async getBadgeCounts(
    db: PrismaClient,
    tenantId: string,
  ): Promise<BadgeCounts> {
    const [events, reminders] = await Promise.all([
      db.event.count({ where: { tenantId, status: "SCHEDULED" } }),
      db.reminder.count({ where: { tenantId, status: "PENDING" } }),
    ]);
    return { events, reminders };
  }
}

function rowToTurn(r: ConversationRow): ConversationTurn {
  return {
    id: r.id,
    role: r.role as ConversationRole,
    content: r.content,
    toolCalls: r.tool_calls ? (JSON.parse(r.tool_calls) as unknown[]) : null,
    toolResults: r.tool_results
      ? (JSON.parse(r.tool_results) as unknown[])
      : null,
    timestamp: r.timestamp,
  };
}

function formatTurnForSummary(t: ConversationTurn): string {
  const tools = t.toolCalls?.length
    ? ` [tools: ${JSON.stringify(t.toolCalls)}]`
    : "";
  return `${t.role}: ${t.content}${tools}`;
}

async function summarize(
  env: Env,
  previous: string | null,
  transcript: string,
): Promise<string> {
  const system = previous
    ? `You are maintaining a running summary of a real estate agent's chat history. Integrate the new turns below into the prior summary. Keep under 500 words. Prioritize client names, property addresses, event dates/times, reminders, and unresolved requests. Prior summary:\n${previous}`
    : `You are summarizing a real estate agent's chat history. Keep under 500 words. Prioritize client names, property addresses, event dates/times, reminders, and unresolved requests.`;

  // Kimi K2.5 is live on the account but not in the static AiModels type.
  const ai = env.AI as unknown as {
    run: (
      model: string,
      input: { messages: Array<{ role: string; content: string }> },
    ) => Promise<{ response?: string } | string>;
  };
  const result = await ai.run(KIMI_MODEL, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: transcript },
    ],
  });

  if (typeof result === "string") return result;
  return result?.response ?? "";
}
