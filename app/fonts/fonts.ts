import localFont from 'next/font/local'

// Self-hosted replacements for next/font/google (branch 0000212).
//
// Why: next/font/google fetches every face from fonts.gstatic.com at BUILD
// time. With nine layouts pulling nine families, a single throttled response
// fails the whole build - which is exactly what happened to the qa deployment
// on 2026-08-10, when four branches built simultaneously and Cormorant
// Garamond got rate limited. Serving the woff2 files from the repo removes
// the network from the build path entirely.
//
// The files in ./google are the basic-latin subset only, which is exactly what
// subsets:['latin'] was already producing. 33 files, ~840 KB total.
// Regenerate with `node scripts/fetch-google-fonts.mjs` if a weight is added.
//
// NOTE: every src entry below is written out longhand on purpose. next/font
// requires explicitly written literals - a `w(file, weight)` helper or a shared
// `const POPPINS_ALL = [...]` array both fail the build with "Font loader
// values must be explicitly written literals." Do not refactor these into
// helpers.

export const tangerine = localFont({
  src: [
    { path: './google/tangerine-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './google/tangerine-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
})

export const abrilFatface = localFont({
  src: [{ path: './google/abril-fatface-400-normal.woff2', weight: '400', style: 'normal' }],
  variable: '--font-display-bold',
  display: 'swap',
})

// Two Poppins instances so heading and body each get their own CSS variable,
// matching the previous next/font/google arrangement.
export const poppinsHeading = localFont({
  src: [
    { path: './google/poppins-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './google/poppins-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './google/poppins-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './google/poppins-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './google/poppins-700-normal.woff2', weight: '700', style: 'normal' },
    { path: './google/poppins-800-normal.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-heading',
  display: 'swap',
})

export const poppinsBody = localFont({
  src: [
    { path: './google/poppins-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './google/poppins-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './google/poppins-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './google/poppins-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './google/poppins-700-normal.woff2', weight: '700', style: 'normal' },
    { path: './google/poppins-800-normal.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
})

// Rising Roots faces. NyghtSerif and Nostalgia (what the reference template
// actually uses) are commercially licensed and deliberately not shipped;
// Cormorant Garamond and Parisienne stand in. Barlow and Jost are exactly
// what the reference uses. Cormorant carries italics because the accent role
// is an italic serif.
export const cormorant = localFont({
  src: [
    { path: './google/cormorant-garamond-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './google/cormorant-garamond-300-italic.woff2', weight: '300', style: 'italic' },
    { path: './google/cormorant-garamond-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './google/cormorant-garamond-400-italic.woff2', weight: '400', style: 'italic' },
    { path: './google/cormorant-garamond-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './google/cormorant-garamond-500-italic.woff2', weight: '500', style: 'italic' },
    { path: './google/cormorant-garamond-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './google/cormorant-garamond-600-italic.woff2', weight: '600', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
})

export const barlow = localFont({
  src: [
    { path: './google/barlow-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './google/barlow-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './google/barlow-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './google/barlow-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})

export const jost = localFont({
  src: [
    { path: './google/jost-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './google/jost-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './google/jost-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-label',
  display: 'swap',
})

export const parisienne = localFont({
  src: [{ path: './google/parisienne-400-normal.woff2', weight: '400', style: 'normal' }],
  variable: '--font-script',
  display: 'swap',
})

// Studio / admin surfaces (studio, studio-manager, gallery-editor,
// photo-library, availability, builder, coming-soon).
//
// These deliberately reuse --font-heading and --font-body, matching what those
// layouts already did with next/font/google. Each is a separate root layout, so
// Archivo owning --font-heading there does not collide with Poppins owning it
// on the public site: a layout only ever applies its own font classNames.
export const archivo = localFont({
  src: [
    { path: './google/archivo-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './google/archivo-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './google/archivo-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './google/archivo-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-heading',
  display: 'swap',
})

export const robotoMono = localFont({
  src: [
    { path: './google/roboto-mono-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './google/roboto-mono-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './google/roboto-mono-400-italic.woff2', weight: '400', style: 'italic' },
    { path: './google/roboto-mono-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
})
