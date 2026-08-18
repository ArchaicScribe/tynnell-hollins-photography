import { preload } from 'react-dom'
import { getPayload } from 'payload'
import { Render, resolveAllData } from '@measured/puck/rsc'
import type { Data } from '@measured/puck'
import config from '@payload-config'
import { config as puckConfig } from '@/app/builder/puck.config'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import { getSiteConfig } from '@/app/lib/siteConfig'
import { isPreviewMode } from '@/app/lib/builderPreview'
import Hero from '@/app/components/Hero/Hero'
import PortfolioTeaser from '@/app/components/PortfolioTeaser/PortfolioTeaser'
import AboutPreview from '@/app/components/AboutPreview/AboutPreview'
import Testimonials from '@/app/components/Testimonials/Testimonials'
import Contact from '@/app/components/Contact/Contact'
import type { HeroSlide } from '@/app/components/Hero/Hero'
import type { FeaturedPhoto } from '@/app/components/PortfolioTeaser/PortfolioTeaser'
import type { AboutData } from '@/app/components/AboutPreview/AboutPreview'
import type { Testimonial } from '@/app/components/Testimonials/Testimonials'
import type { Photo } from '@/payload-types'

// Revalidate every 2 minutes - hero slides, photos, and testimonials change infrequently
export const revalidate = 120

// Portfolio categories that represent real client work. An uncategorised photo
// is library staging (untagged uploads, texture assets) and is not something to
// hand Google as a picture of the business.
const REAL_CATEGORIES = ['weddings', 'portraits', 'families', 'couples', 'brands'] as const

// Prefer a featured photo, fall back to any real portfolio photo, and return
// null rather than something stale. The old value here was the static
// /og-image.jpg wordmark card, which drifted a whole design system out of date
// unnoticed and was a poor choice regardless: Google may surface this as the
// picture of the business, where a photograph serves better than a logo plate.
async function resolveSchemaImage(payload: Awaited<ReturnType<typeof getPayload>>): Promise<string | null> {
  const pick = (docs: Photo[]) => {
    const ph = docs.find(d => d.sizes?.hero?.url ?? d.url)
    return ph?.sizes?.hero?.url ?? ph?.url ?? null
  }
  const { docs: featured } = await payload.find({
    collection: 'photos',
    where: { featured: { equals: true } },
    sort: 'displayOrder',
    depth: 0,
    limit: 1,
  })
  const fromFeatured = pick(featured as Photo[])
  if (fromFeatured) return fromFeatured

  const { docs: anyReal } = await payload.find({
    collection: 'photos',
    where: { category: { in: [...REAL_CATEGORIES] } },
    sort: 'displayOrder',
    depth: 0,
    limit: 1,
  })
  return pick(anyReal as Photo[])
}

// One schema shared by both render paths. It previously existed only in the
// hardcoded branch, so once a builder page was promoted to the homepage (which
// it is), the site's primary page emitted NO structured data at all, while
// /about and /portfolio both emit theirs in the promoted branch. This closes
// that gap.
function buildLocalBusinessSchema(site: { title: string; email: string; instagramUrl: string }, imageUrl: string | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.title,
    description:
      'Tynnell Hollins is a wedding and portrait photographer capturing authentic moments for couples and families.',
    url: 'https://tynnellhollinsphotography.com',
    email: site.email,
    // Conditional spread rather than a stale placeholder, matching the idiom
    // already used by the About and blog-post schemas.
    ...(imageUrl && { image: imageUrl }),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Albuquerque',
      addressRegion: 'NM',
      addressCountry: 'US',
    },
    areaServed: [
      { '@type': 'City', name: 'Albuquerque' },
      { '@type': 'State', name: 'New Mexico' },
    ],
    sameAs: [site.instagramUrl].filter(Boolean),
    founder: {
      '@type': 'Person',
      name: 'Tynnell Hollins',
      jobTitle: 'Photographer',
    },
  }
}

