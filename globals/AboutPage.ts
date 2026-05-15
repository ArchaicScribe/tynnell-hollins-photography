import type { GlobalConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'About Page',
  admin: {
    description: 'Content for your About page and the about preview section on your homepage.',
  },
  fields: [
    {
      name: 'headshot',
      type: 'upload',
      label: 'Your Photo',
      relationTo: 'photos',
      admin: {
        description: 'Your professional photo shown on the About page.',
      },
    },
    {
      name: 'headshotAlt',
      type: 'text',
      label: 'Photo Description',
      admin: {
        description:
          'A brief description of your photo for screen readers and search engines. Example: "Tynnell Hollins holding a camera outdoors".',
      },
    },
    {
      name: 'tagline',
      type: 'text',
      label: 'Your Tagline',
      admin: {
        description:
          'A short line that captures who you are, shown prominently on your About page. Example: "Photographer & Storyteller".',
      },
    },
    {
      name: 'bio',
      type: 'richText',
      label: 'Your Full Story',
      editor: lexicalEditor(),
      admin: {
        description:
          'Your full bio shown on the About page. You can use bold, italic, and paragraph breaks.',
      },
    },
    {
      name: 'previewBio',
      type: 'textarea',
      label: 'Homepage Bio',
      admin: {
        description:
          'A shorter version of your story shown on the homepage. Keep it to 2–3 sentences.',
        rows: 3,
      },
    },
    {
      name: 'values',
      type: 'array',
      label: 'Your Values',
      admin: {
        description: 'Your core values or philosophy, displayed on your About page.',
      },
      fields: [
        {
          name: 'heading',
          type: 'text',
          label: 'Value Heading',
          required: true,
          admin: {
            description:
              'A short title for this value, like "Authenticity" or "Presence".',
          },
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Description',
          admin: {
            description: 'A sentence or two describing what this value means to you.',
            rows: 2,
          },
        },
      ],
    },
  ],
}
