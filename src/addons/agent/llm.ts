import type { Event, Reminder } from "@generated/prisma";
import type { AgentContext, ToolResult } from "./types";

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content?: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolCallResult = {
  id: string;
  name: string;
  input: unknown;
  result: ToolResult;
};

const KIMI_MODEL = "@cf/moonshotai/kimi-k2.5";
const DEFAULT_MAX_ITERATIONS = 5;

type WorkersAiResponse = {
  response?: string;
  tool_calls?: ToolCall[];
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: ToolCall[];
    };
  }>;
};

function parseAiResponse(raw: unknown): {
  text: string;
  toolCalls: ToolCall[];
} {
  if (typeof raw === "string") return { text: raw, toolCalls: [] };
  const r = (raw ?? {}) as WorkersAiResponse;

  const choiceMsg = r.choices?.[0]?.message;
  const text =
    (typeof r.response === "string" ? r.response : null) ??
    choiceMsg?.content ??
    "";
  const toolCalls = r.tool_calls ?? choiceMsg?.tool_calls ?? [];
  return { text: text ?? "", toolCalls };
}

function looksLikeEvent(v: unknown): v is Event {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.date === "string" &&
    typeof o.time === "string"
  );
}

function looksLikeReminder(v: unknown): v is Reminder {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.message === "string" &&
    "remindAt" in o
  );
}

function extractEventsAndReminders(
  result: ToolResult,
  events: Event[],
  reminders: Reminder[],
): void {
  if (!result.ok || result.data == null) return;
  const data = result.data as Record<string, unknown>;

  const candidateEvent = data.event;
  if (looksLikeEvent(candidateEvent)) events.push(candidateEvent);

  const candidateReminder = data.reminder;
  if (looksLikeReminder(candidateReminder)) reminders.push(candidateReminder);

  const eventList = data.events;
  if (Array.isArray(eventList)) {
    for (const e of eventList) if (looksLikeEvent(e)) events.push(e);
  }

  const reminderList = data.reminders;
  if (Array.isArray(reminderList)) {
    for (const r of reminderList) if (looksLikeReminder(r)) reminders.push(r);
  }

  if (looksLikeEvent(result.data)) events.push(result.data);
  if (looksLikeReminder(result.data)) reminders.push(result.data);
}

export async function runAgentLoop(args: {
  userMessage: string;
  history: Message[];
  contextSummary?: string;
  tools: ToolDef[];
  executeHandler: (name: string, input: unknown) => Promise<ToolResult>;
  ctx: AgentContext;
  systemPrompt: string;
  maxIterations?: number;
}): Promise<{
  reply: string;
  toolCalls: ToolCallResult[];
  events?: Event[];
  reminders?: Reminder[];
}> {
  const max = args.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const messages: Message[] = [
    { role: "system", content: args.systemPrompt },
  ];
  if (args.contextSummary) {
    messages.push({
      role: "system",
      content: `Prior conversation summary:\n${args.contextSummary}`,
    });
  }
  messages.push(...args.history);
  messages.push({ role: "user", content: args.userMessage });

  const toolCalls: ToolCallResult[] = [];
  const events: Event[] = [];
  const reminders: Reminder[] = [];

  const ai = args.ctx.env.AI as unknown as {
    run: (model: string, opts: unknown) => Promise<unknown>;
  };

  let lastText = "";

  for (let i = 0; i < max; i++) {
    const raw = await ai.run(KIMI_MODEL, {
      messages,
      tools: args.tools,
    });
    const { text, toolCalls: calls } = parseAiResponse(raw);
    lastText = text || lastText;

    if (!calls || calls.length === 0) {
      return {
        reply: text,
        toolCalls,
        events: events.length ? events : undefined,
        reminders: reminders.length ? reminders : undefined,
      };
    }

    messages.push({
      role: "assistant",
      content: text || null,
      tool_calls: calls,
    });

    for (const call of calls) {
      let parsedArgs: unknown;
      try {
        parsedArgs = call.function.arguments
          ? JSON.parse(call.function.arguments)
          : {};
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const failResult: ToolResult = {
          ok: false,
          error: `Failed to parse tool arguments: ${errMsg}`,
        };
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(failResult),
        });
        toolCalls.push({
          id: call.id,
          name: call.function.name,
          input: call.function.arguments,
          result: failResult,
        });
        continue;
      }

      let result: ToolResult;
      try {
        result = await args.executeHandler(call.function.name, parsedArgs);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        result = { ok: false, error: errMsg };
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
      toolCalls.push({
        id: call.id,
        name: call.function.name,
        input: parsedArgs,
        result,
      });
      extractEventsAndReminders(result, events, reminders);
    }
  }

  return {
    reply:
      lastText ||
      "I made several tool calls but couldn't produce a final response. Please try again.",
    toolCalls,
    events: events.length ? events : undefined,
    reminders: reminders.length ? reminders : undefined,
  };
}

const EVENT_TYPE_ENUM = [
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
];

const EVENT_STATUS_ENUM = ["SCHEDULED", "COMPLETED", "CANCELLED"];

const REMINDER_STATUS_ENUM = ["PENDING", "SENT", "DISMISSED"];

const COORDINATES_SCHEMA = {
  type: "object",
  properties: {
    lat: { type: "number", minimum: -90, maximum: 90 },
    lng: { type: "number", minimum: -180, maximum: 180 },
  },
  required: ["lat", "lng"],
};

