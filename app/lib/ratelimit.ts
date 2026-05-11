import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// 5 submissions per IP per hour - contact form
export const contactRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'rl:contact',
})

// 10 checkout attempts per IP per hour
export const checkoutRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:checkout',
})

/**
 * Extracts the real client IP from the request headers.
 * x-forwarded-for is set by Vercel's edge network.
 * Falls back to a generic key so rate limiting still works
 * even if the header is missing.
 */
export function getClientIp(request: Request): string {
  const forwarded = (request.headers as Headers).get('x-forwarded-for')
  return forwarded?.split(',')[0].trim() ?? 'unknown'
}
