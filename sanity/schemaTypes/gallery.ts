import { defineField, defineType } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { PhotosArrayInput } from '../components/PhotosArrayInput'

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Gallery Title',
      type: 'string',
      description: 'The name of this gallery, shown on your portfolio page. Example: "Smith Wedding" or "Fall Family Portraits".',
      validation: (Rule) => Rule.required().error('Gallery Title is required before publishing.'),
    }),
    defineField({
      name: 'slug',
      title: 'Page URL',
      type: 'slug',
      options: { source: 'title' },
      description: 'The web address for this gallery. Click "Generate" to create it automatically from the title.',
      validation: (Rule) => Rule.required().error('Page URL is required. Click "Generate" to create it from the gallery title.'),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'The type of session this gallery is from. Used to organize your portfolio.',
      options: {
        list: [
          { title: 'Weddings', value: 'weddings' },
          { title: 'Portraits', value: 'portraits' },
          { title: 'Families', value: 'families' },
          { title: 'Couples', value: 'couples' },
          { title: 'Brands', value: 'brands' },
        ],
      },
      validation: (Rule) => Rule.required().error('Category is required before publishing.'),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Photo',
      type: 'reference',
      to: [{ type: 'photo' }],
      description: 'The photo shown as the preview for this gallery on your portfolio page. Must be a photo you have already uploaded to All Photos.',
      validation: (Rule) => Rule.required().error('Cover Photo is required before publishing.'),
    }),
    defineField({
      name: 'photos',
      title: 'Photos in This Gallery',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              title: 'Photo',
              type: 'image',
              options: { hotspot: true },
              validation: (Rule) => Rule.required().error('Photo is required.'),
            }),
            defineField({
              name: 'alt',
              title: 'Alt Text (for Accessibility & SEO)',
              type: 'string',
              description: 'Describe what is happening in this photo in one sentence. This is read aloud by screen readers and helps Google understand your images. Example: "Bride and groom laughing during their first dance at an outdoor reception."',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optional caption displayed beneath this photo in the gallery.',
            }),
          ],
          preview: {
            select: { media: 'image', title: 'alt' },
            prepare({ media, title }) {
              return {
                media,
                title: title || 'No alt text yet',
              }
            },
          },
        },
      ],
      description: 'Click "Upload photos" to add multiple photos at once. Drag the handle on the left of each photo to reorder them.',
      components: { input: PhotosArrayInput },
    }),
    defineField({
      name: 'featured',
      title: 'Show on Homepage',
      type: 'boolean',
      description: 'Turn this on to feature this gallery on your homepage.',
      initialValue: false,
    }),
    orderRankField({ type: 'gallery' }),
  ],
  orderings: [
    orderRankOrdering,
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      media: 'coverImage.image',
      photos: 'photos',
    },
    prepare({ title, category, media, photos }) {
      const count = Array.isArray(photos) ? photos.length : 0
      const categoryLabel = category
        ? category.charAt(0).toUpperCase() + category.slice(1)
        : 'No category'
      return {
        title: title ?? 'Untitled gallery',
        subtitle: `${categoryLabel} - ${count} photo${count !== 1 ? 's' : ''}`,
        media,
      }
    },
  },
})
