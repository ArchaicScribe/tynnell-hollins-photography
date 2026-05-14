import { defineField, defineType } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({
      name: 'clientName',
      title: 'Client Name',
      type: 'string',
      description: 'The name shown below the quote on your website. Use first names, a couple name like "Sarah & James", or a family name like "The Martinez Family".',
      validation: (Rule) => Rule.required().error('Client Name is required before publishing.'),
    }),
    defineField({
      name: 'quote',
      title: 'Their Words',
      type: 'text',
      rows: 4,
      description: "Paste the client's review exactly as you want it to appear on your website. Keep it genuine — real words from real clients build trust with future bookings.",
      validation: (Rule) => Rule.required().error("Their Words (the quote) is required before publishing."),
    }),
    defineField({
      name: 'sessionType',
      title: 'Type of Session',
      type: 'string',
      description: 'The type of session this review is from. Used to give visitors context and helps with SEO. Leave blank if you prefer not to categorize it.',
      options: {
        list: [
          { title: 'Wedding', value: 'Wedding' },
          { title: 'Engagement', value: 'Engagement' },
          { title: 'Portrait', value: 'Portrait' },
          { title: 'Family', value: 'Family' },
          { title: 'Maternity', value: 'Maternity' },
          { title: 'Event', value: 'Event' },
        ],
      },
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Controls which testimonial appears first on your homepage. 1 shows first, 2 shows second, and so on. Leave blank and testimonials will display in the order they were added.',
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
      title: 'clientName',
      subtitle: 'quote',
      sessionType: 'sessionType',
      order: 'order',
    },
    prepare({ title, subtitle, sessionType, order }) {
      const position = order != null ? `#${order}` : ''
      const type = sessionType ? ` · ${sessionType}` : ''
      const excerpt = subtitle ? subtitle.slice(0, 60) + (subtitle.length > 60 ? '…' : '') : 'No quote yet'
      return {
        title: [position, title].filter(Boolean).join(' — '),
        subtitle: `${excerpt}${type}`,
      }
    },
  },
})
