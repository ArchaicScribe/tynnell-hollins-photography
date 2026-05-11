import { defineField, defineType } from 'sanity'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  // Singleton — only one document of this type should exist
  fields: [
    defineField({
      name: 'headshot',
      title: 'Your Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'Your professional photo shown on the About page.',
    }),
    defineField({
      name: 'headshotAlt',
      title: 'Photo Description',
      type: 'string',
      description: 'A brief description of your photo for screen readers and search engines. Example: "Tynnell Hollins holding a camera outdoors".',
    }),
    defineField({
      name: 'tagline',
      title: 'Your Tagline',
      type: 'string',
      description: 'A short line that captures who you are, shown prominently on your About page. Example: "Photographer & Storyteller".',
    }),
    defineField({
      name: 'bio',
      title: 'Your Full Story',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Your full bio shown on the About page. You can use bold, italic, and paragraph breaks.',
    }),
    defineField({
      name: 'previewBio',
      title: 'Homepage Bio',
      type: 'text',
      rows: 3,
      description: 'A shorter version of your story shown on the homepage. Keep it to 2-3 sentences.',
    }),
    defineField({
      name: 'values',
      title: 'Your Values',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'heading', title: 'Value Heading', type: 'string', description: 'A short title for this value, like "Authenticity" or "Presence".' }),
            defineField({ name: 'body', title: 'Description', type: 'text', rows: 2, description: 'A sentence or two describing what this value means to you.' }),
          ],
          preview: { select: { title: 'heading' } },
        },
      ],
      description: 'Your core values or philosophy, displayed on your About page.',
    }),
  ],
  preview: {
    select: {
      title: 'tagline',
      media: 'headshot',
    },
    prepare({ title, media }) {
      return { title: title || 'About Page', media }
    },
  },
})
