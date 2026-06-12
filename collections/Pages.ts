import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'

// Builder pages (TYN-216). Each row is one page composed in the visual builder.
// `content` holds the Puck document JSON. Managed via the /builder UI, so the
// collection is hidden from the Payload admin nav.
//
// Placement flags (TYN-226 / TYN-227):
// - `showInNav` adds the page to the public site menu (Navbar + mobile menu).
// - `isHomepage` makes the page render at "/" instead of the built-in home.
// Both are surfaced as toggles in the /builder page list, not edited here.
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    hidden: true,
  },
  hooks: {
    // The public site menu is read in the shared (site) layout and the home
    // route. Bust both whenever a page changes so toggling "show in menu" or
    // "set as homepage" (and edits/publishes) appears on the site immediately.
    afterChange: [
      ({ doc }) => {
        revalidatePath('/', 'layout')
        if (doc?.slug) revalidatePath(`/${doc.slug}`)
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidatePath('/', 'layout')
        if (doc?.slug) revalidatePath(`/${doc.slug}`)
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'content', type: 'json' },
    { name: 'published', type: 'checkbox', defaultValue: false },
    { name: 'displayOrder', type: 'number' },
    { name: 'showInNav', type: 'checkbox', defaultValue: false },
    { name: 'isHomepage', type: 'checkbox', defaultValue: false },
  ],
}
