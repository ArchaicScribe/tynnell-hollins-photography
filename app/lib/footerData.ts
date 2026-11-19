import { getPayload } from 'payload'
import config from '@payload-config'
import { navLinks, navRow, type NavLink } from '@/app/constants/nav'
import { getBuilderNavLinks } from '@/app/lib/nav'

// Everything the footer reads from the database, in one guarded call. The footer
// is on every page, so a database error here must cost the page only the strip
// and the extra links, never the page itself: any failure returns the empty set.

export const STRIP_MAX = 6
export const TERMS_SLUG = 'terms-and-conditions'
export const PRIVACY_SLUG = 'privacy-statement'

export interface FooterData {
  stripPhotos: { id: number; src: string }[]
  builderLinks: NavLink[]
  hasTerms: boolean
  hasPrivacy: boolean
}

const empty = (): FooterData => ({ stripPhotos: [], builderLinks: [], hasTerms: false, hasPrivacy: false })

// Every page the footer already lists (the nav constants, children included) or
// links to in the bottom row. A builder page flagged show-in-menu at one of these
// addresses would otherwise appear twice.
function alreadyLinked(): Set<string> {
  const hrefs = new Set<string>([`/${TERMS_SLUG}`, `/${PRIVACY_SLUG}`, navRow.cta.href])
  const add = (link: NavLink) => {
    hrefs.add(link.href)
    link.children?.forEach(add)
  }
  navLinks.forEach(add)
  ;[...navRow.left, ...navRow.right].forEach(add)
  return hrefs
}

export async function getFooterData(): Promise<FooterData> {
  try {
    const payload = await getPayload({ config })

    const hasPublishedPage = async (slug: string) => {
      const { docs } = await payload.find({
        collection: 'pages',
        where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
        limit: 1,
        depth: 0,
      })
      return docs.length > 0
    }

    const [photos, hasTerms, hasPrivacy, builderLinks] = await Promise.all([
      payload.find({
        collection: 'photos',
        where: { featured: { equals: true } },
        sort: '-updatedAt',
        limit: STRIP_MAX,
        depth: 0,
      }),
      hasPublishedPage(TERMS_SLUG),
      hasPublishedPage(PRIVACY_SLUG),
      getBuilderNavLinks(),
    ])

    const listed = alreadyLinked()
    const stripPhotos = photos.docs
      .slice(0, STRIP_MAX)
      .flatMap((photo) => {
        const src = photo.sizes?.card?.url ?? photo.url
        return src ? [{ id: photo.id, src }] : []
      })

    return {
      stripPhotos,
      builderLinks: builderLinks.filter((link) => !listed.has(link.href)),
      hasTerms,
      hasPrivacy,
    }
  } catch (err) {
    console.error('[footer] could not read footer data, rendering without it:', err)
    return empty()
  }
}
