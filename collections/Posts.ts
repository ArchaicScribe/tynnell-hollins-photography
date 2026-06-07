import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Auto-generate slug from title and default publishedAt to now.
// Manual values are always preserved — only fills in if empty.
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
  },
  admin: {
    useAsTitle: 'title',
    description: 'Your blog posts, shown on the Blog page and individual post pages.',
    defaultColumns: ['coverImage', 'title', 'status', 'publishedAt', 'updatedAt'],
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
          'Auto-generated from the title — you do not need to set this. Edit here only if you want a custom web address. Use lowercase letters and hyphens only.',
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
          'Defaults to today. You can set a future date to schedule the post — it will appear on your blog on that date.',
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
        components: {
          Cell: './components/admin/PostCoverCell#PostCoverCell',
        },
      },
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
      name: 'body',
      type: 'richText',
      label: 'Post Content',
      editor: lexicalEditor(),
      admin: {
        description: 'The full content of your blog post.',
      },
    },
  ],
}
