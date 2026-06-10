'use client'
import React from 'react'
import { useFormFields } from '@payloadcms/ui'
import { AdminViewOnSiteLink } from './AdminViewOnSiteLink'

export function GalleryViewOnSiteButton() {
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)

  // No public page exists until the gallery is saved and has a slug.
  if (!slug) return null

  return (
    <AdminViewOnSiteLink
      url={`https://tynnellhollinsphotography.com/portfolio/${slug}`}
      label="View Gallery on Site"
    />
  )
}
