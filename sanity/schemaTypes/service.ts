import { defineField, defineType } from 'sanity'

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Category Label',
      type: 'string',
      description: 'The category shown above the service name, like "Weddings" or "Portraits".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Service Name',
      type: 'string',
      description: 'The name of this service as it appears on your website, like "Wedding Day" or "Portrait Session".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'A short description of what clients can expect from this session.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'features',
      title: "What's Included",
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Optional details listed under the description, like what is included in the package.',
    }),
    defineField({
      name: 'price',
      title: 'Starting Price',
      type: 'string',
      description: 'The price shown on your Services page, like "Starting at $2,500". Leave blank to hide pricing.',
    }),
    defineField({
      name: 'depositAmount',
      title: 'Booking Deposit (USD)',
      type: 'number',
      description: 'The deposit amount clients pay to secure their date, in dollars. For example, enter 500 for a $500 deposit. Leave blank to hide the booking button for this service.',
    }),
    defineField({
      name: 'order',
      title: 'Display Position',
      type: 'number',
      description: 'The position of this service in the list. 1 appears first, 2 appears second, and so on.',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'eyebrow',
    },
  },
})
