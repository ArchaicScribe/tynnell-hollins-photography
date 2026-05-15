import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: {
    singular: 'Service',
    plural: 'Services',
  },
  admin: {
    useAsTitle: 'title',
    description:
      'Your photography services, shown on the Services page. Services with a booking deposit set also appear on the Book a Session page.',
    defaultColumns: ['title', 'eyebrow', 'depositAmount', 'displayOrder', 'updatedAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Service Name',
      required: true,
      admin: {
        description:
          'The name of this service as it appears on your website, like "Wedding Day" or "Portrait Session".',
      },
    },
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Category Label',
      required: true,
      admin: {
        description:
          'The category shown above the service name, like "Weddings" or "Portraits".',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      required: true,
      admin: {
        description: 'A short description of what clients can expect from this session.',
        rows: 3,
      },
    },
    {
      name: 'features',
      type: 'array',
      label: "What's Included",
      admin: {
        description:
          'Optional details listed under the description, like what is included in the package.',
      },
      fields: [
        {
          name: 'feature',
          type: 'text',
          label: 'Item',
          required: true,
        },
      ],
    },
    {
      name: 'price',
      type: 'text',
      label: 'Starting Price',
      admin: {
        description:
          'The price shown on your Services page, like "Starting at $2,500". Leave blank to hide pricing.',
      },
    },
    {
      name: 'depositAmount',
      type: 'number',
      label: 'Booking Deposit (USD)',
      admin: {
        description:
          'The deposit amount clients pay to secure their date, in dollars. For example, enter 500 for a $500 deposit. Leave blank to hide the booking button for this service.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      label: 'Display Position',
      required: true,
      admin: {
        description:
          'The position of this service in the list. 1 appears first, 2 appears second, and so on.',
      },
    },
  ],
}
