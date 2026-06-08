import type { GlobalConfig } from 'payload'

export const Availability: GlobalConfig = {
  slug: 'availability',
  label: 'Availability',
  admin: {
    group: 'Services & Booking',
    description:
      'Block out dates when you are unavailable — vacations, personal time, recovery periods. Clients requesting sessions during these windows will see your custom message.',
  },
  fields: [
    {
      name: 'blockedRanges',
      type: 'array',
      label: 'Blocked Date Ranges',
      admin: {
        description:
          'Add a range for each period you are unavailable. Clients who try to book during a blocked range will see your message instead.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'internalLabel',
          type: 'text',
          label: 'Internal Label (private)',
          required: true,
          admin: {
            description:
              'A private note for your reference only — never shown to clients. Example: "Cancun trip" or "Wedding weekend".',
          },
        },
        {
          name: 'startDate',
          type: 'date',
          label: 'First Unavailable Day',
          required: true,
          admin: {
            description: 'The first day you are unavailable.',
            date: { pickerAppearance: 'dayOnly' },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'Last Unavailable Day',
          required: true,
          admin: {
            description: 'The last day you are unavailable.',
            date: { pickerAppearance: 'dayOnly' },
          },
          validate: (value, { siblingData }) => {
            const sibling = siblingData as { startDate?: string }
            if (!value || !sibling?.startDate) return true
            if (new Date(value as unknown as string) < new Date(sibling.startDate)) {
              return 'End date cannot be before the start date.'
            }
            return true
          },
        },
        {
          name: 'applyReturnBuffer',
          type: 'checkbox',
          label: 'Add recovery buffer after return',
          defaultValue: true,
          admin: {
            description:
              'Extends the blocked window a few days past your return so you have time to catch up before new sessions begin.',
          },
        },
        {
          name: 'returnBufferDays',
          type: 'number',
          label: 'Recovery Buffer (days)',
          defaultValue: 2,
          min: 0,
          admin: {
            description:
              'How many extra days to block after your last unavailable day. Only applies when "Add recovery buffer" is checked.',
          },
        },
        {
          name: 'customerMessage',
          type: 'textarea',
          label: 'Message to Clients',
          required: true,
          admin: {
            description:
              'Shown to clients who try to book during this period. Use {returnDate} as a placeholder for your computed return date. Example: "I\'m currently away and will be back accepting inquiries on {returnDate}."',
          },
        },
        {
          // Managed by the OOO return notification cron (TYN-110). Never set manually.
          name: 'notificationSent',
          type: 'checkbox',
          label: 'Return Notification Sent',
          defaultValue: false,
          admin: {
            hidden: true,
          },
        },
      ],
    },
    {
      // Renders soft warnings (overlaps, long periods, currently active) in the admin UI.
      name: 'oooWarnings',
      type: 'ui',
      admin: {
        components: {
          Field: './components/admin/OooWarnings#OooWarnings',
        },
      },
    },
  ],
}
