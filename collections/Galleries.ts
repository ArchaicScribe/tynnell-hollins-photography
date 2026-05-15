import type { CollectionConfig } from 'payload'

export const Galleries: CollectionConfig = {
  slug: 'galleries',
  labels: {
    singular: 'Gallery',
    plural: 'Galleries',
  },
  admin: {
    useAsTitle: 'title',
    description:
      'Curated collections of photos shown on your Portfolio page. Each gallery has a category, a cover photo, and a set of photos.',
    defaultColumns: ['title', 'category', 'featured', 'displayOrder', 'updatedAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Gallery Title',
      required: true,
      admin: {
        description:
          'The name of this gallery, shown on your portfolio page. Example: "Smith Wedding" or "Fall Family Portraits".',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'URL Slug',
      required: true,
      unique: true,
      admin: {
        description:
          'The web address for this gallery. Example: "smith-wedding". Use lowercase letters and hyphens only.',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      required: true,
      admin: {
        description: 'The type of session this gallery is from. Used to organise your portfolio.',
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
      name: 'coverPhoto',
      type: 'relationship',
      label: 'Cover Photo',
      relationTo: 'photos',
      required: true,
      admin: {
        description:
          'The photo shown as the preview for this gallery on your portfolio page. Must be a photo already uploaded to All Photos.',
      },
    },
    {
      name: 'photos',
      type: 'relationship',
      label: 'Photos in This Gallery',
      relationTo: 'photos',
      hasMany: true,
      admin: {
        description: 'Select all photos to include in this gallery. You can reorder them after saving.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Show on Homepage',
      defaultValue: false,
      admin: {
        description: 'Turn this on to feature this gallery on your homepage.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      label: 'Display Position',
      admin: {
        description:
          'Controls the order this gallery appears on your portfolio page. Lower numbers appear first. Example: 1 = first, 2 = second.',
      },
    },
  ],
}
