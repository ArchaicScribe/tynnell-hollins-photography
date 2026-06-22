import { preload } from 'react-dom'
import { getPayload } from 'payload'
import { Render } from '@measured/puck/rsc'
import type { Data } from '@measured/puck'
import config from '@payload-config'
import { config as puckConfig } from '@/app/builder/puck.config'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import { CONTACT_EMAIL } from '@/app/lib/constants'
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

export default async function Home() {
  // Preload the hero background so the browser fetches it early (LCP boost).
  // CSS background-image is not auto-preloaded; this emits a <link rel="preload">.
  preload('/hero-background.jpg', { as: 'image', fetchPriority: 'high' })

  const payload = await getPayload({ config })

  // A builder page can be promoted to the site homepage (TYN-227). When one is
  // flagged + published it renders at "/" in place of the built-in home below.
  const { docs: homepageDocs } = await payload.find({
    collection: 'pages',
    where: { and: [{ isHomepage: { equals: true } }, { published: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  const homepage = homepageDocs[0]
  if (homepage) {
    const data = (homepage.content as Data | undefined) ?? { content: [], root: {} }
    return <Render config={puckConfig} data={data} />
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

  // Revamp background (temporary): show this single photo as the homepage hero
  // while the site is being rebuilt. To restore Hero Slides management, pass
  // `slides` to <Hero/> again and delete this constant.
  const revampHero: HeroSlide[] = [
    { id: 'revamp-bg', imageUrl: '/hero-background.jpg', alt: 'Tynnell Hollins Photography' },
  ]

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Tynnell Hollins Photography',
    description:
      'Tynnell Hollins is a wedding and portrait photographer capturing authentic moments for couples and families.',
    url: 'https://tynnellhollinsphotography.com',
    email: CONTACT_EMAIL,
    image: 'https://tynnellhollinsphotography.com/og-image.jpg',
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
    sameAs: [
      'https://instagram.com/tynnellhollinsphotography',
    ],
    founder: {
      '@type': 'Person',
      name: 'Tynnell Hollins',
      jobTitle: 'Photographer',
    },
  }

  return (
    <main>
      <JsonLd data={localBusinessSchema} />
      <Hero slides={revampHero.length ? revampHero : slides} />
      <PortfolioTeaser photos={photos} />
      <AboutPreview about={about} />
      <Testimonials testimonials={testimonialItems} />
      <Contact />
    </main>
  )
}
