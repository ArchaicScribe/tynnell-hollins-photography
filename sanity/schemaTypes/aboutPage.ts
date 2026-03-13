import { defineField, defineType } from 'sanity'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  // Singleton — only one document of this type should exist
  fields: [
    defineField({
      name: 'headshot',
      title: 'Headshot',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'headshotAlt',
      title: 'Headshot Alt Text',
      type: 'string',
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short line shown above the bio (e.g. "Photographer & Storyteller").',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Full bio shown on the About page. Supports rich text.',
    }),
    defineField({
      name: 'previewBio',
      title: 'Preview Bio',
      type: 'text',
      rows: 3,
      description: 'Short version shown in the homepage AboutPreview section.',
    }),
    defineField({
      name: 'values',
      title: 'Values / Philosophy',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'heading', title: 'Heading', type: 'string' }),
            defineField({ name: 'body', title: 'Body', type: 'text', rows: 2 }),
          ],
          preview: { select: { title: 'heading' } },
        },
      ],
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
