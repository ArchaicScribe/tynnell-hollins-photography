import { defineField, defineType } from 'sanity'

export const heroSlide = defineType({
  name: 'heroSlide',
  title: 'Hero Slide',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Slide Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'The photo that fills the screen on your homepage carousel.',
      validation: (Rule) => Rule.required().error('Slide Photo is required before publishing.'),
    }),
    defineField({
      name: 'alt',
      title: 'Photo Description',
      type: 'string',
      description: 'A brief description of this photo for screen readers and search engines. Example: "Bride and groom laughing during an outdoor ceremony".',
      validation: (Rule) => Rule.required().error('Photo Description is required before publishing.'),
    }),
    defineField({
      name: 'tagline',
      title: 'Caption Text',
      type: 'string',
      description: 'Optional text displayed over the photo on your homepage. Leave blank for no text.',
    }),
    defineField({
      name: 'order',
      title: 'Slide Position',
      type: 'number',
      description: 'The position of this slide in the carousel. 1 plays first, 2 plays second, and so on.',
      validation: (Rule) => Rule.required().error('Slide Position is required.').integer().positive(),
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
      title: 'tagline',
      media: 'image',
      subtitle: 'order',
    },
    prepare({ title, media, subtitle }) {
      return {
        title: title || 'Untitled slide',
        media,
        subtitle: `Slide ${subtitle}`,
      }
    },
  },
})
