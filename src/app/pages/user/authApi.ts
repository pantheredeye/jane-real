import type { AppContext } from "@/worker";
import { verifyMagicLinkCore } from "./magicLink";

export async function magicVerifyHandler({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "invalid" }, { status: 405 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "invalid" }, { status: 400 });
  }

  const token = body?.token;
  if (!token || typeof token !== "string") {
    return Response.json({ success: false, error: "invalid" }, { status: 400 });
  }

  const sessionHeaders = new Headers();
  const result = await verifyMagicLinkCore(token, sessionHeaders);

  if (!result.success) {
    const status = result.error === "server_error" ? 500 : 400;
    return Response.json({ success: false, error: result.error }, { status });
  }

  const responseHeaders = new Headers(sessionHeaders);
  responseHeaders.set("Content-Type", "application/json");
  return new Response(
    JSON.stringify({ success: true, isNewUser: result.isNewUser, userId: result.userId }),
    { status: 200, headers: responseHeaders },
  );
}

export function authStatusHandler({ ctx }: { ctx: AppContext }) {
  return Response.json({ authenticated: !!ctx.user });
}
