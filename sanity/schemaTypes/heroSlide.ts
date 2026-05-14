import { defineField, defineType } from 'sanity'

export const heroSlide = defineType({
  name: 'heroSlide',
  title: 'Hero Slide',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Slide Image',
      type: 'image',
      options: { hotspot: true },
      description: 'The photo that fills the screen on your homepage carousel. Use the focal point tool (the circle) to keep the most important part of the image visible on all screen sizes.',
      validation: (Rule) => Rule.required().error('Slide Image is required before publishing.'),
    }),
    defineField({
      name: 'alt',
      title: 'Alt Text (for Accessibility & SEO)',
      type: 'string',
      description: 'Describe what is happening in this photo in one sentence. This is read aloud by screen readers for visually impaired visitors and helps Google understand your images. Example: "Bride and groom laughing together during an outdoor ceremony at sunset."',
      validation: (Rule) => Rule.required().error('Alt Text is required before publishing.'),
    }),
    defineField({
      name: 'tagline',
      title: 'Caption Text',
      type: 'string',
      description: 'Optional text displayed over the photo on your homepage. Keep it short - one line works best. Leave blank for a clean photo with no text.',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Controls which slide plays first. 1 plays first, 2 plays second, and so on. Leave blank and slides will play in the order they were created.',
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
      order: 'order',
    },
    prepare({ title, media, order }) {
      return {
        title: title || 'No caption',
        media,
        subtitle: order != null ? `Slide ${order}` : 'No order set',
      }
    },
  },
})
