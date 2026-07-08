import type { Access, CollectionConfig } from 'payload'
import { isAdmin } from '@/app/lib/access'

// Admins manage everyone; editors can only see/update their own account (e.g.
// changing their own password via the admin's Account page).
const isAdminOrSelf: Access = ({ req, id }) => {
  if (req.user?.role === 'admin') return true
  if (!req.user) return false
  if (id === undefined) return { id: { equals: req.user.id } }
  return req.user.id === id
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  access: {
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    create: isAdmin,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'email',
    description: 'Admin accounts that can log into this dashboard.',
    components: {
      views: {
        list: {
          Component: './components/admin/UsersGridView#UsersGridView',
        },
      },
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Full Name',
    },
    {
      name: 'role',
      type: 'select',
      label: 'Role',
      required: true,
      defaultValue: 'admin',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Content Editor', value: 'editor' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Admin: full access, including Users, Site Config, Booking Settings, and Availability. Content Editor: can manage Photos, Galleries, Blog Posts, Testimonials, Services, and Pages, but not those admin-only areas.',
      },
      // Only an admin can change a role - otherwise an editor could self-escalate
      // (or de-escalate another admin) via a direct update call.
      access: {
        update: isAdmin,
      },
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
