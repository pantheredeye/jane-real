import { requestInfo } from "rwsdk/worker";
import { verifyMagicLink } from "./magicLink";
import "./auth.css";

type MagicError = "expired" | "used" | "invalid" | "server_error";

export async function MagicLanding() {
  const { request, response } = requestInfo;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return <MagicErrorPage error="invalid" />;
  }

  const result = await verifyMagicLink(token);

  if (!result.success) {
    return <MagicErrorPage error={result.error} />;
  }

  response.headers.set("Location", result.isNewUser ? "/route/?welcome=1" : "/route/");
  return new Response(null, { status: 302, headers: response.headers });
}

function MagicErrorPage({ error }: { error: MagicError }) {
  const messages: Record<MagicError, { icon: string; title: string; body: string }> = {
    expired: {
      icon: "⏱",
      title: "Link Expired",
      body: "Magic links work for 15 minutes. Request a fresh one and try again.",
    },
    used: {
      icon: "✓",
      title: "Link Already Used",
      body: "Sign-in links work once. Head back and request a new one.",
    },
    invalid: {
      icon: "?",
      title: "Link Not Found",
      body: "This link looks broken. Start over from the sign-in page.",
    },
    server_error: {
      icon: "⚠",
      title: "Something Went Wrong",
      body: "We couldn't complete sign-in. Try again, or use password sign-in instead.",
    },
  };
  const m = messages[error];
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="halftone-shadow"></div>

        <h1 className="auth-title">RouteFast</h1>

        <div className="auth-step">
          <div className="auth-envelope">{m.icon}</div>
          <h2 className="auth-step-title">{m.title}</h2>
          <p className="auth-explainer">{m.body}</p>

          <a href="/user/auth" className="login-button login-button-primary">
            Back to sign-in
          </a>
        </div>
      </div>

      <div className="page-footer">
        <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="footer-link">
          Terms of Service
        </a>
        <span className="footer-divider">•</span>
        <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="footer-link">
          Privacy Policy
        </a>
        <span className="footer-divider">•</span>
        <a href="mailto:barrett@digitalglue.dev" className="footer-link">
          Contact
        </a>
      </div>
    </div>
  );
}
