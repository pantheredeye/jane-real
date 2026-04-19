import type { AgentContext, ToolResult } from "../types";
import {
  cancelEvent,
  createEvent,
  listEvents,
  updateEvent,
} from "./event";
import {
  createReminder,
  dismissReminder,
  listReminders,
} from "./reminder";
import { lookupProperty, optimizeDay } from "./route";
import { exportItinerary } from "./export";

export function makeExecuteHandler(
  ctx: AgentContext,
): (name: string, input: unknown) => Promise<ToolResult> {
  return async (name, input) => {
    switch (name) {
      case "createEvent":
        return createEvent(input as Parameters<typeof createEvent>[0], ctx);
      case "listEvents":
        return listEvents(input as Parameters<typeof listEvents>[0], ctx);
      case "updateEvent":
        return updateEvent(input as Parameters<typeof updateEvent>[0], ctx);
      case "cancelEvent":
        return cancelEvent(input as Parameters<typeof cancelEvent>[0], ctx);
      case "createReminder":
        return createReminder(
          input as Parameters<typeof createReminder>[0],
          ctx,
        );
      case "listReminders":
        return listReminders(
          input as Parameters<typeof listReminders>[0],
          ctx,
        );
      case "dismissReminder":
        return dismissReminder(
          input as Parameters<typeof dismissReminder>[0],
          ctx,
        );
      case "optimizeDay":
        return optimizeDay(input as Parameters<typeof optimizeDay>[0], ctx);
      case "lookupProperty":
        return lookupProperty(
          input as Parameters<typeof lookupProperty>[0],
          ctx,
        );
      case "exportItinerary":
        return exportItinerary(
          input as Parameters<typeof exportItinerary>[0],
          ctx,
        );
      default:
        return { ok: false, error: `Unknown tool: ${name}` };
    }
  };
}
