import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Tynnell Hollins Photography'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0C0C0C',
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
        <div style={{ width: 60, height: 1, background: '#9B9A9A', opacity: 0.5 }} />

        {/* Name */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 400,
            color: '#D6D1CE',
            letterSpacing: '0.08em',
            fontFamily: 'serif',
          }}
        >
          Tynnell Hollins
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 400,
            color: '#9B9A9A',
            letterSpacing: '0.4em',
            fontFamily: 'sans-serif',
            textTransform: 'uppercase',
          }}
        >
          Photography
        </div>

        {/* Decorative bottom rule */}
        <div style={{ width: 60, height: 1, background: '#9B9A9A', opacity: 0.5, marginTop: 4 }} />
      </div>
    ),
    { ...size },
  )
}
