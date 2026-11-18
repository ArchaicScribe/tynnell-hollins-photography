// Wedding photography and Portraits became their own pages. The old gallery
// category addresses redirect to them permanently so old links and search
// results keep working. Exact paths only: no wildcards, so a real album such as
// /portfolio/some-album is never caught. Family is a session on the Portraits
// page now, so it goes there too.
//
// A .mjs file (not .ts) because next.config.mjs imports it and Node loads the
// config without a TypeScript step.

/** @type {{ source: string, destination: string, permanent: true }[]} */
export const legacyRedirects = [
  { source: '/portfolio/weddings', destination: '/wedding-photography', permanent: true },
  { source: '/portfolio/portraits', destination: '/portraits', permanent: true },
  { source: '/portfolio/family', destination: '/portraits', permanent: true },
]
