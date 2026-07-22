import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { computeBookingDateBounds } from '@/app/lib/validation'

// Public, read-only booking-date bounds for the builder's ContactFormBlock
// (app/builder/puck.config.tsx) - the same min/max the hardcoded /contact
// page computes from BookingSettings, exposed so the block's resolveData
// can fetch it client-side too (in the editor's live preview, resolveData
// runs in the browser, where getPayload() can't run). Only ever returns two
// date strings, not the BookingSettings document itself.
export async function GET() {
  try {
    const payload = await getPayload({ config })
    const bookingSettings = await payload.findGlobal({ slug: 'booking-settings' }).catch(() => null)
    const minLeadTimeHours = typeof bookingSettings?.minLeadTimeHours === 'number' ? bookingSettings.minLeadTimeHours : undefined
    const maxBookingMonths = typeof bookingSettings?.maxBookingMonths === 'number' ? bookingSettings.maxBookingMonths : undefined
    return NextResponse.json(computeBookingDateBounds({ minLeadTimeHours, maxBookingMonths }))
  } catch {
    return NextResponse.json(computeBookingDateBounds())
  }
}
