import { route } from "rwsdk/router";
import { env } from "cloudflare:workers";
import { db } from "@/db";
import { requireAuth, requireTenant } from "@/app/interruptors";
import { apiRateLimit } from "@/app/interruptors/rateLimit";
import { runChat } from "./server-functions/chat";
import { dismissReminder } from "./handlers/reminder";
import { DEFAULT_PREFERENCES } from "./server-functions/preferences";
import type { AppContext } from "@/worker";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function transcribeAudio(
  body: ArrayBuffer,
  contentType: string,
): Promise<string> {
  if (body.byteLength === 0) {
    throw new Error("Empty audio body");
  }
  if (import.meta.env.VITE_IS_DEV_SERVER) {
    return "what do i have coming up today";
  }
  console.log("[voice] transcribe start", {
    bytes: body.byteLength,
    contentType,
  });
  try {
    const ai = env.AI as unknown as {
      run: (
        model: string,
        input: { audio: string; language?: string },
      ) => Promise<{ text?: string; transcription?: string } | string>;
    };
    const result = await ai.run("@cf/openai/whisper-large-v3-turbo", {
      audio: toBase64(new Uint8Array(body)),
      language: "en",
    });
    const text =
      typeof result === "string"
        ? result
        : (result?.text ?? result?.transcription ?? "");
    console.log("[voice] transcribe ok", { len: text.length });
    return text;
  } catch (err) {
    console.error("[voice] transcribe failed", {
      name: err instanceof Error ? err.name : typeof err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      raw: err,
    });
    throw err;
  }
}

export const agentRoutes = [
  route("/chat", [
    requireAuth,
    requireTenant,
    apiRateLimit,
    async ({ request, ctx }: { request: Request; ctx: AppContext }) => {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      if (!ctx.user || !ctx.tenant) {
        return jsonResponse({ error: "Auth required" }, 401);
      }

      let message: string;
      try {
        const body = (await request.json()) as { message?: unknown };
        if (typeof body.message !== "string" || body.message.trim() === "") {
          return jsonResponse({ error: "message is required" }, 400);
        }
        message = body.message;
      } catch {
        return jsonResponse({ error: "Invalid JSON body" }, 400);
      }

      try {
        const result = await runChat({
          message,
          user: ctx.user,
          tenant: ctx.tenant,
        });
        return jsonResponse(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse({ error: msg }, 500);
      }
    },
  ]),

  route("/voice", [
    requireAuth,
    requireTenant,
    apiRateLimit,
    async ({ request, ctx }: { request: Request; ctx: AppContext }) => {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      if (!ctx.user || !ctx.tenant) {
        return jsonResponse({ error: "Auth required" }, 401);
      }

      let transcription: string;
      try {
        const body = await request.arrayBuffer();
        const contentType = request.headers.get("content-type") ?? "";
        transcription = await transcribeAudio(body, contentType);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        return jsonResponse(
          { error: `Transcription failed: ${msg}`, stack, debug: true },
          400,
        );
      }

      if (!transcription || transcription.trim() === "") {
        return jsonResponse({ error: "Empty transcription" }, 400);
      }

      try {
        const result = await runChat({
          message: transcription,
          user: ctx.user,
          tenant: ctx.tenant,
        });
        return jsonResponse({ transcription, ...result });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse({ error: msg }, 500);
      }
    },
  ]),

  route("/history", [
    requireAuth,
    requireTenant,
    async ({ request, ctx }: { request: Request; ctx: AppContext }) => {
      if (!ctx.user) {
        return jsonResponse({ error: "Auth required" }, 401);
      }
      const doId = env.AGENT_STATE_DO.idFromName(ctx.user.id);
      const stub = env.AGENT_STATE_DO.get(doId);

      if (request.method === "GET") {
        const turns = await stub.getHistory(100);
        return jsonResponse({ messages: turns });
      }
      if (request.method === "DELETE") {
        await stub.clearHistory();
        return jsonResponse({ ok: true });
      }
      return new Response("Method not allowed", { status: 405 });
    },
  ]),

  route("/reminders/:id/dismiss", [
    requireAuth,
    requireTenant,
    apiRateLimit,
    async ({
      request,
      params,
      ctx,
    }: {
      request: Request;
      params: { id: string };
      ctx: AppContext;
    }) => {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      if (!ctx.user || !ctx.tenant) {
        return jsonResponse({ error: "Auth required" }, 401);
      }
      if (!params.id) {
        return jsonResponse({ error: "reminderId required" }, 400);
      }
      try {
        const result = await dismissReminder(
          { reminderId: params.id },
          {
            db,
            userId: ctx.user.id,
            tenantId: ctx.tenant.id,
            userPreferences: DEFAULT_PREFERENCES,
            env,
          },
        );
        if (!result.ok) {
          return jsonResponse({ error: result.error ?? "Failed" }, 404);
        }
        return jsonResponse({ ok: true, reminder: result.data });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return jsonResponse({ error: msg }, 500);
      }
    },
  ]),

  route("/badge", [
    requireAuth,
    requireTenant,
    async ({ ctx }: { ctx: AppContext }) => {
      if (!ctx.tenant) {
        return jsonResponse({ error: "Auth required" }, 401);
      }
      const tz = parseTimezone(ctx.user?.preferences);
      const today = todayYmd(tz);
      const [events, reminders] = await Promise.all([
        db.event.count({
          where: {
            tenantId: ctx.tenant.id,
            status: "SCHEDULED",
            date: { gte: today, lte: today },
          },
        }),
        db.reminder.count({
          where: { tenantId: ctx.tenant.id, status: "PENDING" },
        }),
      ]);
      return jsonResponse({ events, reminders });
    },
  ]),
];

function parseTimezone(raw: string | null | undefined): string {
  if (!raw) return "UTC";
  try {
    const parsed = JSON.parse(raw) as { timezone?: string | null };
    return parsed.timezone ?? "UTC";
  } catch {
    return "UTC";
  }
}

function todayYmd(timezone: string): string {
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
