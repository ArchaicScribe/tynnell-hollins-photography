'use client'
import React from 'react'
import { GlobalEditHeader } from './GlobalEditHeader'

export function BookingSettingsHeader() {
  return (
    <GlobalEditHeader
      icon="▤"
      title="Booking Settings"
      description="Controls how far in advance clients can request sessions on your Book page. Changes take effect immediately."
      viewOnSiteUrl="https://tynnellhollinsphotography.com/book"
      viewOnSiteLabel="View Book Page on Site"
    />
  )
}
