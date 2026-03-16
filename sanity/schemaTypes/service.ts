import { defineField, defineType } from 'sanity'

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Short category label shown above the title (e.g. WEDDINGS).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Display name shown in Tangerine script (e.g. Your Wedding Day).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Bullet points listed under the description.',
    }),
    defineField({
      name: 'price',
      title: 'Starting Price',
      type: 'string',
      description: 'e.g. "Starting at $2,500" — leave blank to hide pricing.',
    }),
    defineField({
      name: 'depositAmount',
      title: 'Deposit Amount (USD)',
      type: 'number',
      description: 'Booking deposit in dollars (e.g. 500 for a $500 deposit). Leave blank to hide the "Book Now" button for this service.',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls display order on the Services page.',
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
