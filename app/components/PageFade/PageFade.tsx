'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

// Step 5, item 9: page-to-page fade. The layout (nav, footer) never remounts, so
// only the page area here fades. Keying on the full pathname remounts the page on
// every route change; a template.tsx would not, because it only remounts when its
// own (first) path segment changes, so /blog to /blog/a-post would not fade.
//
// The first page load must not fade: the server HTML would be hidden until the
// animation started. So a page fades only if the first one has already loaded in
// this browser tab. `loaded` is module state: false on the server and while the
// first page hydrates, true afterwards.
let loaded = false

function Page({ children }: { children: ReactNode }) {
  // Read once, when this page instance is created (a navigation is client-only,
  // so there is no server markup to disagree with).
  const [fade] = useState(() => loaded)
  useEffect(() => {
    loaded = true
  }, [])
  return <div className={fade ? 'pageFadeIn' : undefined}>{children}</div>
}

export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return <Page key={pathname}>{children}</Page>
}
