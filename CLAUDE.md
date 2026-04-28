# RouteFast - RedwoodSDK Project

## Project Overview
This is a RedwoodSDK application featuring a real estate route calculator that helps agents optimize their property showing schedules. The project follows RedwoodSDK's full-stack colocation architecture and React Server Components (RSC) patterns.

## Session Hygiene & Memory Bank

**At session start**: read `NORTH_STAR.md` and `memory-bank/active-context.md`. These define current direction and where we left off.

**At session end**: invoke `/handoff` to update `memory-bank/active-context.md` and append to `memory-bank/progress.md`.

**When user asks** "what's my north star", "what should I be working on", "remind me of the plan", "what's the focus" → run `/north-star` (or directly read `NORTH_STAR.md` + `memory-bank/active-context.md` and summarize).

**Before any agent-driven feature work**: confirm worktree, active spec, demo script, acceptance criteria. Use `/hygiene` if unsure.

**Periodically** (or when user asks "should we still be doing this?"): run `/contrarian` to stress-test the current plan from a skeptical perspective.

**UI/UX checkpoints**: NEVER make UI/UX decisions unilaterally. Before any choice involving layout, color, typography, interaction pattern, copy, or new screen structure → pause, present 2–3 options with tradeoffs, wait for user pick. Existing subagents (`design-consistency-guardian`, `rwsdk-patterns-guardian`) enforce conventions but do not invent new ones.

**Where artifacts live (memory-bank vs. Ralph specs — IMPORTANT distinction)**:

`memory-bank/` is for **reference / persistent state** — things you READ to know what's true:
- `NORTH_STAR.md` (root) — pinned vision + 60/90/180 + architecture decisions
- `memory-bank/active-context.md` — where we left off + next steps
- `memory-bank/progress.md` — append-only dated log
- `memory-bank/ideas.md` — parking lot (triaged weekly)
- `memory-bank/design-directions.md` — chosen UI/UX directions per surface (output of `/design-review`)
- `memory-bank/inventory.md` — current-app audit (output of `routefast-inventory` subagent)
- `memory-bank/expo-migration-plan.md` — high-level phased roadmap (NOT executable; reference only)

`.choo-choo-ralph/` is for **executable feature specs** — things Ralph POURS into beads to work through:
- `.choo-choo-ralph/<feature>.spec.md` — per-feature spec in Ralph format (YAML frontmatter + `<project_specification>` XML sections + `<context>` with `<existing_patterns>` / `<integration_points>` / `<new_technologies>` / `<conventions>`)
- See `.choo-choo-ralph/archive/*.spec.md` for format reference
- Generated via `/choo-choo-ralph:spec`, poured via `/choo-choo-ralph:pour`, harvested via `/choo-choo-ralph:harvest`

**Rule of thumb**: if it has tasks + acceptance + demo + is meant to be executed → Ralph spec. If it's roadmap, audit, vision, or where-am-I → memory-bank.

**When unclear**: ask the user before placing a new doc. Drafts in memory-bank are fine as a staging area; convert to Ralph spec via `/choo-choo-ralph:spec` once the work is ready to execute, then delete the memory-bank draft.

**Slash commands** (in `.claude/commands/`):
- `/north-star` — start-of-session orientation
- `/handoff` — end-of-session state save
- `/contrarian` — stress-test current plan
- `/hygiene` — pre-work checklist

## Architecture

### Tech Stack
- **Framework**: RedwoodSDK 0.1.35
- **Runtime**: Cloudflare Workers
- **Database**: Prisma with D1 (SQLite)
- **Authentication**: WebAuthn (Passkeys)
- **Session Management**: Durable Objects
- **Frontend**: React Server Components + Client Components
- **Styling**: CSS with 50s Retro design system
- **Maps Integration**: Google Maps API

