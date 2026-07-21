import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { revalidatePath } from 'next/cache'

// Builder pages (TYN-216). Each row is one page composed in the visual builder.
// `content` holds the Puck document JSON. Managed via /builder, hidden from admin nav.
//
// Placement flags (TYN-226 / TYN-227):
// - `showInNav` adds the page to the public site menu (Navbar + mobile menu).
// - `isHomepage` makes the page render at "/" instead of the built-in home.
// - `promotedRoute` makes the page render at that real, hand-coded route instead
//   of its own hardcoded body (same idea as isHomepage, generalized to more
//   than one route so each new promotable page doesn't need its own boolean
//   field). Deliberately a separate field from isHomepage rather than folding
//   Home into its options - isHomepage already shipped and works, and Home's
//   check lives in a different file (app/(site)/page.tsx) than every other
//   promoted route would, so unifying them isn't worth the migration risk.
// 'portfolio/weddings' promotes real Gallery album cards via the AlbumGrid
// Puck block (app/builder/puck.config.tsx), alongside PortfolioGrid for its
// individual wedding photos - together they match what the hardcoded page
// already shows, so promoting it doesn't drop either feature.
const PROMOTABLE_ROUTES = ['about', 'portfolio', 'portfolio/portraits', 'portfolio/family', 'portfolio/weddings'] as const

// Only one page may claim a given real route at a time - unlike isHomepage
// (which has no such guard and silently first-match-wins if ever duplicated),
// this makes a collision a clear save-time validation error instead of an
// undefined "whichever Payload returns first" race.
const preventDuplicatePromotion: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const route = data.promotedRoute as string | undefined
  if (!route) return data
  if (originalDoc?.promotedRoute === route) return data
  const { docs } = await req.payload.find({
    collection: 'pages',
    where: { promotedRoute: { equals: route } },
    limit: 1,
    depth: 0,
  })
  const conflict = docs.find((d) => d.id !== originalDoc?.id)
  if (conflict) {
    throw new APIError(
      `"${conflict.title}" is already promoted to /${route}. Un-promote it first before promoting another page to the same route.`,
      400,
    )
  }
  return data
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Site Page', plural: 'Site Pages' },
  admin: {
    useAsTitle: 'title',
    hidden: true,
  },
  hooks: {
    beforeChange: [preventDuplicatePromotion],
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
    {
      name: 'promotedRoute',
      type: 'select',
      label: 'Replace a real page',
      admin: {
        description: 'Make this page render at one of your real site routes instead of its own URL. Only one page can be promoted to a given route at a time.',
      },
      options: PROMOTABLE_ROUTES.map((r) => ({ label: `/${r}`, value: r })),
    },
  ],
}
