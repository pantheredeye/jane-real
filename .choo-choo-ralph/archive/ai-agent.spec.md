---
title: "AI Agent — Phase 1 + 1.5"
created: 2026-04-09
poured:
  - routefast-mol-7wk
  - routefast-mol-e0r
  - routefast-mol-6t0
  - routefast-mol-j68
  - routefast-mol-708
  - routefast-mol-h60
  - routefast-mol-5pt
  - routefast-mol-7nq
  - routefast-mol-7dl
  - routefast-mol-36l
  - routefast-mol-ek9
  - routefast-mol-sxh
  - routefast-mol-949
  - routefast-mol-df7
  - routefast-mol-agw
iteration: 2
auto_discovery: false
auto_learnings: false
---
<project_specification>
<project_name>AI Agent — Phase 1 + 1.5</project_name>

  <overview>
    Conversational AI agent for a real estate agent client. Voice and text interaction to manage events (showings, closings, inspections, lawyer dates, title dates, etc.), set reminders, optimize routes, look up properties, and export itineraries. Mobile-first. Kimi K2.5 on Workers AI for tool resolution. MCP protocol via agents SDK.

    Phase 1: MCP tools + data model (events, reminders, user preferences) + Kimi wiring.
    Phase 1.5: Voice pipeline (ported from fresh-catch), PWA push notifications, daily email digest, Capacitor stub.

    Design principle: simple and flexible. We don't know the full requirements yet. Domain tool handlers are pure functions wrapping existing server functions — portable to @digitalglue/mcp when extracted.
  </overview>

  <context>
    <existing_patterns>
      - Server functions: `'use server'` directive, access context via `requestInfo` → `ctx.user`, `ctx.tenant`, `ctx.membership`. DB via `import { db } from '@/db'`. Throw Error for client messaging.
      - Interruptors: array-chained in route definitions, early-return Response to block. Pre-built: `requireAuth`, `requireTenant`, `requireSubscription`, `apiRateLimit`.
      - Route wiring: `route()` + `prefix()` in worker.tsx, interruptors chain left-to-right before page component.
      - Client components: `'use client'` directive, useState/useEffect, call server functions directly. Custom hooks for complex state (useRouteCalculation).
      - Server → Client: server component wrapper fetches data, passes as props to client component.
      - DB: Prisma D1 adapter, `setupDb(env)` before use, `db.model.findUnique/create/update` pattern.
      - Session: `SessionDurableObject` with `ctx.storage.put/get/delete`, session store via `defineDurableSession`.
      - CSS: Global CSS variables, utility classes, glassmorphism + neubrutalism, 48px+ tap targets, 16px base (no iOS zoom).
      - Types: Zod schemas co-located with types, separate server vs client type variants.
      - Existing rate limiter: IP-based in-memory sliding window in `src/app/interruptors/rateLimit.ts`.
      - Export functions: `generateClientItinerary(route)` and `generateDetailedItinerary(route)` are pure functions in `export.ts` that accept typed `OptimizedRoute` — use these directly, NOT the `exportItinerary` route handler which parses raw Request objects.
      - calculateRoute: consumes credits internally. Agent-initiated calls need special handling.
    </existing_patterns>
    <integration_points>
      - `src/addons/route-calculator/server-functions/calculateRoute.ts` — wrap as `optimize_day` MCP tool. NOTE: contains credit consumption logic — agent handler must bypass credits or confirm with user.
      - `src/addons/route-calculator/server-functions/export.ts` — call `generateClientItinerary()` and `generateDetailedItinerary()` directly (pure functions at line 53+), NOT the `exportItinerary` route handler.
      - `src/addons/route-calculator/server-functions/geocoding.ts` — used by property lookup tool
      - `src/addons/route-calculator/utils/parsePropertyInput.ts` — used by property lookup tool
      - `src/worker.tsx` — add agent routes (chat, voice HTTP, badge), new DO binding
      - `wrangler.jsonc` — add Workers AI binding (prod + staging), AgentState DO binding, Cron Trigger
      - `prisma/schema.prisma` — add Event, Reminder, PushSubscription models + preferences field on User
      - `src/session/durableObject.ts` — reference pattern for new AgentState DO
      - `src/app/Document.tsx` — add PWA manifest link, service worker registration script
    </integration_points>
    <new_technologies>
      - **Kimi K2.5 on Workers AI**: 256k context, tool calling, vision. Access via `env.AI.run('@cf/moonshot/kimi-k2.5', { messages, tools })`. Agents SDK starter defaults to it. Live on account.
      - **Cloudflare Agents SDK** (`agents` v0.9.0): `McpAgent` extends DurableObject, provides MCP protocol over Streamable HTTP. Use for external MCP endpoint (future Claude Desktop). For in-app chat, use DO for state but call Kimi loop directly from server function — avoids MCP protocol overhead.
      - **@modelcontextprotocol/sdk** (v1.29.0): `McpServer` for tool/resource/prompt registration with Zod schemas. Used for external MCP endpoint only.
      - **Workers AI Whisper**: `@cf/openai/whisper-large-v3-turbo` (default, better accuracy for addresses/proper nouns). Configurable — can downgrade to `whisper-tiny-en` if latency matters more than accuracy.
      - **Web Push API**: Push notifications on iOS 16.4+ (requires home screen install), Android Chrome natively. Needs service worker + Push API + Notification API. VAPID signing must use Web Crypto API directly — the `web-push` npm library uses Node.js crypto and won't work on Workers. ECDSA P-256 via `crypto.subtle.sign()`.
      - **Badging API**: `navigator.setAppBadge(count)` for in-app badge on PWA icon.
      - **Fresh-catch voice pipeline** (copy, not dependency): useVoiceRecorder hook (Web Audio + MediaRecorder), VoiceMicButton (amplitude glow), voice-command handler (Whisper → model tool resolution), VoiceCommandContext provider. All generic, zero domain coupling. NOTE: voice endpoint must be a raw HTTP route (POST with ArrayBuffer body), NOT a `'use server'` function — audio Blobs won't survive RWSDK serialization.
      - **Capacitor**: PWA-to-native wrapper. `npx cap init`, `npx cap add ios/android`. Siri Shortcuts via Capacitor plugin once native. Apple verification pending, Play Store registered.
      - **Resend**: Transactional email API. Workers-compatible (HTTP API, no Node.js deps). Mailchannels ended free Cloudflare partnership.
    </new_technologies>
    <conventions>
      - Addons are colocated: `src/addons/{name}/` with routes, components, server-functions, utils, types, styles
      - Server functions in `server-functions/` subdirectory
      - Migrations in `migrations/` root dir, numbered `0001_`, `0002_`, etc.
      - Error handling: modals for critical errors, inline for validation, button state for success. No toasts.
      - Mobile-first: all touch targets 48px+, font-size 16px+ to prevent iOS zoom
      - Concise code, no over-engineering, no speculative abstractions
    </conventions>
  </context>

  <tasks>
    <!-- ═══════════════════════════════════════════ -->
    <!-- PHASE 1: MCP TOOLS + DATA MODEL            -->
    <!-- ═══════════════════════════════════════════ -->

    <task id="data-model" priority="0" category="infrastructure">
      <title>Event + Reminder + Preferences D1 Schema</title>
      <description>
        Add Event, Reminder, and PushSubscription models. Add preferences JSON field to User. Event is generic — covers showings, closings, inspections, appraisals, lawyer dates, title dates, meetings, open houses, deadlines, and OTHER as catch-all. Reminder optionally links to an Event. User preferences store timezone, auto-reminder settings, and digest opt-in.
      </description>
      <steps>
        - Add EventType enum to prisma/schema.prisma: SHOWING, CLOSING, INSPECTION, APPRAISAL, LAWYER, TITLE, MEETING, OPEN_HOUSE, DEADLINE, OTHER
        - Add EventStatus enum: SCHEDULED, COMPLETED, CANCELLED
        - Add ReminderStatus enum: PENDING, SENT, DISMISSED
        - Add Event model:
          - id (String, cuid, PK)
          - userId, tenantId (String, FK)
          - title (String) — "Showing at 123 Elm", "Johnson closing"
          - type (EventType)
          - date (String, ISO "2026-04-15")
          - time (String, "14:00")
          - durationMinutes (Int, default 30)
          - address (String?) — optional, not all events have locations
          - coordinates (String?) — "lat,lng"
          - sourceUrl (String?) — listing link for showings
          - contactName (String?)
          - contactPhone (String?)
          - contactEmail (String?)
          - notes (String?)
          - metadata (String?) — JSON escape hatch for type-specific data
          - status (EventStatus, default SCHEDULED)
          - routeId (String?, FK → Route) — links to optimized route when agent optimizes a day
          - createdAt, updatedAt (DateTime)
        - Add Reminder model:
          - id (String, cuid, PK)
          - userId, tenantId (String, FK)
          - eventId (String?, FK → Event) — null = standalone reminder
          - message (String)
          - remindAt (DateTime)
          - status (ReminderStatus, default PENDING)
          - metadata (String?) — JSON
          - createdAt (DateTime)
        - Add PushSubscription model:
          - id (String, cuid, PK)
          - userId (String, FK)
          - endpoint (String)
          - keys (String) — JSON with p256dh + auth
          - createdAt (DateTime)
        - Add `preferences` field to User model (String?, JSON):
          - Default: `{"timezone":"America/New_York","autoReminder":true,"autoReminderMinutes":30,"dailyDigest":true}`
          - timezone: IANA timezone string, inferred from browser on first login via `Intl.DateTimeFormat().resolvedOptions().timeZone`
          - autoReminder: auto-create reminder N minutes before new events
          - autoReminderMinutes: how many minutes before (default 30)
          - dailyDigest: opt-in to morning email
        - Create migration `migrations/0004_add_events_reminders_preferences.sql`
        - Run `pnpm run db:generate`
      </steps>
      <test_steps>
        1. `pnpm run db:generate` — no errors
        2. `pnpm run types` — no type errors from new models
        3. Migration SQL creates Event, Reminder, PushSubscription tables with correct columns and FKs
        4. User model has preferences column
        5. EventType enum includes all 10 types including OTHER
      </test_steps>
      <review></review>
    </task>

    <task id="user-preferences" priority="0" category="functional">
      <title>User Preferences Server Functions + Timezone Detection</title>
      <description>
        Server functions to read/update user preferences. Auto-detect timezone on first login from browser. Preferences are a JSON field on User — simple, extensible, no migration needed to add new prefs.
      </description>
      <steps>
        - Create `src/addons/agent/server-functions/preferences.ts`:
          - `getPreferences(userId)` — parse JSON, return typed object with defaults for missing fields
          - `updatePreferences(userId, partial)` — merge partial update into existing prefs, save
          - Type: `UserPreferences { timezone: string, autoReminder: boolean, autoReminderMinutes: number, dailyDigest: boolean }`
          - Zod schema for validation
        - Create `src/addons/agent/utils/timezone.ts`:
          - Client-side helper: `detectTimezone()` → `Intl.DateTimeFormat().resolvedOptions().timeZone`
          - Called on login/signup, saved to preferences if not already set
        - Wire timezone detection into login and signup flows:
          - After successful auth, client sends detected timezone to `updatePreferences`
          - Only sets if preferences.timezone is not already set (don't overwrite manual choice)
      </steps>
      <test_steps>
        1. New user signs up → timezone auto-detected and saved
        2. `getPreferences` returns correct defaults for user with no preferences set
        3. `updatePreferences` merges partial update without overwriting other fields
        4. Existing user with timezone set → login doesn't overwrite
        5. Zod rejects invalid timezone strings
      </test_steps>
      <review></review>
    </task>

    <task id="domain-tool-handlers" priority="0" category="functional">
      <title>Domain Tool Handlers (Pure Functions)</title>
      <description>
        MCP tool handlers as pure async functions. Accept typed input + AgentContext, return structured results. Wrap existing server functions and new CRUD. Pure functions = portable to @digitalglue/mcp later.

        Key design decisions:
        - optimize_day: queries events with addresses for a date, feeds to calculateRoute, saves Route, links events via routeId. Bypasses credit consumption for agent-initiated calls.
        - create_event: checks for time conflicts with existing events, warns if overlap. Auto-creates reminder if user preferences.autoReminder is true.
        - Mutations (create, update, cancel): return `needsConfirmation: true` on first call. Agent must confirm with user before executing. Handler accepts `confirmed: boolean` param.
        - export_itinerary: calls `generateClientItinerary()` / `generateDetailedItinerary()` directly (pure functions), NOT the route handler.
      </description>
      <steps>
        - Create `src/addons/agent/types.ts`:
          - AgentContext: { db, userId, tenantId, userPreferences, env }
          - Tool input/output types for all handlers
          - Zod schemas for all tool inputs
          - ToolResult type with optional `needsConfirmation` flag
        - Create `src/addons/agent/handlers/route.ts`:
          - `optimizeDay(input: { date: string }, ctx)`:
            - Query events for date where address IS NOT NULL and status = SCHEDULED
            - Extract addresses → call calculateRoute (bypass credit consumption)
            - Save result as Route → stamp routeId on each event
            - Return optimized order with travel times + event details
          - `lookupProperty(input: { query: string }, ctx)`:
            - Wraps parsePropertyInput + geocodeAddresses
            - Returns parsed address, coordinates, source URL, thumbnail
        - Create `src/addons/agent/handlers/export.ts`:
          - `exportItinerary(input: { format: 'client' | 'detailed', route: OptimizedRoute }, ctx)`:
            - Calls `generateClientItinerary(route)` or `generateDetailedItinerary(route)` directly
            - Returns formatted itinerary text
        - Create `src/addons/agent/handlers/event.ts`:
          - `createEvent(input, ctx)`:
            - Input: type, title, date, time, durationMinutes?, address?, contact fields?, notes?, confirmed?
            - If not confirmed: check for time conflicts on same date, return event preview + `needsConfirmation: true` if conflicts, else return preview + `needsConfirmation: true`
            - If confirmed: create event in DB. If autoReminder enabled, auto-create Reminder at (event time - autoReminderMinutes)
            - Return created event
          - `listEvents(input: { dateRange?, type?, status?, hasAddress? }, ctx)`:
            - Flexible filters, scoped to tenant
          - `updateEvent(input: { eventId, fields, confirmed? }, ctx)`:
            - Confirmation flow for mutations
          - `cancelEvent(input: { eventId, confirmed? }, ctx)`:
            - Sets status = CANCELLED, also dismisses linked reminders
        - Create `src/addons/agent/handlers/reminder.ts`:
          - `createReminder(input: { message, remindAt, eventId? }, ctx)`:
            - Creates standalone or event-linked reminder
          - `listReminders(input: { status?, dateRange? }, ctx)`:
            - Filters by status + date range, scoped to tenant
          - `dismissReminder(input: { reminderId }, ctx)`:
            - Sets status = DISMISSED
        - All handlers: Zod-validate input, throw descriptive errors, return typed results with tenant scoping
      </steps>
      <test_steps>
        1. Import each handler in isolation — no import errors
        2. `pnpm run types` passes
        3. Zod schemas validate correct input, reject bad input
        4. optimizeDay: queries events, calls calculateRoute, saves Route, links events
        5. createEvent without confirmed=true returns needsConfirmation
        6. createEvent with confirmed=true creates event + auto-reminder
        7. createEvent detects time conflict and includes warning in response
        8. cancelEvent sets status CANCELLED and dismisses linked reminders
        9. listEvents filters by type, date range, hasAddress correctly
        10. All handlers scope queries to tenant
      </test_steps>
      <review></review>
    </task>

    <task id="agent-state-do" priority="1" category="infrastructure">
      <title>AgentState Durable Object</title>
      <description>
        Durable Object for per-user conversation state. NOT the full McpAgent — the in-app chat calls Kimi directly via server function, DO just holds state. Separate MCP endpoint (for future Claude Desktop) wires in later via McpAgent extending this DO.

        Conversation history pruning: sliding window of last 20 turns. Older turns summarized into a "context summary" stored separately. Prevents runaway token costs.
      </description>
      <steps>
        - Create `src/addons/agent/durableObject.ts` — AgentStateDO extends DurableObject:
          - SQLite tables: `conversations` (role, content, tool_calls, tool_results, timestamp), `context_summary` (summary text, updated_at)
          - `addMessage(role, content, toolCalls?, toolResults?)` — append to conversations
          - `getHistory(limit=20)` — returns last N turns
          - `getContextSummary()` — returns summary of older turns
          - `pruneAndSummarize(env)` — when conversations > 40 turns, summarize oldest 20 into context_summary via Kimi, delete them. Called after each interaction.
          - `clearHistory()` — wipe all
        - Add DO binding to wrangler.jsonc (prod + staging): `AGENT_STATE_DO` class `AgentStateDO`
        - Add DO migration tag: `{ "tag": "v2", "new_sqlite_classes": ["AgentStateDO"] }`
        - Export DO class from worker.tsx
      </steps>
      <test_steps>
        1. `pnpm run types` passes with new DO class
        2. DO binding resolves in wrangler config (prod + staging)
        3. addMessage stores correctly, getHistory retrieves in order
        4. getHistory(20) returns only last 20 turns
        5. pruneAndSummarize condenses old turns into summary
        6. clearHistory wipes all data
      </test_steps>
      <review></review>
    </task>

    <task id="kimi-tool-resolution" priority="1" category="functional">
      <title>Kimi K2.5 Tool Resolution + Agent Loop</title>
      <description>
        Wire Kimi K2.5 on Workers AI as the LLM brain. User text/transcription → Kimi with tool definitions → tool calls → execute → feed results back → Kimi formats response. Multi-turn loop with max depth.

        System prompt handles: confirmation flow for mutations, natural language date resolution (always resolve to absolute date/time before calling tools, confirm if ambiguous), timezone awareness, dynamic context injection.
      </description>
      <steps>
        - Add Workers AI binding to wrangler.jsonc (prod + staging): `[ai]` section with `binding = "AI"`
        - Create `src/addons/agent/llm.ts` — agent loop function:
          - Accept: user message, conversation history, context summary, tool definitions, env
          - Build messages array: system prompt + context summary + recent history + user message
          - Call `env.AI.run('@cf/moonshot/kimi-k2.5', { messages, tools })` with OpenAI-compatible tool format
          - Parse response: if tool_calls, execute handlers, append results, loop (max 5 iterations)
          - If text response, return as agent reply
          - Return: { reply: string, toolCalls: ToolCallResult[], events?: Event[], reminders?: Reminder[] }
        - Create `src/addons/agent/prompts.ts` — system prompt template:
          - Persona: helpful real estate assistant, professional but conversational
          - Current date/time in user's timezone (from preferences)
          - Capabilities: list all tools and when to use them
          - Rules:
            - Always resolve relative dates to absolute before calling tools ("Thursday" → "2026-04-16")
            - If date is ambiguous, ask user to clarify
            - For create/update/cancel mutations: present preview and ask for confirmation before executing with confirmed=true
            - For cancel: always confirm, this is destructive
            - When creating events, mention if auto-reminder will be created
          - Dynamic context: user name, today's event count, pending reminders count, subscription status
        - Wire into agent routes: incoming message → load DO state → agent loop → save to DO → response
      </steps>
      <test_steps>
        1. "what do I have today?" → Kimi calls list_events with today's date
        2. "schedule a showing at 123 Elm St Thursday 2pm" → Kimi calls create_event, returns preview, asks for confirmation
        3. "yes" (after preview) → Kimi calls create_event with confirmed=true, event + auto-reminder created
        4. "optimize Thursday" → Kimi calls list_events then optimize_day
        5. "remind me to call John tomorrow" → Kimi resolves "tomorrow" to absolute date, calls create_reminder
        6. Multi-tool: "remind me about the closing and schedule the inspection for Friday" → two tool calls
        7. "cancel the Elm Street showing" → Kimi confirms before cancelling
        8. Ambiguous: "schedule it for next week" → Kimi asks which day
        9. Max depth: loop terminates after 5 iterations
        10. Context summary included when history is long
      </test_steps>
      <review></review>
    </task>

    <task id="agent-routes" priority="1" category="infrastructure">
      <title>Agent Routes in Worker</title>
      <description>
        Routes for chat API (text), voice API (audio upload), conversation history, and badge count. Chat uses server function. Voice uses raw HTTP route (audio Blobs won't survive RWSDK serialization). MCP protocol endpoint stubbed for future Claude Desktop connection.
      </description>
      <steps>
        - Create `src/addons/agent/routes.tsx`:
          - `POST /agent/chat` — server function, accepts `{ message: string }`, returns `{ reply, toolCalls, events?, reminders? }`. Requires auth + tenant.
          - `POST /agent/voice` — raw HTTP route (NOT server function). Reads request body as ArrayBuffer. Transcribes via Workers AI Whisper (`@cf/openai/whisper-large-v3-turbo`). Feeds transcription to agent loop. Returns `{ transcription, reply, toolCalls }`. Requires auth + tenant.
          - `GET /agent/history` — returns conversation history. Requires auth.
          - `DELETE /agent/history` — clears conversation. Requires auth.
          - `GET /agent/badge` — returns `{ events: number, reminders: number }` (today's upcoming + pending). Requires auth.
        - Create `src/addons/agent/server-functions/chat.ts` — `'use server'`:
          - Load or create AgentStateDO for user (keyed by userId)
          - Load user preferences (timezone, autoReminder settings)
          - Forward message to agent loop with DO history + context summary
          - Save response to DO
          - Return agent response
        - Wire in worker.tsx: `prefix("/agent", agentRoutes)`
        - Apply interruptors: `requireAuth`, `requireTenant`, `apiRateLimit`
      </steps>
      <test_steps>
        1. `POST /agent/chat` with valid session → agent reply
        2. `POST /agent/chat` without session → 302 redirect to login
        3. `POST /agent/voice` with audio ArrayBuffer → transcription + agent reply
        4. `POST /agent/voice` without audio → 400
        5. `GET /agent/history` returns prior messages
        6. `DELETE /agent/history` clears history
        7. `GET /agent/badge` returns correct counts
        8. Rate limit: rapid requests get 429
      </test_steps>
      <review></review>
    </task>

    <task id="chat-ui" priority="2" category="functional">
      <title>Mobile-First Chat UI</title>
      <description>
        Conversational interface. Mobile-first slide-up panel accessible from any page. Text input with send button. Agent responses render tool results as inline cards with quick actions. This is text-only — voice comes in Phase 1.5.
      </description>
      <steps>
        - Create `src/addons/agent/components/ChatPanel.tsx` — `'use client'` slide-up panel:
          - Fixed bottom position, drag handle to expand/collapse
          - Message list: user/agent bubbles
          - Text input (16px font, no iOS zoom) + send button (48px tap target)
          - Auto-scroll to latest message
          - Typing indicator while agent processes
          - Confirmation flow: agent preview message has Confirm / Cancel buttons inline
        - Create `src/addons/agent/components/AgentMessage.tsx` — renders agent response:
          - Plain text as styled bubble
          - Tool results as inline cards:
            - EventCard: type icon, title, date/time, address, contact. Quick actions: "Get Directions" (Google Maps deep link), "Call Contact" (tel: link), "Share" (existing export)
            - ReminderCard: message, time, dismiss button
            - RouteSummaryCard: optimized order, total time, "Open in Route Calculator" link
          - Confirmation prompt: preview card + Confirm / Cancel buttons
        - Create `src/addons/agent/components/ChatButton.tsx` — floating action button:
          - Fixed bottom-right, 56px circle, agent icon
          - Badge count from `/agent/badge` endpoint
          - Opens ChatPanel on tap
        - Create `src/addons/agent/styles.css` — chat styles following routefast design system
        - Add ChatButton to authenticated layout (visible on all protected pages)
      </steps>
      <test_steps>
        1. ChatButton visible on all authenticated pages
        2. Tap ChatButton → ChatPanel slides up
        3. Type message + send → appears in chat, agent responds
        4. Agent event results render as EventCard with quick actions
        5. "Get Directions" opens Google Maps with address
        6. "Call Contact" opens phone dialer (mobile)
        7. Confirmation flow: preview shows, Confirm creates event, Cancel aborts
        8. Scroll works with long history
        9. Panel collapses on drag down or backdrop tap
        10. All tap targets 48px+, input 16px+ font
        11. Works on 375px viewport (iPhone SE)
      </test_steps>
      <review></review>
    </task>

    <!-- ═══════════════════════════════════════════ -->
    <!-- PHASE 1.5: VOICE + NOTIFICATIONS + EMAIL    -->
    <!-- ═══════════════════════════════════════════ -->

    <task id="voice-pipeline" priority="1" category="functional">
      <title>Voice Pipeline (Port from Fresh-Catch)</title>
      <description>
        Port voice input pipeline from fresh-catch. Hook and mic button are 100% generic. Restyle to routefast aesthetic. Swap Claude → Kimi K2.5. Whisper model: `whisper-large-v3-turbo` (better accuracy for addresses and proper nouns, configurable).

        Voice endpoint is a raw HTTP route, NOT a server function — audio Blobs won't survive RWSDK serialization. Fresh-catch's voice-command.ts is also an API route, same pattern.
      </description>
      <steps>
        - Copy and adapt `useVoiceRecorder` hook → `src/addons/agent/hooks/useVoiceRecorder.ts`:
          - Web Audio API + MediaRecorder (webm/opus, mp4 fallback for Safari)
          - Real-time amplitude analysis via AnalyserNode
          - 120-second recording limit
          - States: idle, recording, processing, done, error, permission-denied
          - No changes to core logic — it's generic
        - Copy and adapt VoiceMicButton → `src/addons/agent/components/VoiceMicButton.tsx`:
          - Restyle to routefast 50s retro aesthetic (glassmorphism glow, bold border)
          - Keep amplitude-reactive glow animation
          - 56px tap target
        - Voice endpoint already defined in agent-routes task (`POST /agent/voice`):
          - Reads ArrayBuffer from request body
          - Transcribes via `env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio })`
          - Passes transcription to agent loop
          - Returns { transcription, reply, toolCalls }
        - Create `src/addons/agent/contexts/VoiceContext.tsx` — provider:
          - Wraps useVoiceRecorder state
          - Exposes recording state, amplitude, start/stop/cancel
          - On recording complete: POST audio to `/agent/voice` as ArrayBuffer
          - Display transcription as user message, then agent response
        - Integrate into ChatPanel:
          - Mic button replaces send button when input is empty
          - Recording state: mic pulses, amplitude visualizes, timer shows
          - Processing state: transcription appears, then agent processes
          - One-tap: tap mic → record → tap again → transcribe → agent responds
      </steps>
      <test_steps>
        1. Tap mic → browser requests microphone permission
        2. Permission granted → recording starts, mic pulses with amplitude
        3. Speak → tap mic again → "Processing..." state
        4. Transcription appears in chat as user message
        5. Agent responds to transcribed text correctly
        6. Street addresses transcribe accurately (whisper-large-v3-turbo)
        7. Permission denied → clear error state, not crash
        8. 120-second limit → auto-stops recording
        9. Safari: audio records successfully (mp4 fallback)
      </test_steps>
      <review></review>
    </task>

    <task id="floating-mic" priority="2" category="functional">
      <title>Floating Mic Button (Mobile-First)</title>
      <description>
        Replace ChatButton with dual-mode FAB. Primary interaction is voice — she's driving between showings. One tap = start recording. Long press / swipe up = text chat. Badge shows pending count.
      </description>
      <steps>
        - Update `ChatButton.tsx` → dual-mode FAB:
          - Default: mic icon, 56px circle, bottom-right fixed
          - Tap: start voice recording immediately (no panel open)
          - Recording: mic pulses, tap again to stop + send
          - Long press (500ms) or swipe up: open ChatPanel for text
          - Badge: pending reminder + today's event count from `/agent/badge`
        - Voice recording flows directly to `/agent/voice` without opening chat panel
        - Agent response appears as notification card (3 seconds) above FAB:
          - Shows reply text, event/reminder cards if created
          - Tap card → opens ChatPanel scrolled to that response
        - When ChatPanel is open, mic button is inside panel (per voice-pipeline task)
        - Haptic feedback: `navigator.vibrate(50)` on recording start/stop (Android)
      </steps>
      <test_steps>
        1. Tap FAB → recording starts immediately (no panel open)
        2. Tap again → stops, processes, response card appears above FAB
        3. Long press FAB → ChatPanel opens for text
        4. Swipe up on FAB → ChatPanel opens
        5. Badge shows correct count
        6. Response card dismisses after 3 seconds
        7. Tap response card → ChatPanel opens at that message
        8. Works as global overlay on all authenticated pages
      </test_steps>
      <review></review>
    </task>

    <task id="pwa-setup" priority="1" category="infrastructure">
      <title>PWA Manifest + Service Worker</title>
      <description>
        Full PWA setup: manifest for home screen install, service worker for push notifications only. No offline caching (server-rendered, needs connectivity). VAPID signing via Web Crypto API — `web-push` npm library won't work on Workers runtime.
      </description>
      <steps>
        - Create `public/manifest.json`:
          - name: "RouteFast", short_name: "RouteFast"
          - display: "standalone", orientation: "portrait"
          - theme_color + background_color from routefast design system
          - Icons: 192x192, 512x512 PNG
          - start_url: "/" (NOT /route/ — that requires auth, causes redirect loop on cold open)
          - scope: "/"
        - Create `public/sw.js` — service worker (vanilla JS, not bundled):
          - `push` event: parse notification data, show via `self.registration.showNotification()`
          - `notificationclick` event: open app to relevant URL (e.g. /route/ for event reminders)
          - No fetch caching (intentional)
        - Update `src/app/Document.tsx`:
          - `<link rel="manifest" href="/manifest.json">`
          - `<meta name="apple-mobile-web-app-capable" content="yes">`
          - `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
          - `<meta name="theme-color" content="...">`
          - Inline script: register service worker on load
        - Create `src/addons/agent/utils/vapid.ts`:
          - VAPID signing via Web Crypto API (ECDSA P-256, `crypto.subtle.sign`)
          - JWT generation for Authorization header
          - Push message encryption (aes128gcm)
          - ~50-80 lines, no npm dependency
        - Create `src/addons/agent/server-functions/pushSubscription.ts`:
          - `subscribePush(subscription: PushSubscriptionJSON)` — save to DB
          - `unsubscribePush()` — remove subscription
          - `sendPush(userId, payload)` — lookup subscription, sign with VAPID, POST to endpoint
        - Add VAPID keys to wrangler secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
        - Create `src/scripts/generate-vapid-keys.ts` — one-time key generation script
        - Add PushSubscription model migration (included in data-model task)
      </steps>
      <test_steps>
        1. Service worker registers on page load (DevTools > Application)
        2. manifest.json loads correctly
        3. "Add to Home Screen" available on Android Chrome
        4. iOS Safari: Share → Add to Home Screen works
        5. Push permission request triggers on user gesture
        6. Subscription saves to DB
        7. sendPush delivers notification via VAPID-signed request
        8. start_url "/" loads correctly from home screen (no redirect loop)
      </test_steps>
      <review></review>
    </task>

    <task id="reminder-notifications" priority="1" category="functional">
      <title>Reminder Push Notifications + In-App Badge</title>
      <description>
        Push notifications when reminders come due. Cron Trigger every 5 minutes checks for due reminders. In-app badge via Badging API on PWA icon. Badge count from /agent/badge endpoint.
      </description>
      <steps>
        - Create `src/addons/agent/server-functions/reminderCron.ts`:
          - Query reminders: remindAt <= now AND status = PENDING
          - For each: lookup user's PushSubscription, send push via `sendPush()`
          - Update reminder status to SENT
          - Handle missing subscriptions gracefully (user hasn't enabled push)
        - Add Cron Trigger to wrangler.jsonc (prod + staging): `crons = ["*/5 * * * *"]`
        - Handle `scheduled` event in worker.tsx:
          - Check cron.scheduledTime or cron expression to dispatch to correct handler
          - reminder check: every 5 min
          - daily digest: daily (separate task)
        - Create `src/addons/agent/hooks/useBadge.ts`:
          - Polls `GET /agent/badge` every 60 seconds
          - Updates `navigator.setAppBadge(count)` for PWA icon
          - Updates ChatButton/FAB badge number
          - Returns { events, reminders } counts
      </steps>
      <test_steps>
        1. Create reminder for 2 minutes from now
        2. Cron fires → push notification appears
        3. Tap notification → app opens
        4. Reminder status updated to SENT
        5. Badge count on FAB reflects pending count
        6. PWA icon badge updates (Android Chrome)
        7. Multiple due reminders → multiple notifications
        8. Already-SENT reminders don't re-fire
        9. User without push subscription → no error, reminder still marked SENT
      </test_steps>
      <review></review>
    </task>

    <task id="daily-email-digest" priority="2" category="functional">
      <title>Daily Email Digest</title>
      <description>
        Morning email with today's events and pending reminders. Sent via Cron Trigger. Uses user timezone from preferences to determine "today" and send time. Resend API for delivery (Workers-compatible HTTP API). Respects user dailyDigest preference.
      </description>
      <steps>
        - Create `src/addons/agent/server-functions/dailyDigest.ts`:
          - Query all users where preferences.dailyDigest = true
          - For each user (in their timezone): query today's events (SCHEDULED) + pending reminders
          - Format email (plain text + simple HTML):
            - "Good morning! Here's your day:"
            - Events grouped by time: type icon, title, time, address, contact
            - Pending reminders list
            - "Nothing scheduled today!" if empty
            - Link to open RouteFast
          - Send via Resend API (`POST https://api.resend.com/emails`)
        - Add Cron Trigger for daily digest: `0 12 * * *` (12 UTC ≈ 7-8am ET)
          - NOTE: single cron time means users in other timezones get it at different local times. Acceptable for now, refine later with per-timezone scheduling.
        - Add `RESEND_API_KEY` to wrangler secrets
        - Add `DIGEST_FROM_EMAIL` to wrangler vars (e.g. "reminders@routefast.app")
        - Handle in scheduled event dispatcher alongside reminder cron
      </steps>
      <test_steps>
        1. Manually trigger digest → email sent with correct content
        2. User with no events/reminders → "Nothing scheduled today!"
        3. User with events → email lists all with correct times, types, contacts
        4. Email renders in Gmail, Apple Mail
        5. Link in email opens RouteFast
        6. User with dailyDigest=false → no email
        7. Cron fires at correct UTC time
      </test_steps>
      <review></review>
    </task>

    <task id="capacitor-stub" priority="3" category="infrastructure">
      <title>Capacitor Project Stub</title>
      <description>
        Initialize Capacitor scaffold for future native wrapping. Apple verification pending, Play Store registered. Just the config — no native functionality yet.
      </description>
      <steps>
        - Install: `pnpm add @capacitor/core @capacitor/cli`
        - Run `npx cap init "RouteFast" "app.routefast.mobile" --web-dir dist/client`
        - Create `capacitor.config.ts`:
          - appId: "app.routefast.mobile"
          - appName: "RouteFast"
          - webDir: "dist/client"
          - server.url commented out for dev
        - Add package.json scripts: `cap:sync`, `cap:open:ios`, `cap:open:android`
        - Add `ios/`, `android/` to .gitignore
        - Create `CAPACITOR.md`:
          - How to add platforms (`npx cap add ios/android`)
          - Build and deploy steps
          - Siri Shortcuts path: Capacitor plugin + App Intents framework
          - Push notification bridge: `@capacitor/push-notifications` plugin replaces web Push API when running native
      </steps>
      <test_steps>
        1. `npx cap init` completes
        2. `capacitor.config.ts` has correct values
        3. Package.json has cap scripts
        4. `pnpm run build && npx cap sync` doesn't error
      </test_steps>
      <review></review>
    </task>

  </tasks>

  <success_criteria>
    - Agent responds to text with correct tool calls (create/list/cancel events, reminders, optimize, lookup, export)
    - Agent confirms mutations before executing (confirmation flow)
    - Agent detects event time conflicts and warns
    - Auto-reminders created based on user preference
    - Voice input transcribes accurately (addresses, proper nouns) and resolves to tool calls via Kimi K2.5
    - Events and reminders persist in D1, scoped to tenant
    - Push notifications fire when reminders come due (iOS + Android)
    - Daily email digest arrives with today's schedule (respects opt-out)
    - One-tap voice from floating mic works without opening chat panel
    - Event cards have quick actions (directions, call contact, share)
    - Timezone auto-detected, dates/times correct in user's timezone
    - All UI works on 375px viewport, 48px+ tap targets
    - PWA installable on iOS and Android, start_url doesn't redirect-loop
    - Conversation history pruned to prevent runaway token costs
    - Capacitor config ready for native wrapping
  </success_criteria>

</project_specification>
