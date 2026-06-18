import type { GlobalConfig } from 'payload'

export const BookingSettings: GlobalConfig = {
  slug: 'booking-settings',
  label: 'Booking Settings',
  admin: {
    group: 'Services & Booking',
    description:
      'Controls how far in advance clients can request sessions. Changes take effect immediately - no code change needed.',
  },
  fields: [
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
