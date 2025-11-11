import { defineApp, ErrorResponse } from "rwsdk/worker";
import { route, render, prefix } from "rwsdk/router";
import { Document } from "@/app/Document";
import { Home } from "@/app/pages/Home";
import { setCommonHeaders } from "@/app/headers";
import { userRoutes } from "@/app/pages/user/routes";
import { routeCalculatorRoutes } from "@/addons/route-calculator/routes";
import { subscriptionRoutes } from "@/addons/subscription/routes";
import landingRoutes from "@/app/pages/landing/routes";
import { sessions, setupSessionStore } from "./session/store";
import { Session } from "./session/durableObject";
import { type User, type Tenant, type TenantMembership, db, setupDb } from "@/db";
import { env } from "cloudflare:workers";
export { SessionDurableObject } from "./session/durableObject";

export type AppContext = {
  session: Session | null;
  user: User | null;
  tenant: Tenant | null;
  membership: TenantMembership | null;
};

export default defineApp([
  setCommonHeaders(),
  async ({ ctx, request, headers }) => {
    await setupDb(env);
    setupSessionStore(env);

    try {
      ctx.session = await sessions.load(request);
    } catch (error) {
      if (error instanceof ErrorResponse && error.code === 401) {
        await sessions.remove(request, headers);
        headers.set("Location", "/user/login");

        return new Response(null, {
          status: 302,
          headers,
        });
      }

      throw error;
    }

    if (ctx.session?.userId) {
      ctx.user = await db.user.findUnique({
        where: {
          id: ctx.session.userId,
        },
      });

      // Load tenant and membership if available in session
      if (ctx.session.tenantId && ctx.session.membershipId) {
        ctx.tenant = await db.tenant.findUnique({
          where: {
            id: ctx.session.tenantId,
          },
        });

        ctx.membership = await db.tenantMembership.findUnique({
          where: {
            id: ctx.session.membershipId,
          },
        });
      }
    }
  },
  render(Document, [
    ...landingRoutes,
    route("/signup", () => {
      return new Response(null, {
        status: 302,
        headers: { Location: "/user/signup" },
      });
    }),
    route("/protected", [
      ({ ctx }) => {
        if (!ctx.user) {
          return new Response(null, {
            status: 302,
            headers: { Location: "/user/login" },
          });
        }
      },
      Home,
    ]),
    prefix("/user", userRoutes),
    prefix("/subscription", subscriptionRoutes),
    prefix("/route", routeCalculatorRoutes),
  ]),
]);
