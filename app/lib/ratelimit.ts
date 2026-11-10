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

// 3 submissions per IP per hour - coming-soon inquiry form
export const comingSoonRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:coming-soon',
})

// 3 signups per IP per hour - email signup / freebie form. Low on purpose:
// the freebie sends an email to whatever address is typed in.
export const subscribeRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:subscribe',
})

// 1 freebie email per recipient address per day, however many IPs ask.
// Keyed on a hash of the address (never the address itself). Stops the
// freebie being used to flood one inbox from a pool of IPs.
export const freebieRecipientRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(1, '24 h'),
  prefix: 'rl:freebie-to',
})

// 10 per IP per hour - starting (or picking back up) a client favorites
// list (TYN-13). Each new email creates a row Tynnell sees in her editor.
export const favoritesStartRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:favorites-start',
})

// 5 per IP per hour - "Send to Tynnell". Every send is an email to her.
export const favoritesSendRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'rl:favorites-send',
})

// 6 sends per favorites list per hour, however many IPs ask. Unlike the
// limiter above this one is checked directly rather than through safeLimit,
// so it fails closed: if Redis cannot be reached, no email goes out.
export const favoritesListSendRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(6, '1 h'),
  prefix: 'rl:favorites-send-list',
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

/**
 * Calls limiter.limit() and returns { success: true } if Redis is
 * unreachable rather than crashing the route handler. This keeps
 * forms functional when Upstash has a connectivity issue.
 */
export async function safeLimit(
  limiter: Ratelimit,
  identifier: string,
): Promise<{ success: boolean }> {
  try {
    return await limiter.limit(identifier)
  } catch (e) {
    console.error('[ratelimit] Redis unreachable, failing open:', e)
    return { success: true }
  }
}