export const AGENT_TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "createEvent",
      description:
        "Create a calendar event (showing, closing, inspection, etc.). MUTATION: First call without `confirmed` to preview details and any time conflicts; only call again with `confirmed: true` after the user agrees. Date must be absolute YYYY-MM-DD. Time HH:MM (24h, in user's timezone). If the user has autoReminder enabled, a reminder is auto-created.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: EVENT_TYPE_ENUM },
          title: { type: "string" },
          date: {
            type: "string",
            description: "YYYY-MM-DD in user's local timezone",
          },
          time: { type: "string", description: "HH:MM 24h in user's timezone" },
          durationMinutes: { type: "integer", minimum: 1, maximum: 1440 },
          address: { type: "string" },
          coordinates: COORDINATES_SCHEMA,
          sourceUrl: {
            type: "string",
            description: "Listing URL (Zillow/Realtor/MLS)",
          },
          contactName: { type: "string" },
          contactPhone: { type: "string" },
          contactEmail: { type: "string" },
          notes: { type: "string" },
          confirmed: {
            type: "boolean",
            description: "Set true only after user confirms the preview",
          },
        },
        required: ["type", "title", "date", "time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listEvents",
      description:
        "List the agent's calendar events. READ-ONLY. Use to check schedule, find an event by date range, or filter by type/status. Provide dateRange.from/dateRange.to as YYYY-MM-DD when narrowing.",
      parameters: {
        type: "object",
        properties: {
          dateRange: {
            type: "object",
            properties: {
              from: { type: "string", description: "YYYY-MM-DD" },
              to: { type: "string", description: "YYYY-MM-DD" },
            },
          },
          type: { type: "string", enum: EVENT_TYPE_ENUM },
          status: { type: "string", enum: EVENT_STATUS_ENUM },
          hasAddress: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateEvent",
      description:
        "Update fields on an existing event. MUTATION: First call without `confirmed` to preview the diff; only call again with `confirmed: true` after the user agrees. Include only the fields being changed in `fields`. To clear a nullable field pass null.",
      parameters: {
        type: "object",
        properties: {
          eventId: { type: "string" },
          fields: {
            type: "object",
            properties: {
              title: { type: "string" },
              type: { type: "string", enum: EVENT_TYPE_ENUM },
              date: { type: "string", description: "YYYY-MM-DD" },
              time: { type: "string", description: "HH:MM 24h" },
              durationMinutes: {
                type: "integer",
                minimum: 1,
                maximum: 1440,
              },
              address: { type: ["string", "null"] },
              coordinates: { ...COORDINATES_SCHEMA, nullable: true },
              sourceUrl: { type: ["string", "null"] },
              contactName: { type: ["string", "null"] },
              contactPhone: { type: ["string", "null"] },
              contactEmail: { type: ["string", "null"] },
              notes: { type: ["string", "null"] },
              status: { type: "string", enum: EVENT_STATUS_ENUM },
            },
          },
          confirmed: { type: "boolean" },
        },
        required: ["eventId", "fields"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancelEvent",
      description:
        "Cancel an event (sets status=CANCELLED) and dismisses any pending reminders for it. DESTRUCTIVE MUTATION: ALWAYS preview first (no `confirmed`), explicitly ask the user to confirm, only call again with `confirmed: true` after the user agrees.",
      parameters: {
        type: "object",
        properties: {
          eventId: { type: "string" },
          confirmed: { type: "boolean" },
        },
        required: ["eventId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createReminder",
      description:
        "Create a one-off reminder. Optionally link to an event via eventId. `remindAt` should be an ISO 8601 datetime in UTC. Resolve relative phrasing (e.g. 'in 2 hours', 'tomorrow at 9am') to an absolute UTC time using the user's timezone before calling.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string" },
          remindAt: {
            type: "string",
            description: "ISO 8601 datetime, UTC preferred",
          },
          eventId: { type: "string" },
        },
        required: ["message", "remindAt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listReminders",
      description:
        "List the agent's reminders. READ-ONLY. Filter by status (PENDING/SENT/DISMISSED) and/or remindAt date range (ISO datetimes).",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: REMINDER_STATUS_ENUM },
          dateRange: {
            type: "object",
            properties: {
              from: { type: "string", description: "ISO 8601 datetime" },
              to: { type: "string", description: "ISO 8601 datetime" },
            },
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "dismissReminder",
      description:
        "Mark a reminder as dismissed. Use when the user explicitly says they're done with it or want to clear it.",
      parameters: {
        type: "object",
        properties: { reminderId: { type: "string" } },
        required: ["reminderId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "optimizeDay",
      description:
        "Build an optimized route for all scheduled events with addresses on a given date. Creates a Route record and links the day's events to it. Use when the user asks to plan, optimize, or order their day. Date is YYYY-MM-DD.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "YYYY-MM-DD" },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookupProperty",
      description:
        "Parse and geocode a property from a free-text address or listing URL (Zillow/Realtor/Redfin). READ-ONLY. Returns formatted address, coordinates, and listing/thumbnail URLs. Use to validate an address before creating a SHOWING event.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Address or listing URL",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "exportItinerary",
      description:
        "Render an OptimizedRoute as a shareable itinerary text. `format` is 'client' (concise, client-friendly) or 'detailed' (full driving/showing breakdown). Pass the OptimizedRoute object you previously received from optimizeDay as `route`.",
      parameters: {
        type: "object",
        properties: {
          format: { type: "string", enum: ["client", "detailed"] },
          route: {
            type: "object",
            description: "OptimizedRoute returned by optimizeDay",
          },
        },
        required: ["format", "route"],
      },
    },
  },
];
