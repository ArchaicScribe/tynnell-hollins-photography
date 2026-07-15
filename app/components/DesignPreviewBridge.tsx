'use client'

import { useEffect } from 'react'

// Real-time live-preview listener for the /design editor (TYN-314). Mounted
// unconditionally in the (site) root layout, but self-gates so it is a
// complete no-op for every real visitor: it only ever does anything when the
// page is loaded with the ?__designPreview=1 query param AND is either (a)
// running inside an iframe (the editor's built-in preview pane) or (b) a
// popped-out tab opened via the editor's "Preview" button (window.opener
// set). Real top-level page loads never match either condition.
//
// On receiving a same-origin postMessage of draft (unsaved) theme values from
// the /design page, it applies them directly as CSS custom-property
// overrides on the document root - purely visual, nothing is persisted here.
export function DesignPreviewBridge() {
  useEffect(() => {
    const isPreviewFrame = window.self !== window.top
    const isPreviewPopup = window.opener != null
    if (!isPreviewFrame && !isPreviewPopup) return
    if (new URLSearchParams(window.location.search).get('__designPreview') !== '1') return

    const target = isPreviewFrame ? window.parent : (window.opener as Window)

    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; vars?: Record<string, string>; animationsEnabled?: boolean } | undefined
      if (!data || data.type !== 'THP_DESIGN_PREVIEW') return
      if (data.vars) {
        for (const [key, value] of Object.entries(data.vars)) {
          document.documentElement.style.setProperty(key, value)
        }
      }
      if (typeof data.animationsEnabled === 'boolean') {
        if (data.animationsEnabled) document.documentElement.removeAttribute('data-animations')
        else document.documentElement.setAttribute('data-animations', 'off')
      }
    }

    window.addEventListener('message', handleMessage)
    // Tell the opener/parent we're ready so it can send the current draft
    // state immediately after a (re)load, not just on the next edit.
    target.postMessage({ type: 'THP_DESIGN_PREVIEW_READY' }, window.location.origin)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return null
}
