import { getPayload } from 'payload'
import config from '@payload-config'
import type { NavLink } from '@/app/constants/nav'

// Builder pages flagged "show in menu" (TYN-226). Only published pages appear.
// Read in the (site) layout and merged into the site navigation. Returns [] on
// any failure so a builder/DB hiccup never takes down the whole site menu.
export async function getBuilderNavLinks(): Promise<NavLink[]> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'pages',
      where: { and: [{ showInNav: { equals: true } }, { published: { equals: true } }] },
      sort: 'displayOrder',
      limit: 50,
      depth: 0,
    })
    return docs.map((p) => ({ label: p.title, href: `/${p.slug}` }))
  } catch {
    return []
  }
}
