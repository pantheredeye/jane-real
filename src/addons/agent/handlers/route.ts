import { addMinutes } from "date-fns";
import type {
  AgentContext,
  LookupPropertyInput,
  OptimizeDayInput,
  ToolResult,
} from "../types";
import {
  LookupPropertyInputSchema,
  OptimizeDayInputSchema,
} from "../types";
import { optimizeRoute } from "../../route-calculator/server-functions/calculateRoute";
import { geocodeAddresses } from "../../route-calculator/server-functions/geocoding";
import { parsePropertyInput } from "../../route-calculator/utils/parsePropertyInput";
import type {
  OptimizedRoute,
  Property,
  RouteItem,
  RouteStructure,
} from "../../route-calculator/types";

const DEFAULT_SHOWING_DURATION = 30;

function buildOptimizedRoute(
  structure: RouteStructure,
  startTime: string,
  baseDate: Date,
  durationByIndex: number[],
): OptimizedRoute {
  const [hours, minutes] = startTime.split(":").map(Number);
  const anchor = new Date(baseDate);
  anchor.setHours(hours ?? 0, minutes ?? 0, 0, 0);

  let cursor = anchor;
  const items: RouteItem[] = structure.items.map((item, index) => {
    if (index > 0) {
      cursor = addMinutes(cursor, item.travelTime);
    }
    const appointmentTime = new Date(cursor);
    const showingDuration =
      durationByIndex[item.propertyIndex] ?? item.property.showingDuration;
    cursor = addMinutes(appointmentTime, showingDuration);

    const property: Property = {
      ...item.property,
      showingDuration,
      appointmentTime,
    };
    return {
      propertyIndex: item.propertyIndex,
      property,
      appointmentTime,
      travelTime: item.travelTime,
    };
  });

  const totalDrivingTime = structure.totalDrivingTime;
  const totalShowingTime = items.reduce(
    (sum, item) => sum + item.property.showingDuration,
    0,
  );
  const totalTime = totalDrivingTime + totalShowingTime;
  const first = items[0]?.appointmentTime ?? anchor;
  const last = items[items.length - 1];
  const endTime = last
    ? addMinutes(last.appointmentTime, last.property.showingDuration)
    : first;

  return {
    items,
    totalTime,
    totalDrivingTime,
    totalShowingTime,
    startTime: first,
    endTime,
  };
}

export async function optimizeDay(
  input: OptimizeDayInput,
  ctx: AgentContext,
): Promise<ToolResult> {
  const parsed = OptimizeDayInputSchema.parse(input);
  const { db, userId, tenantId } = ctx;

  const events = await db.event.findMany({
    where: {
      tenantId,
      date: parsed.date,
      status: "SCHEDULED",
      address: { not: null },
    },
    orderBy: [{ time: "asc" }],
  });

  if (events.length === 0) {
    return {
      ok: false,
      error: `No scheduled events with addresses on ${parsed.date}`,
    };
  }

  const addresses = events.map((e) => e.address as string);
  const startTime = events[0].time;
  const durationByIndex = events.map((e) => e.durationMinutes);
  const avgDuration =
    Math.round(
      durationByIndex.reduce((s, d) => s + d, 0) / durationByIndex.length,
    ) || DEFAULT_SHOWING_DURATION;

  let structure: RouteStructure;
  try {
    structure = await optimizeRoute({
      addresses,
      showingDuration: avgDuration,
      startLocation: { type: "property", propertyIndex: 0 },
    });
  } catch (error) {
    return {
      ok: false,
      error: `Route optimization failed: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }

  const baseDate = new Date(`${parsed.date}T00:00:00`);
  const optimized = buildOptimizedRoute(
    structure,
    startTime,
    baseDate,
    durationByIndex,
  );

  const route = await db.route.create({
    data: {
      tenantId,
      createdById: userId,
      name: `Day plan for ${parsed.date}`,
      date: baseDate,
      startTime,
      properties: JSON.stringify(optimized.items.map((i) => i.property)),
      optimized: 1,
    },
  });

  const orderedEventIds = optimized.items.map(
    (item) => events[item.propertyIndex].id,
  );
  for (const id of orderedEventIds) {
    await db.event.update({
      where: { id },
      data: { routeId: route.id },
    });
  }

  const orderedEvents = optimized.items.map(
    (item) => events[item.propertyIndex],
  );

  return {
    ok: true,
    data: {
      routeId: route.id,
      route: optimized,
      events: orderedEvents,
      totalTime: optimized.totalTime,
    },
  };
}

export async function lookupProperty(
  input: LookupPropertyInput,
  ctx: AgentContext,
): Promise<ToolResult> {
  const parsed = LookupPropertyInputSchema.parse(input);

  const parseResult = parsePropertyInput(parsed.query);
  if (!parseResult.success) {
    return { ok: false, error: parseResult.error };
  }

  const { parsedAddress, sourceUrl, thumbnailUrl } = parseResult.property;

  const [geocoded] = await geocodeAddresses([parsedAddress]);
  if (!geocoded?.coordinates) {
    return {
      ok: false,
      error: `Could not geocode address: ${parsedAddress}`,
    };
  }

  return {
    ok: true,
    data: {
      address: geocoded.formattedAddress,
      coordinates: geocoded.coordinates,
      sourceUrl,
      thumbnailUrl,
    },
  };
}
