import type { ResolveProductionUrlContext } from 'sanity'

/**
 * Resolves the live site URL for any document that has a corresponding public page.
 * Used by Sanity Studio to render the "View on site" external link icon in the
 * document toolbar, giving Tynnell a one-click way to verify her changes.
 *
 * The base URL is derived from window.location.origin so the link opens
 * the correct environment automatically:
 *   - Local dev  → http://localhost:3000/...
 *   - Production → https://tynnellhollinsphotography.com/...
 *
 * Returns undefined for document types with no public page, which hides the button.
 */
export async function resolveProductionUrl(
  _prev: string | undefined,
  context: ResolveProductionUrlContext
): Promise<string | undefined> {
  const { document } = context

  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://tynnellhollinsphotography.com'

  // Helper to safely read a Sanity slug field
  const slug = (document.slug as { current?: string } | undefined)?.current

  switch (document._type) {
    // ── Per-document pages ─────────────────────────────────────────
    case 'post':
      return slug ? `${base}/blog/${slug}` : undefined

    case 'gallery':
      // Link directly to the gallery detail page if it has a slug;
      // fall back to the portfolio index so the button is always shown.
      return slug ? `${base}/portfolio/${slug}` : `${base}/portfolio`

    case 'page':
      return slug ? `${base}/${slug}` : undefined

    // ── Singleton / section pages ──────────────────────────────────
    case 'aboutPage':
      return `${base}/about`

    case 'service':
      return `${base}/services`

    case 'siteConfig':
      return `${base}/`

    // ── Homepage sections (slides, testimonials, photos) ──────────
    case 'heroSlide':
    case 'testimonial':
    case 'photo':
      return `${base}/`

    default:
      return undefined
  }
}
