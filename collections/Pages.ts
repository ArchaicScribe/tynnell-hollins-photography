import type { CollectionConfig } from 'payload'

// Builder pages (TYN-216). Each row is one page composed in the visual builder.
// `content` holds the Puck document JSON. Managed via the /builder UI, so the
// collection is hidden from the Payload admin nav.
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    hidden: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'content', type: 'json' },
    { name: 'published', type: 'checkbox', defaultValue: false },
    { name: 'displayOrder', type: 'number' },
  ],
}
