# Design Direction Review: Linear / Things / Cron for RouteFast

If running in this repo: also skim `NORTH_STAR.md` and `memory-bank/expo-migration-plan.md` for additional context, but treat this prompt as the source of truth for the review's scope.

If running in a fresh Claude conversation: this prompt is self-contained, you have everything you need.

Web-fetch the three reference apps' homepages and any screenshots you can pull. Also web-search "<reference> UI patterns 2026" if useful.

---

## Context

RouteFast helps real estate agents plan and run property showing routes. The primary user is **Jane**, a real estate agent who **lives on her phone**. She:

- Receives property links via text from clients (Zillow, Realtor URLs, raw addresses)
- Builds a showing route by pasting these into the app (often from Messages or browser tabs)
- Sets durations per property (15min for condos, 2hrs+ for big homes) — defaults uniform on first generation, then edits per-property
- Sets showing times per property; downstream properties auto-cascade from edits
- Locks specific times when an appointment must happen at a fixed time
- Requests appointment slots from listing agents based on the planned schedule
- On showing day: pulls up the schedule and drives between properties

She does ALL of this on her phone, including the planning session. The desktop app currently exists but is awful (1/4-width centered, emulating phone layout) — it should be redesigned to be a real desktop experience over time, not a phone shim.

## Her stated priorities (in her words)

- Mobile-first, including planning (not just day-of)
- Accessibility and functionality over decoration
- "Priority guides" resonate — visual hierarchy that points the eye
- Adding properties via paste must be frictionless
- Viewing route variations matters
- Per-property duration + time editing with cascade
- Day-of view for driving and showing
- She tried a "route properties" side panel mentally but couldn't hold it together → went back to inline. Worth exploring WHY that mental model failed and proposing alternatives.

## Three design references to evaluate

1. **Linear** (linear.app) — keyboard-first, dense, grayscale + single accent, command palette spine, optimistic UI, status pills.
2. **Things** (culturedcode.com/things) — generous whitespace, typography-as-UI, Magic Plus drag-edge button, swipe gestures, one-decision-per-screen.
3. **Cron / Notion Calendar** (notion.com/product/calendar) — time as first-class object, drag-resize events, multi-cal overlay, kbd + touch first-class.

## What to produce

For EACH of the three core surfaces below, produce:

A. **Surface**: name + one-sentence purpose
B. **3 design directions**, each pulling from a different blend of Linear / Things / Cron — describe layout, hierarchy, primary affordances, and one screen sketch in ASCII or words
C. For each direction: **strengths**, **weaknesses**, **mobile vs. desktop tradeoffs**, **accessibility notes** (touch targets ≥44pt, contrast ratios, screen-reader patterns, glove/cold-weather use, one-handed use, glance-while-driving)
D. **A recommendation** (which direction wins for this surface, and why)

The three surfaces:

1. **Mobile route-planning view** — paste, see, reorder, edit durations and times. Jane's primary workspace.
2. **Mobile day-of route view** — driving between properties, current/next prominent, voice-memo button, ETA awareness.
3. **Desktop route-planning view** — what does a real desktop experience look like, NOT a phone shim. (Side panel? Multi-pane? Linear-style dense list?)

## Specific questions to answer

- The "route properties side panel" mental model failed in Jane's head — WHY likely? Propose 2 alternatives that capture the side-panel benefit without the cognitive load.
- How should priority / hierarchy be conveyed since she likes "priority guides"? Color, weight, position, size, badges, indentation, dividers?
- For per-property duration editing with cascade: what touch interaction feels best? Stepper, drag-resize, tap-to-edit modal, inline keyboard, gesture? Pros/cons of each.
- For locked times: what's the visual treatment? Icon, color, background, position, lock-icon variant?
- What does "view route variations" look like? Tabs? Swipe between drafts? Inline diff? Stacked cards?
- What capabilities should she know about that she didn't ask for? Examples worth considering: Live Activity / Dynamic Island during driving, geofence auto-advance on arrival, showing-window visualization (drag-within-window), time-block density view, Cmd+K command palette on desktop, undo stack with toast, route templates ("typical Saturday morning"), property-status pills (geocoded / booked / locked / scouted), pre-flight checklist before route lock.

## Constraints

- iOS-first (Expo native). Android second. Web is RWSDK.
- Component libraries: shadcn/ui (web), react-native-reusables + NativeWind (native).
- Comic 50s aesthetic ONLY for marketing/login/empty states. In-app: modern minimal.
- Dark mode native (high readability in cars).
- Accessibility non-negotiable — assume one-handed phone use while walking, glove use in cold weather, glances while driving (or in CarPlay later).

## Output discipline

- Be **opinionated**, not balanced. State which direction wins per surface and WHY.
- Include at least one off-the-wall direction per surface (don't only safe-pick).
- Don't repeat the constraints back. Assume the reader read them.
- Use ASCII sketches where they clarify. Skip them where they're decoration.
- Cap total length at ~3,000 words. Be ruthless about cuts.
- End with a single "Top 3 things I'd change first" punch list.
