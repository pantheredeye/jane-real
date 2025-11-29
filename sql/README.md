# SQL Analytics Queries

Analytics queries for monitoring usage, conversions, and user behavior.

## Running Queries

### Local Development (D1)
```bash
# Run against local D1 database
pnpm wrangler d1 execute route-calculator-db --local --file=sql/usage-analytics.sql

# Or run individual queries
pnpm wrangler d1 execute route-calculator-db --local --command="SELECT COUNT(*) FROM UsageLog WHERE action = 'route_calculate'"
```

### Production
```bash
# Run against production D1 database
pnpm wrangler d1 execute route-calculator-db --file=sql/usage-analytics.sql

# Or specify environment
CLOUDFLARE_ENV=production pnpm wrangler d1 execute route-calculator-db --file=sql/usage-analytics.sql
```

## Available Query Files

- **usage-analytics.sql** - Route calculation usage, conversion funnel, user cohorts

## Adding New Queries

Create new `.sql` files in this directory following the same pattern:
- Comment each query with description
- Use meaningful query names
- Include examples of insights you can derive
