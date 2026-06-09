import type { CollectionConfig } from 'payload'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: {
    singular: 'Testimonial',
    plural: 'Testimonials',
  },
  admin: {
    group: 'Content',
    useAsTitle: 'clientName',
    description:
      'Reviews and quotes from your clients, shown on your homepage and testimonials page.',
    defaultColumns: ['clientName', 'sessionType', 'featured', 'displayOrder', 'updatedAt'],
  },
  fields: [
    {
      name: 'clientName',
      type: 'text',
      label: 'Client Name',
      required: true,
      admin: {
        description:
          'The name shown below the quote on your website. Use first names, a couple name like "Sarah & James", or a family name like "The Martinez Family".',
      },
    },
    {
      name: 'quote',
      type: 'textarea',
      label: 'Their Words',
      required: true,
      admin: {
        description:
          "Paste the client's review exactly as you want it to appear on your website. Keep it genuine — real words from real clients build trust with future bookings.",
        rows: 4,
      },
    },
    {
      name: 'sessionType',
      type: 'select',
      label: 'Type of Session',
      admin: {
        description:
          'The type of session this review is from. Used to give visitors context and helps with SEO. Leave blank if you prefer not to categorise it.',
      },
      options: [
        { label: 'Wedding', value: 'Wedding' },
        { label: 'Engagement', value: 'Engagement' },
        { label: 'Portrait', value: 'Portrait' },
        { label: 'Family', value: 'Family' },
        { label: 'Maternity', value: 'Maternity' },
        { label: 'Event', value: 'Event' },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Show on Homepage',
      defaultValue: false,
      admin: {
        description:
          'When checked, this testimonial appears in the Testimonials section on your homepage. Uncheck to keep it off the homepage (it will still appear on your full Testimonials page).',
        position: 'sidebar',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      label: 'Display Order',
      admin: {
        description:
          'Controls the order testimonials appear, both on the homepage and the full Testimonials page. 1 shows first, 2 shows second, and so on. Leave blank and they display in the order they were added.',
      },
    },
  ],
}
