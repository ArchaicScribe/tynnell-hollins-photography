import { defineField, defineType } from 'sanity'

export const photo = defineType({
  name: 'photo',
  title: 'Photo',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Photo Name',
      type: 'string',
      description: 'A short name to identify this photo in your Studio. Clients do not see this.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Photo Description',
      type: 'string',
      description: 'A brief description of what is in this photo. Used by screen readers and Google. Example: "Mother holding newborn in soft window light".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'The photo file.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'An optional caption displayed beneath this photo in galleries.',
    }),
    defineField({
      name: 'category',
      title: 'Session Type',
      type: 'string',
      description: 'The type of session this photo is from. Used to organize your portfolio.',
      options: {
        list: [
          { title: 'Weddings', value: 'weddings' },
          { title: 'Portraits', value: 'portraits' },
          { title: 'Families', value: 'families' },
          { title: 'Couples', value: 'couples' },
          { title: 'Brands', value: 'brands' },
        ],
      },
    }),
    defineField({
      name: 'featured',
      title: 'Show on Homepage',
      type: 'boolean',
      description: 'Turn this on to feature this photo on your homepage.',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Display Position',
      type: 'number',
      description: 'The position of this photo within its category or gallery. Lower numbers appear first.',
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
      media: 'image',
      subtitle: 'category',
    },
  },
})
