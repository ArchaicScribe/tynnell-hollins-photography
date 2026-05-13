import { defineField, defineType } from 'sanity'

export const photo = defineType({
  name: 'photo',
  title: 'Photo',
  type: 'document',
  fields: [
    // Image first — most important field for a photo document
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'Upload your photo here. Use the focal point tool (the circle) to make sure the most important part of the image is never cropped out.',
      validation: (Rule) => Rule.required().error('Photo is required before publishing.'),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'A short name to identify this photo in your Studio. Clients do not see this. Example: "Smith Wedding - First Dance".',
      validation: (Rule) => Rule.required().error('Title is required before publishing.'),
    }),
    defineField({
      name: 'alt',
      title: 'Alt Text (for Accessibility & SEO)',
      type: 'string',
      description:
        'Describe what is happening in this photo in one or two sentences. This text is read aloud by screen readers for visually impaired visitors and used by Google to understand your images. Good alt text helps more people find your work. Example: "Bride and groom laughing together during their first dance at an outdoor reception."',
      validation: (Rule) => Rule.required().error('Alt Text is required before publishing.'),
    }),
    defineField({
      name: 'category',
      title: 'Category',
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
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'An optional caption displayed beneath this photo in galleries. Leave blank for no caption.',
    }),
    defineField({
      name: 'featured',
      title: 'Show on Homepage',
      type: 'boolean',
      description: 'Turn this on to feature this photo in the portfolio preview section on your homepage. Up to 6 photos are shown.',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Display Position',
      type: 'number',
      description: 'Controls the order this photo appears in. Lower numbers appear first. You can leave this blank and sort manually later.',
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
      category: 'category',
    },
    prepare({ title, media, category }) {
      const categoryLabel = category
        ? category.charAt(0).toUpperCase() + category.slice(1)
        : 'No category'
      return {
        title: title ?? 'Untitled photo',
        media,
        subtitle: categoryLabel,
      }
    },
  },
})
