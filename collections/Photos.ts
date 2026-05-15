import type { CollectionConfig } from 'payload'

export const Photos: CollectionConfig = {
  slug: 'photos',
  labels: {
    singular: 'Photo',
    plural: 'Photos',
  },
  upload: {
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 800,
        height: 600,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/*'],
  },
  admin: {
    useAsTitle: 'title',
    description:
      'Your photo library. Every image you upload lives here and can be used in galleries, blog posts, and your homepage.',
    defaultColumns: ['filename', 'title', 'category', 'featured', 'updatedAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      admin: {
        description:
          'A short name to identify this photo in your dashboard. Clients do not see this. Example: "Smith Wedding – First Dance".',
      },
    },
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text (for Accessibility & SEO)',
      required: true,
      admin: {
        description:
          'Describe what is happening in this photo in one or two sentences. This text is read aloud by screen readers for visually impaired visitors and used by Google to understand your images. Example: "Bride and groom laughing together during their first dance at an outdoor reception."',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      admin: {
        description: 'The type of session this photo is from. Used to organise your portfolio.',
      },
      options: [
        { label: 'Weddings', value: 'weddings' },
        { label: 'Portraits', value: 'portraits' },
        { label: 'Families', value: 'families' },
        { label: 'Couples', value: 'couples' },
        { label: 'Brands', value: 'brands' },
      ],
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      admin: {
        description:
          'An optional caption displayed beneath this photo in galleries. Leave blank for no caption.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Show on Homepage',
      defaultValue: false,
      admin: {
        description:
          'Turn this on to feature this photo in the portfolio preview section on your homepage. Up to 6 photos are shown.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      label: 'Display Position',
      admin: {
        description:
          'Controls the order this photo appears in. Lower numbers appear first. You can leave this blank and sort manually later.',
      },
    },
  ],
}
