import { db } from "@/db";
import { sendPush } from "./pushSubscription";

export interface ReminderCronResult {
  processed: number;
  pushed: number;
  skipped: number;
}

// Fires due reminders and marks them SENT. Called from the scheduled handler
// on the every-5-min cron. Reminders are marked SENT regardless of push
// outcome so they never re-fire (users without a subscription still progress).
export async function runReminderCron(): Promise<ReminderCronResult> {
  const now = new Date();
  const due = await db.reminder.findMany({
    where: { remindAt: { lte: now }, status: "PENDING" },
  });

  let pushed = 0;
  let skipped = 0;
  for (const r of due) {
    try {
      const outcome = await sendPush(r.userId, {
        title: "RouteFast",
        body: r.message,
        url: "/route/",
      });
      if (outcome.sent) pushed++;
      else skipped++;
    } catch {
      skipped++;
    }
    await db.reminder.update({
      where: { id: r.id },
      data: { status: "SENT" },
    });
  }

  return { processed: due.length, pushed, skipped };
}