### Project Structure
```
src/
├── addons/route-calculator/          # Route Calculator Feature (Colocated)
│   ├── types.ts                      # TypeScript interfaces
│   ├── routes.tsx                    # Route definitions
│   ├── interruptors.ts              # Auth & validation middleware
│   ├── styles.css                   # Component styles
│   ├── pages/
│   │   └── HomePage.tsx             # Main calculator page ("use client")
│   ├── components/
│   │   ├── PropertyInputBox.tsx     # "use client" - Smart input with Add button
│   │   ├── PropertyList.tsx         # "use client" - Property list container
│   │   ├── PropertyListItem.tsx     # "use client" - List item with edit/delete
│   │   ├── ErrorModal.tsx           # "use client" - Accessible error modal
│   │   ├── DurationSelector.tsx     # "use client" - State management
│   │   ├── PropertyCard.tsx         # "use client" - Display with listing link
│   │   ├── PropertyControls.tsx     # "use client" - Form controls
│   │   ├── RouteSummary.tsx         # Server Component - Statistics
│   │   └── CopyButtons.tsx          # "use client" - Clipboard
│   ├── utils/
│   │   ├── parsePropertyInput.ts    # Main URL/address parser
│   │   ├── addressNormalizer.ts     # Duplicate detection logic
│   │   └── urlParsers/
│   │       ├── zillow.ts            # Zillow URL parser
│   │       ├── realtor.ts           # Realtor.com URL parser
│   │       └── redfin.ts            # Redfin URL parser (future)
│   └── server-functions/
│       ├── calculateRoute.ts        # "use server" - Route optimization
│       ├── geocoding.ts             # "use server" - Google Maps API
│       └── export.ts                # "use server" - Export functions
├── app/                             # Core app components
├── session/                         # Session management
├── db/                              # Database schema & queries
└── worker.tsx                       # Main application entry point
```

## Development Commands

### Standard Commands
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Deploy to Cloudflare
pnpm run deploy

# Deploy to Staging
CLOUDFLARE_ENV=staging pnpm release

# Database operations
pnpm run db:generate    # Generate Prisma client
pnpm run db:push       # Push schema to database
pnpm run db:studio     # Open Prisma Studio
```

### TypeScript & Linting
```bash
pnpm run generate  # Generate prior to type check
pnpm run types     # Check TypeScript types
pnpm run lint          # Run ESLint
pnpm run format        # Format code with Prettier
```

## Key Features

### Route Calculator Functionality
1. **Smart Property Input**: Paste addresses or Zillow URLs, parse and preview before calculating
2. **Duration Selection**: Set showing duration (15/30/45/60 minutes)
3. **Route Optimization**: Calculate optimal visiting order
4. **Time Management**: Set and freeze specific appointment times
5. **Listing Links**: Access Zillow/MLS listings from property cards during showings
6. **Export Options**: Client-friendly and detailed itineraries
7. **Google Maps Integration**: Directions and geocoding

### Authentication & Security
- WebAuthn passkey authentication
- Session management via Durable Objects
- Rate limiting on API endpoints
- Input validation with Zod
- Security headers and CORS protection

## RedwoodSDK Patterns Used

### Server Components (Default)
- `HomePage.tsx` - Main layout and data fetching
- `PropertyCard.tsx` - Property display logic
- `RouteSummary.tsx` - Statistics rendering

### Client Components ("use client")
- `PropertyInputBox.tsx` - Smart input with URL/address parsing
- `PropertyList.tsx` - Property list with edit/remove controls
- `PropertyListItem.tsx` - Individual property with swipe-to-delete
- `DurationSelector.tsx` - Interactive buttons
- `PropertyControls.tsx` - Form controls and state
- `CopyButtons.tsx` - Clipboard operations

### Server Functions ("use server")
- `calculateRoute.ts` - Business logic and optimization
- `geocoding.ts` - External API integration
- `export.ts` - Data transformation and export

### Interruptors (Middleware)
- `requireAuth` - Authentication check
- `rateLimit` - API rate limiting
- `validateRouteRequest` - Input validation
- `setSecurityHeaders` - Security headers

## Environment Variables

Required for full functionality:
```env
# Google Maps API key for geocoding and directions
GOOGLE_MAPS_API_KEY=your_api_key_here

# Database URL (auto-configured in Cloudflare)
DATABASE_URL=your_d1_database_url

