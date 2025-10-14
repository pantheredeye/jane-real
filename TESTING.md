# Multi-Tenant Foundation - Testing Checklist

## Test Environment
- Dev server: http://localhost:5174/
- Test users available in D1 database (seeded)

## Test Data
- **Jane Smith** (OWNER) - jane@example.com
- **Bob Assistant** (MEMBER) - bob@example.com
- **Sarah Client** (GUEST) - sarah@example.com
- **Tenant**: Jane Smith Realty (slug: jane-smith-realty)
- **Sample Route**: Downtown Showings - March 15

## Test Cases

### ✅ Phase 1-3: Foundation Tests

#### 1. Database & Schema
- [x] Prisma schema includes all multi-tenant models
- [x] Migration applied successfully to D1
- [x] Seed data created successfully
- [x] Tenant isolation middleware created
- [x] TypeScript compilation passes

#### 2. Route Protection (Interruptors)
- [x] Accessing `/route/` without login → redirects to `/user/login` ✅
- [ ] Accessing `/route/` without tenant → redirects to `/tenant/setup` (requires logged-in user first)
- [x] Accessing `/route/api/export/csv` without auth → redirects to `/user/login` ✅
- [x] Health check `/route/api/health` → accessible without auth ✅

#### 3. Session & Context
- [ ] Login creates session with userId
- [ ] Session includes tenantId and membershipId (when available)
- [ ] Middleware loads user, tenant, and membership into context
- [ ] Context available in server components

#### 4. Known Gaps (Expected to NOT work yet)
- [ ] ❌ Login doesn't set tenantId/membershipId in session (Phase 4 TODO)
- [ ] ❌ Routes are not persisted to database (Phase 4 TODO)
- [ ] ❌ No tenant signup flow (Phase 5 TODO)
- [ ] ❌ No invite system (Phase 5 TODO)

## Manual Testing Steps

### Test 1: Unauthenticated Access
1. Open browser to http://localhost:5174/route/
2. **Expected**: Redirect to /user/login (requireAuth interruptor)
3. **Status**:

### Test 2: Health Check (Public Route)
1. Open browser to http://localhost:5174/route/api/health
2. **Expected**: JSON response with status and timestamp
3. **Status**:

### Test 3: Authentication Flow
1. Go to /user/login
2. Login or register (WebAuthn)
3. **Expected**: Login succeeds, session created
4. Go to /route/
5. **Expected**: Currently will redirect to /tenant/setup (no tenantId in session yet)
6. **Status**:

### Test 4: Database Queries
```bash
# Check users and memberships
pnpm wrangler d1 execute jane-real-prior-crayfish --local \
  --command="SELECT u.name, t.name as tenant, tm.role FROM User u
             JOIN TenantMembership tm ON u.id = tm.userId
             JOIN Tenant t ON tm.tenantId = t.id"

# Check routes
pnpm wrangler d1 execute jane-real-prior-crayfish --local \
  --command="SELECT * FROM Route"
```

## Next Steps
Once foundation is verified:
1. **Phase 4**: Add tenant selection on login (set tenantId in session)
2. **Phase 5**: Implement route persistence to database
3. **Phase 6**: Create tenant signup flow
