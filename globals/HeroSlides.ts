import type { GlobalConfig } from 'payload'

export const HeroSlides: GlobalConfig = {
  slug: 'hero-slides',
  label: 'Hero Slides',
  admin: {
    description:
      'The full-screen photo carousel on your homepage. Add, remove, or reorder slides here.',
  },
  fields: [
    {
      name: 'slides',
      type: 'array',
      label: 'Slides',
      admin: {
        description:
          'Each slide fills the screen on your homepage. Drag the handle to reorder them.',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          label: 'Slide Image',
          relationTo: 'photos',
          required: true,
          admin: {
            description:
              'The photo that fills the screen. Use a high-resolution landscape image for the best result.',
          },
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption Text',
          admin: {
            description:
              'Optional text displayed over the photo. Keep it short — one line works best. Leave blank for a clean photo with no text.',
          },
        },
        {
          name: 'displayOrder',
          type: 'number',
          label: 'Display Order',
          admin: {
            description:
              'Controls which slide plays first. 1 plays first, 2 plays second. Leave blank and slides play in the order listed here.',
          },
        },
      ],
    },
  ],
}
