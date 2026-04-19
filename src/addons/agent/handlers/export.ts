import type {
  AgentContext,
  ExportItineraryInput,
  ToolResult,
} from "../types";
import { ExportItineraryInputSchema } from "../types";
import {
  generateClientItinerary,
  generateDetailedItinerary,
} from "../../route-calculator/server-functions/export";
import type { OptimizedRoute, RouteItem } from "../../route-calculator/types";

type SerializedRouteItem = Omit<RouteItem, "appointmentTime" | "property"> & {
  appointmentTime: Date | string;
  property: RouteItem["property"] & { appointmentTime: Date | string | null };
};

type SerializedRoute = Omit<
  OptimizedRoute,
  "items" | "startTime" | "endTime"
> & {
  items: SerializedRouteItem[];
  startTime: Date | string;
  endTime: Date | string;
};

/**
 * Deserializes appointment time fields that may arrive as ISO strings
 * (e.g. when the route was produced earlier and serialized across
 * agent-loop / tool-call boundaries).
 */
function restoreDates(route: SerializedRoute): OptimizedRoute {
  return {
    ...route,
    startTime: new Date(route.startTime),
    endTime: new Date(route.endTime),
    items: route.items.map((item) => {
      const appointmentTime = new Date(item.appointmentTime);
      return {
        ...item,
        appointmentTime,
        property: {
          ...item.property,
          appointmentTime,
        },
      };
    }),
  };
}

export async function exportItinerary(
  input: ExportItineraryInput,
  _ctx: AgentContext,
): Promise<ToolResult> {
  const parsed = ExportItineraryInputSchema.parse(input);

  const route = restoreDates(parsed.route as SerializedRoute);

  if (!route.items || !Array.isArray(route.items) || route.items.length === 0) {
    return { ok: false, error: "Route has no items to export" };
  }

  const text =
    parsed.format === "client"
      ? generateClientItinerary(route)
      : generateDetailedItinerary(route);

  return {
    ok: true,
    data: { format: parsed.format, text },
  };
}
