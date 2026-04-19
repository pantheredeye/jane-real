/**
 * Simple in-memory rate limiter for Cloudflare Workers.
 *
 * Per-isolate only — doesn't survive Worker restarts or span multiple
 * isolates, but still meaningful protection against brute force within
 * a single instance's lifetime.
 */

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Periodic cleanup to prevent unbounded memory growth
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 60_000 // 1 minute

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}

export function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  cleanup()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  entry.count++
  return entry.count > maxAttempts
}

export function getClientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || 'unknown'
}

type RateLimitConfig = {
  maxAttempts: number
  windowMs: number
  keyPrefix: string
}

/**
 * Creates a rate-limiting interruptor.
 * Returns 429 when limit is exceeded.
 */
export function rateLimit(config: RateLimitConfig) {
  return async function rateLimitInterruptor({ request }: { request: Request }) {
    const ip = getClientIp(request)
    const key = `${config.keyPrefix}:${ip}`

    if (isRateLimited(key, config.maxAttempts, config.windowMs)) {
      return Response.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
  }
}

// Pre-configured rate limiters for common endpoints
export const loginRateLimit = rateLimit({
  keyPrefix: 'login',
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
})

export const signupRateLimit = rateLimit({
  keyPrefix: 'signup',
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
})

export const passwordResetRateLimit = rateLimit({
  keyPrefix: 'pw-reset',
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
})

export const apiRateLimit = rateLimit({
  keyPrefix: 'api',
  maxAttempts: 60,
  windowMs: 60 * 1000, // 1 minute
})