export default async function Home() {
  const site = await getSiteConfig()
  const payload = await getPayload({ config })

  // A builder page can be promoted to the site homepage (TYN-227). When one is
  // flagged + published it renders at "/" in place of the built-in home below.
  const preview = await isPreviewMode()
  const { docs: homepageDocs } = await payload.find({
    collection: 'pages',
    where: preview
      ? { isHomepage: { equals: true } }
      : { and: [{ isHomepage: { equals: true } }, { published: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  const localBusinessSchema = buildLocalBusinessSchema(site, await resolveSchemaImage(payload))

  const homepage = homepageDocs[0]
  if (homepage) {
    const data = (homepage.content as Data | undefined) ?? { content: [], root: {} }
    // resolveAllData runs each block's own resolveData hook (if it defines
    // one) before render - Render() itself does not do this automatically.
    // No block defines resolveData yet, so this is currently a no-op; it's
    // the prerequisite plumbing future data-bound blocks (e.g. live
    // Services/Testimonials) depend on.
    return (
      <>
        <JsonLd data={localBusinessSchema} />
        <Render config={puckConfig} data={await resolveAllData(data, puckConfig)} />
      </>
    )
  }

  const [heroData, { docs: featuredPhotos }, { docs: testimonials }, aboutData] =
    await Promise.all([
      payload.findGlobal({ slug: 'hero-slides', depth: 1 }),
      payload.find({ collection: 'photos', where: { featured: { equals: true } }, sort: 'displayOrder', depth: 0, limit: 6 }),
      payload.find({ collection: 'testimonials', where: { featured: { equals: true } }, sort: 'displayOrder', depth: 0, limit: 20 }),
      payload.findGlobal({ slug: 'about-page', depth: 1 }),
    ])

  type RawSlide = { image: import('@/payload-types').Photo | string | number; caption?: string | null }
  const slides: HeroSlide[] = (heroData?.slides ?? []).map((slide: RawSlide, i) => {
    const photo = typeof slide.image === 'object' && slide.image !== null ? slide.image as Photo : null
    return {
      id: String(i),
      imageUrl: photo?.sizes?.hero?.url ?? photo?.url ?? null,
      alt: photo?.alt ?? undefined,
      tagline: slide.caption ?? undefined,
    }
  })

  const photos: FeaturedPhoto[] = featuredPhotos.map(p => ({
    id: String(p.id),
    title: p.title,
    alt: p.alt ?? undefined,
    imageUrl: p.sizes?.card?.url ?? p.url ?? null,
    category: p.category ?? undefined,
  }))

  const testimonialItems: Testimonial[] = testimonials.map(t => ({
    _id: String(t.id),
    clientName: t.clientName,
    quote: t.quote,
    sessionType: t.sessionType ?? undefined,
  }))

  const headshotPhoto = typeof aboutData?.headshot === 'object' && aboutData.headshot !== null
    ? aboutData.headshot as Photo
    : null
  const about: AboutData = {
    headshotUrl: headshotPhoto?.sizes?.card?.url ?? headshotPhoto?.url ?? null,
    headshotAlt: aboutData?.headshotAlt ?? undefined,
    tagline: aboutData?.tagline ?? undefined,
    previewBio: aboutData?.previewBio ?? undefined,
  }

  // Fall back to the static hero image if no slides have been configured in the admin yet.
  const fallbackSlide: HeroSlide[] = [
    { id: 'revamp-bg', imageUrl: '/hero-background.jpg', alt: 'Tynnell Hollins Photography' },
  ]

  // Preload the actual first hero image (admin slide or fallback) for LCP.
  // CSS background-image is not auto-preloaded; this emits a <link rel="preload">.
  const firstHeroUrl = slides.find(s => s.imageUrl)?.imageUrl ?? '/hero-background.jpg'
  preload(firstHeroUrl, { as: 'image', fetchPriority: 'high' })

  return (
    <main>
      <JsonLd data={localBusinessSchema} />
      <Hero slides={slides.length ? slides : fallbackSlide} />
      <PortfolioTeaser photos={photos} />
      <AboutPreview about={about} />
      <Testimonials testimonials={testimonialItems} />
      <Contact />
    </main>
  )
}