# Session encryption key (auto-generated)
SESSION_SECRET=your_session_secret
```

## API Endpoints

### Route Calculator Routes
- `GET /route-calculator/` - Main calculator page
- `POST /route-calculator/calculate` - Calculate optimal route
- `POST /route-calculator/re-optimize` - Re-optimize existing route
- `POST /route-calculator/api/export/:format` - Export itinerary
- `GET /route-calculator/api/health` - Health check

### User Authentication Routes
- `GET /user/login` - Login page
- `POST /user/logout` - Logout action

## Google Maps Integration

### Setup Instructions
1. Create a Google Cloud Project
2. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Distance Matrix API
   - Directions API
3. Create an API key with appropriate restrictions
4. Add the API key to your environment variables

### API Usage
- **Geocoding**: Convert addresses to coordinates
- **Distance Matrix**: Calculate travel times between properties
- **Directions**: Generate optimized routes
- **Maps JavaScript API**: Display interactive maps (future enhancement)

## Deployment

### Cloudflare Setup
1. Configure `wrangler.jsonc` with your project name
2. Create D1 database: `npx wrangler d1 create route-calculator-db`
3. Add database ID to `wrangler.jsonc`
4. Set environment variables: `npx wrangler secret put GOOGLE_MAPS_API_KEY`
5. Deploy: `npm run deploy`

### Database Schema
The project uses Prisma with D1. Key models:
- `User` - User authentication and profiles
- Custom property and route models can be added as needed

## Development Notes

### Adding New Features
1. Follow RedwoodSDK colocation principles
2. Use server components by default
3. Add "use client" only when necessary
4. Create server functions for business logic
5. Add appropriate interruptors for security

### Testing Strategy
- Unit tests for server functions
- Integration tests for route calculations
- E2E tests for user workflows
- Mock Google Maps API for development

### Performance Considerations
- Server-first rendering for initial page loads
- Client hydration only for interactive components
- Efficient route optimization algorithms
- Caching for repeated geocoding requests

## Common Issues & Solutions

### TypeScript Errors
- Ensure all imports use correct paths
- Check that "use client" and "use server" directives are properly placed
- Verify Prisma client generation is up to date

### Route Calculation Issues
- Check Google Maps API key configuration
- Verify rate limiting isn't blocking requests
- Ensure proper error handling for failed geocoding

### Deployment Issues
- Confirm D1 database is properly configured
- Check that all environment variables are set
- Verify Cloudflare Workers limits aren't exceeded

### Cloudflare Workers - Cross-Request Promise Resolution
**CRITICAL**: All async operations (Prisma, API calls) MUST be awaited before returning from server components/functions. Unawaited promises cause "cross-request promise resolution" errors. Always `await` all DB queries and async operations.

## Interactive Primitives (`src/app/components/ui/`)

Interactive primitives MUST come from `src/app/components/ui/`. Never hand-roll Dialog, AlertDialog, Popover, Menu, Sheet, Select, Combobox, Tooltip, Switch, Checkbox, RadioGroup, Tabs.

- New primitive needed? Add a wrapper to `src/app/components/ui/` first (Base UI — `@base-ui/react`), then consume it. Feature composites (e.g. `ErrorModal`) stay in their feature dir and compose `ui/` primitives.
- Direct `@base-ui/react` imports are banned outside `src/app/components/ui/`.
- Phased migration plan + inventory: `UI_OVERHAUL_TODO.md`.

## Error Handling Patterns

### No Toasts
Toasts fail accessibility (https://primer.style/accessibility/toasts/):
- Missed by screen readers
- Disappear before read
- No keyboard interaction

### Error UI Hierarchy
1. **Critical errors (API failures, route calc)**: Modal/dialog
   - Blocks interaction until acknowledged
   - Retry button for recoverable errors
   - Clear, actionable messaging
   - ESC key and backdrop dismiss
   - See `ErrorModal.tsx` for reference implementation

2. **Inline validation (form inputs)**: Context error messages
   - Show near relevant input field
   - Auto-clear after timeout or dismissible
   - `role="alert"` for screen readers
   - `aria-describedby` linking error to input
   - See `PropertyInputBox.tsx` for pattern

3. **Success feedback**: Button state changes
   - Text changes ("COPIED!", "✓ DONE")
   - Disabled state during async processing
   - No separate notification needed
   - See `CopyButtons.tsx` for pattern

4. **Confirmations**: Browser `confirm()` or custom modal
   - For destructive actions (delete, clear all)
   - Explicit user consent required

### Implementation Requirements
- **Accessibility**: Focus management (trap + restore), ARIA attributes
- **No silent failures**: Always show errors to user
- **No fallback data**: Throw errors vs returning fake/estimated data
- **User control**: Retry options for transient failures

## Future Enhancements
- Interactive map display
- Calendar integration
- Real-time traffic data
- Advanced optimization algorithms
- Team sharing and collaboration features
- Mobile app companion

## Communication Style & Development Workflow
- Keep responses short and conversational
- Use dialog-style back and forth  
- Prefer small code snippets over long explanations
- Make incremental changes, not large code rewrites

## TODO Management for Context
- TODOs are kept directly in source files as comments
- Use TODOs to provide context for future sessions
- Scan files with `grep -r "TODO" src/addons/route-calculator/` to understand current work
- TODOs should be specific and actionable, not generic
- Update TODOs as work progresses to keep context fresh

## Contributing
When adding features, follow these guidelines:
1. Maintain colocation structure
2. Add proper TypeScript types
3. Include appropriate tests
4. Update documentation
5. Follow existing code patterns
