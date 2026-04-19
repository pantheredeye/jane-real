import { route } from "rwsdk/router";
import { AuthPage } from "./AuthPage";
import { ForgotPassword } from "./ForgotPassword";
import { ResetPassword } from "./ResetPassword";
import { MagicLanding } from "./MagicLanding";
import { sessions } from "@/session/store";
import { loginRateLimit, passwordResetRateLimit } from "@/app/interruptors/rateLimit";

export const userRoutes = [
  route("/auth", [
    loginRateLimit,
    ({ ctx }) => {
      if (ctx.user && ctx.tenant) {
        return new Response(null, {
          status: 302,
          headers: { Location: "/route/" },
        });
      }
    },
    AuthPage,
  ]),
  route("/login", () => new Response(null, {
    status: 302,
    headers: { Location: "/user/auth" },
  })),
  route("/signup", () => new Response(null, {
    status: 302,
    headers: { Location: "/user/auth" },
  })),
  route("/forgot-password", [ForgotPassword]),
  route("/reset-password", [passwordResetRateLimit, ResetPassword]),
  route("/magic", [passwordResetRateLimit, MagicLanding]),
  route("/logout", async function ({ request }) {
    const headers = new Headers();
    await sessions.remove(request, headers);
    headers.set("Location", "/");

    return new Response(null, {
      status: 302,
      headers,
    });
  }),
];
