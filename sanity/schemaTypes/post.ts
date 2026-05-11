import { defineField, defineType } from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Post Title',
      type: 'string',
      description: 'The title of your blog post, shown on the blog page and in search results.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Page URL',
      type: 'slug',
      options: { source: 'title' },
      description: 'The web address for this post. Click "Generate" to create it automatically from the title.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publish Date',
      type: 'datetime',
      description: 'The date this post will show as published. You can set a future date to schedule it.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Photo',
      type: 'reference',
      to: [{ type: 'photo' }],
      description: 'The main photo for this post, shown at the top of the post and on the blog listing page.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Short Summary',
      type: 'text',
      rows: 3,
      description: 'A 1-2 sentence summary shown on the blog listing page. Helps readers decide if they want to read more.',
    }),
    defineField({
      name: 'body',
      title: 'Post Content',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'The full content of your blog post.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'publishedAt',
    },
  },
})
