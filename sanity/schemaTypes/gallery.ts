import { defineField, defineType } from 'sanity'
import { PhotosArrayInput } from '../components/PhotosArrayInput'

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Gallery Name',
      type: 'string',
      description: 'The name of this gallery, shown on your portfolio page. Example: "Smith Wedding" or "Fall Family Portraits".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Page URL',
      type: 'slug',
      options: { source: 'title' },
      description: 'The web address for this gallery. Click "Generate" to create it automatically from the name.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Session Type',
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Photo',
      type: 'reference',
      to: [{ type: 'photo' }],
      description: 'The photo shown as the preview for this gallery on your portfolio page.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photos',
      title: 'Photos in This Gallery',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'image', title: 'Photo', type: 'image', options: { hotspot: true }, validation: (Rule) => Rule.required() }),
            defineField({ name: 'alt', title: 'Photo Description', type: 'string', description: 'A brief description for screen readers and search engines.' }),
            defineField({ name: 'caption', title: 'Caption', type: 'string', description: 'Optional caption displayed beneath this photo in the gallery.' }),
          ],
          preview: { select: { media: 'image', title: 'alt' } },
        },
      ],
      description: 'Click "Upload photos" to add multiple photos at once.',
      components: { input: PhotosArrayInput },
    }),
    defineField({
      name: 'featured',
      title: 'Show on Homepage',
      type: 'boolean',
      description: 'Turn this on to feature this gallery on your homepage.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
    },
  },
})
