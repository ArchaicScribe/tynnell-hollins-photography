import type { CollectionAfterChangeHook, CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const revalidatePost: CollectionAfterChangeHook = ({ doc }) => {
  if (typeof doc.slug === 'string' && doc.slug) {
    revalidatePath(`/blog/${doc.slug}`)
  }
  revalidatePath('/blog')
  return doc
}

// Auto-generate slug from title and default publishedAt to now.
// Manual values are always preserved, only fills in if empty.
const autoPopulate: CollectionBeforeValidateHook = ({ data = {} }) => {
  if (!data.slug && data.title) {
    data.slug = toSlug(data.title as string)
  }
  if (!data.publishedAt) {
    data.publishedAt = new Date().toISOString()
  }
  return data
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Blog Post',
    plural: 'Blog Posts',
  },
  hooks: {
    beforeValidate: [autoPopulate],
    afterChange: [revalidatePost],
  },
  admin: {
    useAsTitle: 'title',
    // Managed entirely via /blog-editor now (see app/blog-editor/) - hidden
    // from the Payload admin nav the same way Pages.ts hides the builder's
    // own collection.
    hidden: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Post Title',
      required: true,
      admin: {
        description:
          'The title of your blog post, shown on the blog page and in search results.',
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
          'Auto-generated from the title - you do not need to set this. Edit here only if you want a custom web address. Use lowercase letters and hyphens only.',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'draft',
      admin: {
        description: 'Draft posts are not visible on your website. Set to Published when ready.',
        position: 'sidebar',
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Publish Date',
      required: true,
      admin: {
        description:
          'Defaults to today. You can set a future date to schedule the post - it will appear on your blog on that date.',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'coverImage',
      type: 'relationship',
      label: 'Cover Photo',
      relationTo: 'photos',
      admin: {
        description:
          'The main photo for this post, shown at the top of the post and on the blog listing page.',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      admin: {
        description: 'Used to filter posts on the blog page.',
        position: 'sidebar',
      },
      options: [
        { label: 'Style Guide', value: 'style-guide' },
        { label: 'Portrait Sessions', value: 'portrait-sessions' },
        { label: 'Weddings', value: 'weddings' },
        { label: 'Behind the Lens', value: 'behind-the-lens' },
        { label: 'Client Education', value: 'client-education' },
      ],
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Short Summary',
      admin: {
        description:
          'A 1-2 sentence summary shown on the blog listing page. Helps readers decide if they want to read more.',
        rows: 3,
      },
    },
    {
      // Puck-style block document (see app/blog-editor/blog-blocks.config.tsx),
      // matching the same { content: Block[], root: object } shape the Pages
      // collection uses for its own builder content. Only ever written by
      // /api/blog-editor/save - hidden here since the in-context editor at
      // /blog-editor/[slug] is the only place this gets edited.
      name: 'body',
      type: 'json',
      label: 'Post Content',
      admin: {
        hidden: true,
      },
    },
  ],
}
