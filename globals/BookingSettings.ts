import { revalidatePath } from 'next/cache'
import type { GlobalAfterChangeHook, GlobalConfig } from 'payload'
import { isAdmin } from '@/app/lib/access'

const revalidateBooking: GlobalAfterChangeHook = () => {
  try {
    revalidatePath('/book')
    revalidatePath('/contact')
  } catch {
    // no-op outside Next.js request context
  }
}

export const BookingSettings: GlobalConfig = {
  slug: 'booking-settings',
  label: 'Booking Settings',
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    group: 'Services & Booking',
    description:
      'Controls how far in advance clients can request sessions. Changes take effect immediately - no code change needed.',
  },
  hooks: { afterChange: [revalidateBooking] },
  fields: [
    {
      name: 'editHeader',
      type: 'ui',
      admin: {
        components: {
          Field: './components/admin/BookingSettingsHeader#BookingSettingsHeader',
        },
      },
    },
    {
      name: 'minLeadTimeHours',
      type: 'number',
      label: 'Minimum Lead Time (hours)',
      defaultValue: 48,
      required: true,
      min: 0,
      admin: {
        description:
          'How many hours in advance a client must request a session. Default is 48 hours (2 days). Set to 0 to allow same-day requests.',
      },
    },
    {
      name: 'maxBookingMonths',
      type: 'number',
      label: 'Maximum Booking Window (months)',
      defaultValue: 24,
      required: true,
      min: 1,
      admin: {
        description:
          'How many months into the future clients can request sessions. Default is 24 months (2 years). Requests beyond this window are rejected.',
      },
    },
  ],
}
