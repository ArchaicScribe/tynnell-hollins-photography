'use client'
import React from 'react'
import { GlobalEditHeader } from './GlobalEditHeader'

export function AvailabilityHeader() {
  return (
    <GlobalEditHeader
      icon="◷"
      title="Availability"
      description="Block out dates when you're unavailable. Clients requesting sessions during these windows see your custom message instead."
    />
  )
}
