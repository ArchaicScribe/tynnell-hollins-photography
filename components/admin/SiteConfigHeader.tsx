'use client'
import React from 'react'
import { GlobalEditHeader } from './GlobalEditHeader'

export function SiteConfigHeader() {
  return (
    <GlobalEditHeader
      icon="⚙"
      title="Site Settings"
      description="Your business name, contact info, and social media links - shown across your site's header, footer, and contact page."
    />
  )
}
