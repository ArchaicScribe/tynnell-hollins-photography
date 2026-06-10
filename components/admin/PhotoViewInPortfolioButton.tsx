'use client'
import React from 'react'
import { useFormFields } from '@payloadcms/ui'
import { AdminViewOnSiteLink } from './AdminViewOnSiteLink'

// A photo has no page of its own. It surfaces in the /portfolio masonry,
// filtered by category. The portfolio grid reads ?category=<value>, so we
// deep-link straight to the matching tab.
export function PhotoViewInPortfolioButton() {
  const category = useFormFields(([fields]) => fields.category?.value as string | undefined)

  const base = 'https://tynnellhollinsphotography.com/portfolio'
  const url = category ? `${base}?category=${category}` : base

  let note: string | undefined
  if (!category) {
    note = 'Set a category to control where this photo appears in your portfolio.'
  } else if (category === 'weddings') {
    // The Weddings tab shows album cards only, not the individual-photo grid.
    note = 'Wedding photos appear inside their gallery album, not the main grid.'
  }

  return <AdminViewOnSiteLink url={url} label="View in Portfolio" note={note} />
}
