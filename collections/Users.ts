import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    description: 'Admin accounts that can log into this dashboard.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Full Name',
    },
  ],
}
