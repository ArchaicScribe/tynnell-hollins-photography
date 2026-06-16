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
    {
      name: 'mustChangePassword',
      type: 'checkbox',
      label: 'Must Change Password on Next Login',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'When checked, the user is prompted to set a new password before accessing the admin.',
      },
    },
  ],
}
