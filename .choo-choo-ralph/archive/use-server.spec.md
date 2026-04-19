---
title: "Migrate use server to serverQuery/serverAction"
created: 2026-04-11
poured:
  - routefast-bzo
  - routefast-3ie
  - routefast-0e9
  - routefast-wue
  - routefast-9rg
  - routefast-1nb
  - routefast-egx
iteration: 1
auto_discovery: false
auto_learnings: false
---
<project_specification>
<project_name>Migrate use server to serverQuery/serverAction</project_name>

  <overview>
    rwsdk 1.0.8 changed how "use server" functions work: plain exports default to POST (serverAction) 
    which triggers full RSC page tree re-render after every call. Read-only functions should use 
    serverQuery (GET, data-only response) to avoid unnecessary re-renders and RSC stream corruption 
    under concurrent D1 load. Also split mixed query/mutation files per rwsdk convention.
  </overview>

  <context>
    <existing_patterns>
      - All server function files use file-level "use server" directive (never per-function)
      - All exports are named async function declarations: `export async function foo()`
      - All files importing rwsdk use: `import { requestInfo } from 'rwsdk/worker'`
      - Context accessed via `const { ctx } = requestInfo` or `const { request, response } = requestInfo`
      - No files currently use serverQuery or serverAction
    </existing_patterns>
    <integration_points>
      - serverQuery/serverAction imported from 'rwsdk/worker' (confirmed in node_modules/rwsdk/dist/runtime/server.d.ts)
      - Signature: `serverQuery(async (...args) => result)` or `serverQuery([interruptor1, interruptor2], async (...args) => result)`
      - serverQuery defaults to GET, returns data-only (no page rehydration)
      - serverAction defaults to POST, triggers full RSC re-render
      - "use server" directive must remain at file level — serverQuery/serverAction wraps the export
      - routePersistence.ts mixes queries (getRoutes) and mutations (saveRoute, deleteRoute) — needs split
    </integration_points>
    <new_technologies>
      - No new tech — serverQuery/serverAction already available in installed rwsdk 1.0.8
    </new_technologies>
    <conventions>
      - rwsdk recommends queries.ts for read-only, actions.ts for mutations
      - After wrapping: `export const fn = serverQuery(async () => { ... })` (arrow fn in const)
      - Helper functions (not exported to client) stay as regular functions, no wrapping needed
    </conventions>
  </context>

  <tasks>
    <task id="split-route-persistence" priority="1" category="infrastructure">
      <title>Split routePersistence.ts into routeQueries.ts + routeActions.ts</title>
      <description>
        routePersistence.ts mixes getRoutes (query) with saveRoute/deleteRoute (mutations).
        Split into two files per rwsdk convention, wrap with serverQuery/serverAction, 
        update all imports.
      </description>
      <steps>
        - Create src/addons/route-calculator/server-functions/routeQueries.ts
          - Move getRoutes(), wrap with serverQuery
          - Import serverQuery from 'rwsdk/worker'
          - Keep "use server" directive
        - Create src/addons/route-calculator/server-functions/routeActions.ts
          - Move saveRoute() and deleteRoute(), wrap with serverAction
          - Import serverAction from 'rwsdk/worker'
          - Keep "use server" directive
        - Delete routePersistence.ts
        - Update imports in hooks/useRoutePersistence.ts: getRoutes from routeQueries, saveRoute/deleteRoute from routeActions
        - Update imports in pages/HomePageWrapper.tsx: getRoutes from routeQueries
      </steps>
      <test_steps>
        1. pnpm run types — no type errors
        2. pnpm run dev — dev server starts
        3. Grep for any remaining imports from routePersistence — should find none
      </test_steps>
      <review></review>
    </task>

    <task id="wrap-route-calc-queries" priority="1" category="functional">
      <title>Wrap route-calculator query functions with serverQuery</title>
      <description>
        Wrap read-only server functions in src/addons/route-calculator/server-functions/ 
        with serverQuery. These are called on mount or user action and should NOT trigger 
        full page re-renders.
      </description>
      <steps>
        - getUserCredits.ts: wrap getUserCredits with serverQuery, change from function declaration to const arrow
        - fetchOgImage.ts: wrap fetchOgImage with serverQuery, change from function declaration to const arrow
        - geocoding.ts: wrap geocodeAddresses and calculateDistanceMatrix with serverQuery (note: only called server-to-server from calculateRoute, but wrapping for explicitness)
        - export.ts: wrap exportItinerary with serverQuery; leave generateClientItinerary, generateDetailedItinerary, generateICalendar as plain exports (helpers, not server functions)
        - All files: add `import { serverQuery } from 'rwsdk/worker'` (extend existing rwsdk/worker import where present)
        - All files: keep "use server" directive at file level
      </steps>
      <test_steps>
        1. pnpm run types — no type errors
        2. pnpm run dev — dev server starts
        3. Test route calculator page loads (getUserCredits called on mount)
        4. Test adding a property URL (fetchOgImage called)
      </test_steps>
      <review></review>
    </task>

    <task id="wrap-route-calc-actions" priority="1" category="functional">
      <title>Wrap route-calculator action functions with serverAction</title>
      <description>
        Wrap mutation server functions in src/addons/route-calculator/server-functions/ 
        with serverAction. These modify data and should trigger re-renders.
      </description>
      <steps>
        - calculateRoute.ts: wrap calculateRoute with serverAction, change from function declaration to const arrow
          - Keep internal helper functions (consumeCredit, optimizeRoute, nearestNeighborTSP, etc.) as regular functions — they are NOT exported to client
        - Add `import { serverAction } from 'rwsdk/worker'` (extend existing rwsdk/worker import)
        - Keep "use server" directive at file level
      </steps>
      <test_steps>
        1. pnpm run types — no type errors
        2. pnpm run dev — dev server starts
        3. Test calculating a route (triggers calculateRoute action)
      </test_steps>
      <review></review>
    </task>

    <task id="wrap-auth-actions" priority="1" category="functional">
      <title>Wrap user auth functions with serverAction</title>
      <description>
        Wrap all auth server functions in src/app/pages/user/functions.ts with serverAction.
        All 6 functions are mutations (create users, save sessions, update counters).
      </description>
      <steps>
        - functions.ts: wrap all 6 exported functions with serverAction:
          - startPasskeyRegistration
          - startPasskeyLogin
          - finishPasskeyRegistration
          - finishPasskeyLogin
          - signupWithPassword
          - loginWithPassword
        - Keep getWebAuthnConfig as regular function (private helper, not exported)
        - Add `import { serverAction } from 'rwsdk/worker'` (extend existing rwsdk/worker import)
        - Keep "use server" directive at file level
      </steps>
      <test_steps>
        1. pnpm run types — no type errors
        2. pnpm run dev — dev server starts
        3. Test login flow (password and/or passkey)
        4. Test signup flow
      </test_steps>
      <review></review>
    </task>

    <task id="wrap-password-reset-actions" priority="1" category="functional">
      <title>Wrap password reset functions with serverAction</title>
      <description>
        Wrap both server functions in src/app/pages/user/passwordReset.ts with serverAction.
        Both are mutations (create tokens, send emails, update passwords).
      </description>
      <steps>
        - passwordReset.ts: wrap both exported functions with serverAction:
          - requestPasswordReset
          - resetPassword
        - Keep generateResetToken as regular function (private helper)
        - Add `import { serverAction } from 'rwsdk/worker'`
        - Keep "use server" directive at file level
      </steps>
      <test_steps>
        1. pnpm run types — no type errors
        2. pnpm run dev — dev server starts
        3. Test forgot password flow if accessible
      </test_steps>
      <review></review>
    </task>

    <task id="wrap-subscription-actions" priority="1" category="functional">
      <title>Wrap subscription functions with serverAction</title>
      <description>
        Wrap all 3 subscription server functions with serverAction.
        All are mutations (create Stripe sessions/subscriptions, update user records).
      </description>
      <steps>
        - createCheckoutSession.ts: wrap createCheckoutSession with serverAction
          - Keep isValidReturnUrl as regular function (private helper)
          - Add `import { serverAction } from 'rwsdk/worker'` (extend existing rwsdk/worker import)
        - createSubscription.ts: wrap createSubscription with serverAction
          - Add `import { serverAction } from 'rwsdk/worker'` (extend existing rwsdk/worker import)
        - createPortalSession.ts: wrap createPortalSession with serverAction
          - Add `import { serverAction } from 'rwsdk/worker'` (extend existing rwsdk/worker import)
        - Keep "use server" directive at file level in all files
      </steps>
      <test_steps>
        1. pnpm run types — no type errors
        2. pnpm run dev — dev server starts
        3. Test subscription page loads without errors
      </test_steps>
      <review></review>
    </task>

    <task id="verify-migration" priority="2" category="functional">
      <title>Full verification pass</title>
      <description>
        Run type check, start dev server, and verify network behavior 
        shows GET for queries and POST for actions.
      </description>
      <steps>
        - pnpm run types — verify no type errors across entire project
        - pnpm run dev — verify dev server starts cleanly
        - Open route calculator in browser, check Network tab:
          - getUserCredits should be GET
          - getRoutes should be GET
          - fetchOgImage should be GET
          - calculateRoute should be POST
          - saveRoute should be POST
          - deleteRoute should be POST
        - Test login/signup — verify auth functions are POST
        - Grep for any remaining bare "export async function" in server function files (should find none except helpers)
      </steps>
      <test_steps>
        1. pnpm run types passes
        2. pnpm run dev starts without errors
        3. Route calculator page loads and functions correctly
        4. Login/signup works
        5. Network tab confirms GET for queries, POST for actions
      </test_steps>
      <review></review>
    </task>
  </tasks>

  <success_criteria>
    - All server functions wrapped with serverQuery or serverAction
    - routePersistence.ts split into routeQueries.ts + routeActions.ts
    - No type errors (pnpm run types)
    - Dev server starts cleanly
    - Read-only functions use GET (no unnecessary re-renders)
    - Mutation functions use POST (trigger re-renders as expected)
  </success_criteria>
</project_specification>
