# Real Estate Route Calculator - RedwoodSDK Project

## Project Overview
This is a RedwoodSDK application featuring a real estate route calculator that helps agents optimize their property showing schedules. The project follows RedwoodSDK's full-stack colocation architecture and React Server Components (RSC) patterns.

## Architecture

### Tech Stack
- **Framework**: RedwoodSDK 0.1.35
- **Runtime**: Cloudflare Workers
- **Database**: Prisma with D1 (SQLite)
- **Authentication**: WebAuthn (Passkeys)
- **Session Management**: Durable Objects
- **Frontend**: React Server Components + Client Components
- **Styling**: CSS with Glassmorphism design system
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
│   │   ├── Toast.tsx                # "use client" - Toast notifications
│   │   ├── DurationSelector.tsx     # "use client" - State management
│   │   ├── PropertyCard.tsx         # "use client" - Display with listing link
│   │   ├── PropertyControls.tsx     # "use client" - Form controls
│   │   ├── RouteSummary.tsx         # Server Component - Statistics
│   │   ├── CopyButtons.tsx          # "use client" - Clipboard
│   │   └── [DEPRECATED] AddressInput.tsx  # Being replaced by PropertyInputBox
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

# Database operations
pnpm run db:generate    # Generate Prisma client
pnpm run db:push       # Push schema to database
pnpm run db:studio     # Open Prisma Studio
```

### TypeScript & Linting
```bash
pnpm run typecheck     # Check TypeScript types
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