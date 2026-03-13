import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { allPhotosQuery, galleriesQuery } from '@/sanity/queries'
import PortfolioGrid from './PortfolioGrid'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Portfolio | Tynnell Hollins Photography',
  description: 'Browse the full collection — weddings, portraits, families, couples, and more.',
}

export default async function PortfolioPage() {
  const [{ data: photos }, { data: galleries }] = await Promise.all([
    sanityFetch({ query: allPhotosQuery }),
    sanityFetch({ query: galleriesQuery }),
  ])

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>The Work</p>
        <h1 className={styles.heading}>Portfolio</h1>
        <p className={styles.subheading}>Every story, every moment, every face</p>
      </div>
      <PortfolioGrid photos={photos ?? []} galleries={galleries ?? []} />
    </main>
  )
}
