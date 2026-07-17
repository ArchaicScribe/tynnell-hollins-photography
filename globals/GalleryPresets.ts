import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/app/lib/access'

export const GalleryPresets: GlobalConfig = {
  slug: 'gallery-presets',
  label: 'Gallery Presets',
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    group: 'My Portfolio',
    description:
      'Default values applied automatically whenever a new gallery is created, so you do not have to reconfigure the same options every time. Edited from Settings.',
  },
  fields: [
    {
      name: 'defaultCategory',
      type: 'select',
      label: 'Default Category',
      admin: {
        description: 'Pre-selected category when creating a new gallery. Leave unset to always require a manual choice.',
      },
      options: [
        { label: 'Weddings', value: 'weddings' },
        { label: 'Portraits', value: 'portraits' },
        { label: 'Families', value: 'families' },
        { label: 'Couples', value: 'couples' },
        { label: 'Brands', value: 'brands' },
      ],
    },
    {
      name: 'defaultStatus',
      type: 'select',
      label: 'Default Status',
      defaultValue: 'draft',
      admin: {
        description: 'Status applied to a gallery when it is first created.',
      },
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
      ],
    },
    {
      name: 'defaultTapedStyle',
      type: 'checkbox',
      label: 'Default to Taped Photo Style',
      defaultValue: false,
      admin: {
        description: 'New galleries start with the editorial taped-photo look already turned on.',
      },
    },
    {
      name: 'defaultFeatured',
      type: 'checkbox',
      label: 'Default to Show on Homepage',
      defaultValue: false,
      admin: {
        description: 'New galleries start featured on the homepage.',
      },
    },
    {
      name: 'defaultAllowDownload',
      type: 'checkbox',
      label: 'Default to Allow Photo Downloads',
      defaultValue: false,
      admin: {
        description: 'New galleries start with client photo downloads turned on.',
      },
    },
  ],
}
