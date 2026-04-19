import { db } from "@/db";
import { PasskeyPanel } from "./PasskeyPanel";
import { SetPasswordPanel } from "./SetPasswordPanel";
import "./account.css";

const RECENT_FAILURE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const FAILURE_THRESHOLD = 3;

export async function AccountPage({ ctx }: { ctx: any }) {
  const credentials = await db.credential.findMany({
    where: { userId: ctx.user.id },
    select: {
      id: true,
      label: true,
      createdAt: true,
      lastUsedAt: true,
      failedAttempts: true,
      lastFailedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const now = Date.now();
  const showFailureBanner = credentials.some(
    (c) =>
      c.failedAttempts >= FAILURE_THRESHOLD &&
      c.lastFailedAt !== null &&
      now - c.lastFailedAt.getTime() <= RECENT_FAILURE_WINDOW_MS,
  );

  return (
    <div className="account-page">
      <div className="account-container">
        <h1 className="account-title">Account</h1>
        <p className="account-subtitle">Manage your sign-in methods</p>
        <p className="account-email">Signed in as {ctx.user.email}</p>

        <SetPasswordPanel hasPassword={ctx.user.passwordHash !== null} />

        <PasskeyPanel
          initial={credentials.map((c) => ({
            id: c.id,
            label: c.label,
            createdAt: c.createdAt.toISOString(),
            lastUsedAt: c.lastUsedAt ? c.lastUsedAt.toISOString() : null,
          }))}
          showFailureBanner={showFailureBanner}
        />

        <a href="/route" className="account-back-link">
          ← Back to routes
        </a>
      </div>
    </div>
  );
}
