import Hero from './components/Hero/Hero'
import PortfolioTeaser from './components/PortfolioTeaser/PortfolioTeaser'
import AboutPreview from './components/AboutPreview/AboutPreview'
import Testimonials from '@/app/components/Testimonials/Testimonials';

export default function Home() {
  return (
    <main>
      <Hero />
      <PortfolioTeaser />
      <AboutPreview />
      <Testimonials />
    </main>
  )
}