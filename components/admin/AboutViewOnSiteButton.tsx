'use client'
import React from 'react'
import { AdminViewOnSiteLink } from './AdminViewOnSiteLink'

export function AboutViewOnSiteButton() {
  // The About page is a single global at a fixed URL.
  return (
    <AdminViewOnSiteLink
      url="https://tynnellhollinsphotography.com/about"
      label="View About Page on Site"
    />
  )
}
