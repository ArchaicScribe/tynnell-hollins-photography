import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { sanityFetch } from '@/sanity/lib/live'
import { aboutPageQuery } from '@/sanity/queries'
import { urlFor } from '@/sanity/lib/image'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'About | Tynnell Hollins Photography',
  description: 'Meet Tynnell Hollins — New Mexico photographer specializing in weddings, engagements, portraits, and family sessions.',
}

type AboutPage = {
  headshot?: SanityImageSource
  headshotAlt?: string
  tagline?: string
  bio?: PortableTextBlock[]
  values?: string[]
}

const DEFAULT_SPECIALTIES = [
  'Weddings',
  'Engagements',
  'Portraits',
  'Family Sessions',
  'Maternity',
  'Events',
]

export default async function AboutPage() {
  const { data: about } = await sanityFetch({ query: aboutPageQuery }) as { data: AboutPage | null }

  const headshotUrl = about?.headshot
    ? urlFor(about.headshot).width(800).height(1000).fit('crop').auto('format').url()
    : null

  const specialties = about?.values?.length ? about.values : DEFAULT_SPECIALTIES

  return (
    <main className={styles.main}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>About Tynnell</p>
        <h1 className={styles.heroHeading}>
          The Woman<br />Behind the Lens
        </h1>
      </section>

      {/* ── Story ────────────────────────────────────────────── */}
      <section className={styles.story}>
        <div className={styles.storyImage}>
          {headshotUrl ? (
            <Image
              src={headshotUrl}
              alt={about?.headshotAlt ?? 'Tynnell Hollins'}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={styles.headshotImg}
            />
          ) : (
            <span className={styles.placeholderLabel}>Photographer portrait</span>
          )}
        </div>
        <div className={styles.storyContent}>
          <p className={styles.sectionEyebrow}>My Story</p>
          <h2 className={styles.sectionHeading}>Where It All Began</h2>
          {about?.bio ? (
            <div className={styles.bioBody}>
              <PortableText value={about.bio} />
            </div>
          ) : (
            <>
              <p className={styles.bodyText}>
                Based in New Mexico, Tynnell Hollins has spent years learning to
                see the world the way a camera does. Not just the posed, polished
                moments, but the ones in between. The glance across the aisle.
                The way a parent holds their child like they never want to let go.
              </p>
              <p className={styles.bodyText}>
                Photography found Tynnell before she found it. What started as a
                curiosity became a calling. A way to slow time down and give
                people something permanent to hold onto. Every session is
                approached with the same quiet intention: to be present, to
                listen, and to let the moment lead.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── Philosophy ───────────────────────────────────────── */}
      <section className={styles.philosophy}>
        <p className={styles.sectionEyebrow}>My Approach</p>
        <blockquote className={styles.philosophyQuote}>
          {about?.tagline ??
            "I don\u2019t just take photographs. I preserve the in-between moments. The laugh before the kiss. The tear that falls before you even know it\u2019s there."}
        </blockquote>
        <p className={styles.philosophyBody}>
          {"Whether it\u2019s a wedding of three hundred or an intimate session for two, the goal is always the same: images that feel like a memory rather than a photograph. Warm, honest, and undeniably yours."}
        </p>
      </section>

      {/* ── Specialties ──────────────────────────────────────── */}
      <section className={styles.specialties}>
        <p className={styles.sectionEyebrow}>What I Shoot</p>
        <h2 className={styles.sectionHeading}>
          {"Capturing Life\u2019s Most"}<br />Meaningful Moments
        </h2>
        <ul className={styles.specialtyList}>
          {specialties.map((item) => (
            <li key={item} className={styles.specialtyItem}>
              <span className={styles.specialtyDot} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className={styles.cta}>
        <p className={styles.sectionEyebrow}>{"Let\u2019s Work Together"}</p>
        <h2 className={styles.ctaHeading}>
          Ready to Create<br />Something Beautiful?
        </h2>
        <p className={styles.ctaBody}>
          {"I\u2019d love to hear about your story and how I can help you preserve it."}
        </p>
        <Link href="/contact" className={styles.ctaBtn}>Book a Session</Link>
      </section>

    </main>
  )
}
