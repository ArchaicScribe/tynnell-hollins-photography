'use client'

import dynamic from 'next/dynamic'

// Lazy-load DownloadButton (TYN-289): it statically imports fflate's zipSync,
// which otherwise ships in every gallery page's initial bundle even when the
// gallery has downloads disabled. ssr:false + dynamic import keeps fflate out
// of the server render and out of the client bundle until this button
// actually mounts. Same pattern as app/builder/[slug]/EditorLoader.tsx.
const DownloadAllButton = dynamic(() => import('./DownloadButton').then((m) => m.DownloadAllButton), {
  ssr: false,
})

export { DownloadAllButton as DownloadAllButtonLoader }
