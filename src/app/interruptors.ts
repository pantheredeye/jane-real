import { type MemberRole } from "@generated/prisma";

/**
 * Require user to be authenticated
 * Redirects to login if no user found
 */
export async function requireAuth({ ctx }: { ctx: any }) {
  if (!ctx.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/user/login" },
    });
  }
}

/**
 * Require user to have an active tenant membership
 * Redirects to tenant setup if no tenant found
 */
export async function requireTenant({ ctx }: { ctx: any }) {
  if (!ctx.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/user/login" },
    });
  }

  if (!ctx.tenant || !ctx.membership) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/tenant/setup" },
    });
  }

  // Check tenant status
  if (ctx.tenant.status === "SUSPENDED" || ctx.tenant.status === "CANCELLED") {
    return new Response(null, {
      status: 302,
      headers: { Location: "/tenant/reactivate" },
    });
  }
}

/**
 * Create a role-based access control interruptor
 * @param allowedRoles - Array of roles that can access the route
 */
export function requireRole(allowedRoles: MemberRole[]) {
  return async function requireRoleInterruptor({ ctx }: { ctx: any }) {
    if (!ctx.user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/user/login" },
      });
    }

    if (!ctx.membership) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/tenant/setup" },
      });
    }

    if (!allowedRoles.includes(ctx.membership.role)) {
      return Response.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
  };
}

/**
 * Require user to be tenant OWNER
 */
export const requireOwner = requireRole(["OWNER"]);

/**
 * Require user to be OWNER or MEMBER (excludes GUEST)
 */
export const requireMember = requireRole(["OWNER", "MEMBER"]);

/**
 * Allow any authenticated tenant member (including GUEST)
 */
export const requireAnyRole = requireRole(["OWNER", "MEMBER", "GUEST"]);
