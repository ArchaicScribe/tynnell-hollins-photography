import { ImageResponse } from 'next/og'
import { getSiteDesign } from '@/app/lib/siteDesign'
import { getSiteConfig } from '@/app/lib/siteConfig'
import { splitBrand } from '@/app/lib/constants'

// No `runtime = 'edge'`. The Edge Runtime is deprecated in Next 16, and using
// it also cost this route static generation. On the default nodejs runtime it
// prerenders at build time like everything else.
//
// Dropping edge is also what makes the rest of this file possible: the palette
// and business name used to be hardcoded here, which meant every social share
// preview kept showing the old charcoal branding after the site moved to the
// Rising Roots bone/olive palette. Server-only helpers (they pull in payload)
// were unusable under the edge runtime; on nodejs they are not, so this now
// tracks SiteDesign and SiteConfig automatically. Both fall back to their
// defaults if the database is unreachable, so a DB hiccup degrades the image
// rather than failing the build.

export const alt = 'Tynnell Hollins Photography'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const [theme, site] = await Promise.all([getSiteDesign(), getSiteConfig()])
  const brand = splitBrand(site.title)

  return new ImageResponse(
    (
      <div
        style={{
          background: theme.colorBg,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        {/* Decorative top rule */}
        <div style={{ width: 60, height: 1, background: theme.colorDetail, opacity: 0.5 }} />

        {/* Name */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 400,
            color: theme.colorHeading,
            letterSpacing: '0.08em',
            fontFamily: 'serif',
          }}
        >
          {brand.mark}
        </div>

        {/* Wordmark */}
        {brand.sub && (
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: theme.colorDetail,
              letterSpacing: '0.4em',
              fontFamily: 'sans-serif',
              textTransform: 'uppercase',
            }}
          >
            {brand.sub}
          </div>
        )}

        {/* Decorative bottom rule */}
        <div style={{ width: 60, height: 1, background: theme.colorDetail, opacity: 0.5, marginTop: 4 }} />
      </div>
    ),
    { ...size },
  )
}
