import type { GlobalConfig } from 'payload'

// Storage for the Puck visual-builder POC (TYN-214). The whole page document
// is a single Puck JSON blob. Edited via the custom /builder route, not the
// Payload admin form, so this global is hidden from the nav.
export const Builder: GlobalConfig = {
  slug: 'builder',
  label: 'Page Builder (POC)',
  admin: {
    hidden: true,
  },
  fields: [
    {
      name: 'data',
      type: 'json',
      label: 'Builder Document',
    },
  ],
}
