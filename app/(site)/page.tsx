import { sanityFetch } from '@/sanity/lib/live'
import {
  heroSlidesQuery,
  featuredPhotosQuery,
  testimonialsQuery,
  aboutPageQuery,
} from '@/sanity/queries'
import Hero from '@/app/components/Hero/Hero'
import PortfolioTeaser from '@/app/components/PortfolioTeaser/PortfolioTeaser'
import AboutPreview from '@/app/components/AboutPreview/AboutPreview'
import Testimonials from '@/app/components/Testimonials/Testimonials'
import Contact from '@/app/components/Contact/Contact'

export default async function Home() {
  const [
    { data: heroSlides },
    { data: featuredPhotos },
    { data: testimonials },
    { data: about },
  ] = await Promise.all([
    sanityFetch({ query: heroSlidesQuery }),
    sanityFetch({ query: featuredPhotosQuery }),
    sanityFetch({ query: testimonialsQuery }),
    sanityFetch({ query: aboutPageQuery }),
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