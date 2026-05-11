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
      description: 'The name shown below the quote, like "Sarah & James" or "The Martinez Family".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'quote',
      title: 'Their Words',
      type: 'text',
      rows: 4,
      description: "The client's review, exactly as you want it to appear on your website.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sessionType',
      title: 'Type of Session',
      type: 'string',
      description: 'The type of session this review is from.',
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
      title: 'Display Position',
      type: 'number',
      description: 'The position of this testimonial on your homepage. 1 appears first.',
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
      title: 'clientName',
      subtitle: 'sessionType',
    },
  },
})
