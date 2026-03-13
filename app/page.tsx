import { client } from '@/sanity/lib/client'
import {
  heroSlidesQuery,
  featuredPhotosQuery,
  testimonialsQuery,
  aboutPageQuery,
} from '@/sanity/queries'
import Hero from './components/Hero/Hero'
import PortfolioTeaser from './components/PortfolioTeaser/PortfolioTeaser'
import AboutPreview from './components/AboutPreview/AboutPreview'
import Testimonials from '@/app/components/Testimonials/Testimonials'
import Contact from '@/app/components/Contact/Contact'

export const revalidate = 60

export default async function Home() {
  const [heroSlides, featuredPhotos, testimonials, about] = await Promise.all([
    client.fetch(heroSlidesQuery),
    client.fetch(featuredPhotosQuery),
    client.fetch(testimonialsQuery),
    client.fetch(aboutPageQuery),
  ])

  return (
    <main>
      <Hero slides={heroSlides ?? []} />
      <PortfolioTeaser photos={featuredPhotos ?? []} />
      <AboutPreview about={about ?? null} />
      <Testimonials testimonials={testimonials ?? []} />
      <Contact />
    </main>
  )
}