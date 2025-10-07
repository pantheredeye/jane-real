# Timezone Fix Refactor Plan

## Problem Summary
- Server calculates appointment times using timezone offset math that fails on Cloudflare Workers (UTC)
- Results in 4 AM start times on production, correct times locally
- Root cause: `parse()` creates dates in worker's timezone, then subtracts offset incorrectly

## Solution Approach
Move all time calculations to the client. Server only provides:
1. Optimized route order
2. Travel durations between properties
3. Property metadata

Client calculates all appointment times in local timezone using those durations.

---

## Implementation Steps

### 1. Update Types (`types.ts`)
- [ ] Remove `startTime` and `timezoneOffset` from `CalculateRouteRequest`
- [ ] Remove `startTime`, `endTime`, `appointmentTime` from server response types
- [ ] Create new `RouteStructure` type (route order + durations only)
- [ ] Keep `OptimizedRoute` type for client-side use only

### 2. Refactor Server Function (`calculateRoute.ts`)
- [ ] Remove `parseTimeInUserTimezone()` helper function
- [ ] Remove all appointment time calculations (lines 122-162)
- [ ] Return only: optimized property order + travel durations + property metadata
- [ ] Remove fallback/estimated duration logic (per earlier TODO)
- [ ] Add explicit errors when geocoding/distance matrix fails

### 3. Update Client Hook (`useRouteManager.ts`)
- [ ] Add new function `calculateInitialTimes(routeStructure, startTime)`
- [ ] Takes server's route structure + client's start time
- [ ] Calculates all appointment times client-side using `addMinutes()`
- [ ] Use existing cascading logic (already works perfectly)

### 4. Update HomePage (`HomePage.tsx`)
- [ ] When `calculateRoute` returns, pass result + `startTime` to new calculation function
- [ ] Client creates full `OptimizedRoute` with all Date objects
- [ ] Keep existing validation (startTime required)
- [ ] All dates stay in client's local timezone throughout

### 5. Update Export Functions (`export.ts`)
- [ ] No changes needed - already receives full `OptimizedRoute` from client
- [ ] Client sends dates that are already in correct timezone

### 6. Update Validation Schema (`types.ts`)
- [ ] Remove `startTime` and `timezoneOffset` from `CalculateRouteRequestSchema`
- [ ] Server validates only: addresses, duration, startingPropertyIndex

---

## Benefits
✅ Fixes 4 AM timezone bug completely
✅ Eliminates complex timezone offset math
✅ Server does what it's good at (optimization, API calls)
✅ Client does what it's good at (date handling in local timezone)
✅ Faster updates (no server round-trip for time changes)
✅ Simpler mental model

## Testing Needed
- [ ] Test initial calculation with various start times
- [ ] Test frozen appointments still work
- [ ] Test duration changes cascade correctly
- [ ] Test export functions render correct times
- [ ] Deploy to Cloudflare and verify times are correct
