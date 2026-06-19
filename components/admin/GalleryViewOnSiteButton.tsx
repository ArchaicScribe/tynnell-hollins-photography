'use client'
import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { AdminViewOnSiteLink } from './AdminViewOnSiteLink'

export function GalleryViewOnSiteButton() {
  const { id } = useDocumentInfo()
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)

  // Only show after the gallery is saved. The slug field is pre-populated from
  // the title on the create form, so checking slug alone shows the button on
  // unsaved docs where no public page exists yet.
  if (!id || !slug) return null

  return (
    <AdminViewOnSiteLink
      url={`https://tynnellhollinsphotography.com/portfolio/${slug}`}
      label="View Gallery on Site"
    />
  )
}
