import { withPayload } from '@payloadcms/next/withPayload'

// A per-request nonce would let script-src drop 'unsafe-inline', but that
// requires every root layout to call headers() to read it - which forces
// Next.js to opt those routes out of static rendering entirely. This app
// deliberately relies on ISR (TYN-290) for the homepage, about, blog, and
// portfolio index, so a static CSP header is the right tradeoff here:
// 'unsafe-inline' on script-src and style-src, but everything else scoped
// tightly (no eval, no third-party frames/plugins, no unlisted image/font
// hosts). style-src needs 'unsafe-inline' regardless of the nonce question -
// nonces only cover <style> elements/links, not the style={{}} props used
// throughout the admin UI.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `img-src 'self' data: https://pub-db2dd9a6665142e4adcd4f822fbe2683.r2.dev https://media.tynnellhollinsphotography.com`,
  // R2 uploads PUT directly from the browser to a presigned URL on Cloudflare's
  // S3-compatible endpoint (app/lib/uploadPhoto.ts) - without this, every photo
  // upload sitewide (Photo Library, galleries, blog covers, builder/Design
  // image pickers) is silently blocked by the browser as a CSP violation.
  `connect-src 'self' https://va.vercel-scripts.com https://c5edbede1b4e1c8723a363615b47bb4c.r2.cloudflarestorage.com`,
  // Puck builder Map block (TYN-333) embeds a plain Google Maps iframe
  // (maps?...&output=embed) - no API key needed, but the iframe's own origin
  // must be allow-listed here or the browser silently blocks the embed.
  `frame-src 'self' https://www.google.com`,
  `frame-ancestors 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['swiper'],
  },
  images: {
    // Photos are served from Cloudflare R2. next/image rejects any remote host
    // not listed here. This block was lost when Sanity (cdn.sanity.io) was
    // removed and must cover the R2 host that now serves every image.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-db2dd9a6665142e4adcd4f822fbe2683.r2.dev',
      },
      {
        // Pending R2 custom-domain cutover (TYN-144) - allow it now so the
        // migration does not reintroduce the "unconfigured host" break.
        protocol: 'https',
        hostname: 'media.tynnellhollinsphotography.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin/collections/galleries',
        destination: '/gallery-editor',
        permanent: false,
      },
      {
        source: '/admin/collections/galleries/create',
        destination: '/gallery-editor',
        permanent: false,
      },
      {
        source: '/admin/collections/galleries/:id',
        destination: '/gallery-editor/:id',
        permanent: false,
      },
      {
        source: '/admin/globals/site-config',
        destination: '/site-settings',
        permanent: false,
      },
      {
        source: '/admin/globals/gallery-presets',
        destination: '/site-settings',
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ]
  },
};

export default withPayload(nextConfig)
