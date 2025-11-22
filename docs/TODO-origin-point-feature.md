# Origin Point Feature

Route calculation from user's current/custom location.

## Scope Decisions
- Separate origin (not a property) - shows travel time TO first property
- Location options: current (geolocation) + saved locations
- TSP optimization considers origin
- MVP: text input only, geolocation v2

## Implementation

### 1. Types (`types.ts`)
- `Origin`: `{ type: 'none' | 'current' | 'saved', address?, coords?, savedId? }`
- `SavedLocation`: `{ id, name, address, coords }`
- Update `RouteRequest` with optional `origin`

### 2. UI - OriginSelector.tsx ("use client")
- Toggle: None / Current Location / Saved
- Address text input (MVP)
- Geolocation button (v2)
- Dropdown for saved locations (v2)

### 3. Saved Locations (v2)
- Prisma model: SavedLocation (user_id, name, address, lat, lng)
- Server functions: get/save/delete
- Simple management UI

### 4. Server Changes (`calculateRoute.ts`)
- Accept optional `origin`
- Include origin in distance matrix (index 0)
- Modify TSP to start from origin
- Return `travelTimeToFirst`
- Backward compatible

### 5. HomePage Updates
- Add `origin` state
- Display travel time to first property
- Pass origin to calculate request

### 6. Route Display
- Show "From: [origin]" before first property
- Update itinerary export

## Unresolved
- Keep "starting property" dropdown when no origin, or fully replace?
- Saved locations: per-user or per-tenant?
- Consider return trip to origin?

## Related Ideas (parking lot)
- Agent in field user flow sketch
- Map view integration
- Web Share API for sharing routes
