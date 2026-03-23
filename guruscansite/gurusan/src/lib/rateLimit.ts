/**
 * Simple in-memory rate limiter.
 * Tracks attempts per key (IP) with a sliding window.
 */
const store = new Map<string, { count: number; resetAt: number }>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export function rateLimit(key: string, maxAttempts: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: maxAttempts - 1 }
  }

  entry.count++
  if (entry.count > maxAttempts) {
    return { ok: false, remaining: 0 }
  }

  return { ok: true, remaining: maxAttempts - entry.count }
}

export function getClientIp(req: Request): string {
  // Behind Cloudflare, the real IP is in CF-Connecting-IP
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}
