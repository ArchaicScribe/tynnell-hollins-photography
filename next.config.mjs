import { withPayload } from '@payloadcms/next/withPayload'

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
        ],
      },
    ]
  },
};

export default withPayload(nextConfig)
