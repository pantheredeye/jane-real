-- Usage Analytics Queries
-- Run these against your D1 database for insights into route calculation usage

-- Monthly calculation attempts (all users)
-- Shows total route calculations in the last 30 days
SELECT COUNT(*) as total_calculations
FROM UsageLog
WHERE action = 'route_calculate'
AND createdAt >= date('now', '-1 month');

-- Blocked attempts (conversion opportunity)
-- Users hitting the paywall - potential subscribers
SELECT COUNT(*) as blocked_attempts
FROM UsageLog
WHERE action = 'route_calculate'
AND json_extract(metadata, '$.blocked') = true;

-- Usage by subscription tier
-- Breakdown of who's using the service
SELECT
  json_extract(metadata, '$.subscriptionStatus') as subscription_status,
  COUNT(*) as attempts,
  COUNT(DISTINCT userId) as unique_users
FROM UsageLog
WHERE action = 'route_calculate'
GROUP BY json_extract(metadata, '$.subscriptionStatus')
ORDER BY attempts DESC;

-- Daily calculation trend (last 30 days)
SELECT
  date(createdAt) as date,
  COUNT(*) as calculations,
  COUNT(DISTINCT userId) as active_users
FROM UsageLog
WHERE action = 'route_calculate'
AND createdAt >= date('now', '-1 month')
GROUP BY date(createdAt)
ORDER BY date DESC;

-- Average properties per route
SELECT
  AVG(propertyCount) as avg_properties,
  MIN(propertyCount) as min_properties,
  MAX(propertyCount) as max_properties
FROM UsageLog
WHERE action = 'route_calculate'
AND propertyCount IS NOT NULL;

-- Heavy users (top 10 by route calculations)
SELECT
  userId,
  COUNT(*) as total_routes,
  SUM(creditsUsed) as total_credits_used,
  MAX(createdAt) as last_calculation
FROM UsageLog
WHERE action = 'route_calculate'
GROUP BY userId
ORDER BY total_routes DESC
LIMIT 10;

-- Conversion funnel: blocked users who might subscribe
SELECT
  u.email,
  u.subscriptionStatus,
  COUNT(*) as blocked_attempts,
  MAX(ul.createdAt) as last_blocked
FROM UsageLog ul
JOIN User u ON ul.userId = u.id
WHERE ul.action = 'route_calculate'
AND json_extract(ul.metadata, '$.blocked') = true
GROUP BY u.id, u.email, u.subscriptionStatus
ORDER BY blocked_attempts DESC;

-- Usage patterns by start location type
SELECT
  json_extract(metadata, '$.startLocationType') as start_location_type,
  COUNT(*) as attempts
FROM UsageLog
WHERE action = 'route_calculate'
GROUP BY json_extract(metadata, '$.startLocationType')
ORDER BY attempts DESC;

-- Weekly cohort analysis
SELECT
  strftime('%Y-W%W', createdAt) as week,
  COUNT(*) as calculations,
  COUNT(DISTINCT userId) as active_users,
  SUM(CASE WHEN json_extract(metadata, '$.blocked') = true THEN 1 ELSE 0 END) as blocked
FROM UsageLog
WHERE action = 'route_calculate'
GROUP BY strftime('%Y-W%W', createdAt)
ORDER BY week DESC
LIMIT 12;
