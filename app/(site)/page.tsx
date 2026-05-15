import { getPayload } from 'payload'
import config from '@payload-config'
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

export default async function Home() {
  const payload = await getPayload({ config })

  const [heroData, { docs: featuredPhotos }, { docs: testimonials }, aboutData] =
    await Promise.all([
      payload.findGlobal({ slug: 'hero-slides', depth: 1 }),
      payload.find({ collection: 'photos', where: { featured: { equals: true } }, sort: 'displayOrder', depth: 0 }),
      payload.find({ collection: 'testimonials', sort: 'displayOrder', depth: 0 }),
      payload.findGlobal({ slug: 'about-page', depth: 1 }),
    ])

  const slides: HeroSlide[] = (heroData?.slides ?? []).map((slide, i) => {
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

  return (
    <main>
      <Hero slides={slides} />
      <PortfolioTeaser photos={photos} />
      <AboutPreview about={about} />
      <Testimonials testimonials={testimonialItems} />
      <Contact />
    </main>
  )
}
