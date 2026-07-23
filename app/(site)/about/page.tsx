import type { Metadata } from 'next'
import { cache } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from 'lexical'
import { getPayload } from 'payload'
import { Render, resolveAllData } from '@measured/puck/rsc'
import type { Data } from '@measured/puck'
import config from '@payload-config'
import { config as puckConfig } from '@/app/builder/puck.config'
import type { Photo } from '@/payload-types'
import JsonLd from '@/app/components/JsonLd/JsonLd'
import styles from './page.module.css'

// About content rarely changes - revalidate every 2 minutes
export const revalidate = 120

const getAboutData = cache(async () => {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'about-page', depth: 1 })
})

// A builder page can be promoted to replace this real route (same idea as
// isHomepage's promotion of "/", generalized - see collections/Pages.ts).
// Shared via cache() so generateMetadata and the page body see one DB read.
const getPromotedAboutPage = cache(async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ promotedRoute: { equals: 'about' } }, { published: { equals: true } }] },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
})

export async function generateMetadata(): Promise<Metadata> {
  const promoted = await getPromotedAboutPage()
  if (promoted) {
    return { title: promoted.title }
  }

  const about = await getAboutData()
  const headshotPhoto = typeof about?.headshot === 'object' && about.headshot !== null
    ? about.headshot as Photo
    : null
  const ogImageUrl = headshotPhoto?.sizes?.hero?.url ?? headshotPhoto?.url ?? null

  return {
    title: 'About',
    description: 'Meet Tynnell Hollins, New Mexico photographer specializing in weddings, engagements, portraits, and family sessions.',
    ...(ogImageUrl && {
      openGraph: { images: [{ url: ogImageUrl, alt: 'Tynnell Hollins' }] },
      twitter: { images: [ogImageUrl] },
    }),
  }
}

type AboutValue = {
  heading: string
  body?: string
}

const DEFAULT_VALUES: AboutValue[] = [
  { heading: 'Weddings' },
  { heading: 'Engagements' },
  { heading: 'Portraits' },
  { heading: 'Family Sessions' },
  { heading: 'Maternity' },
  { heading: 'Events' },
]

// Static Person schema used for the promoted (Puck) branch - deliberately not
// derived from the about-page global or any Puck block props (no "schema-
// aware block" convention exists in this codebase). Kept separate from the
// hardcoded branch's personSchema below, which additionally includes the
// live headshot image.
const PROMOTED_PERSON_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Tynnell Hollins',
  jobTitle: 'Photographer',
  url: 'https://tynnellhollinsphotography.com/about',
  sameAs: ['https://instagram.com/tynnellhollinsphotography'],
  worksFor: {
    '@type': 'LocalBusiness',
    name: 'Tynnell Hollins Photography',
    url: 'https://tynnellhollinsphotography.com',
  },
  knowsAbout: ['Wedding Photography', 'Portrait Photography', 'Family Photography', 'Engagement Photography', 'Maternity Photography'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Albuquerque',
    addressRegion: 'NM',
    addressCountry: 'US',
  },
}

export default async function AboutPage() {
  const promoted = await getPromotedAboutPage()
  if (promoted) {
    const data = (promoted.content as Data | undefined) ?? { content: [], root: {} }
    return (
      <>
        <JsonLd data={PROMOTED_PERSON_SCHEMA} />
        <Render config={puckConfig} data={await resolveAllData(data, puckConfig)} />
      </>
    )
  }

  const about = await getAboutData()

  const headshotPhoto = typeof about?.headshot === 'object' && about.headshot !== null
    ? about.headshot as Photo
    : null
  const headshotHeroUrl = headshotPhoto?.sizes?.hero?.url ?? headshotPhoto?.url ?? null
  const headshotUrl = headshotPhoto?.sizes?.card?.url ?? headshotPhoto?.url ?? null

  type RawValue = { heading?: string | null; body?: string | null }
  const specialties: AboutValue[] = about?.values?.length
    ? about.values.map((v: RawValue) => ({ heading: v.heading ?? '', body: v.body ?? undefined }))
    : DEFAULT_VALUES

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Tynnell Hollins',
    jobTitle: 'Photographer',
    url: 'https://tynnellhollinsphotography.com/about',
    sameAs: ['https://instagram.com/tynnellhollinsphotography'],
    worksFor: {
      '@type': 'LocalBusiness',
      name: 'Tynnell Hollins Photography',
      url: 'https://tynnellhollinsphotography.com',
    },
    knowsAbout: ['Wedding Photography', 'Portrait Photography', 'Family Photography', 'Engagement Photography', 'Maternity Photography'],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Albuquerque',
      addressRegion: 'NM',
      addressCountry: 'US',
    },
    ...(headshotUrl && { image: headshotUrl }),
  }

  return (
    <main className={styles.main}>
      <JsonLd data={personSchema} />

      {/* Hero */}
      <section className={styles.hero}>
        {headshotHeroUrl && (
          <Image
            src={headshotHeroUrl}
            alt="Tynnell Hollins"
            fill
            priority
            sizes="100vw"
            quality={90}
            className={styles.heroImg}
          />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>About</p>
          <h1 className={styles.heroHeading}>Tynnell Hollins</h1>
          <p className={styles.heroSub}>The Woman Behind the Lens</p>
        </div>
      </section>

      {/* Story */}
      <section className={styles.story}>
        <div className={styles.storyImage}>
          <div className={styles.headshotSlot}>
            {headshotUrl ? (
              <Image
                src={headshotUrl}
                alt={about?.headshotAlt ?? 'Tynnell Hollins'}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={90}
                className={styles.headshotImg}
              />
            ) : (
              <span className={styles.placeholderLabel}>Photographer portrait</span>
            )}
          </div>
        </div>
        <div className={styles.storyContent}>
          <p className={styles.sectionEyebrow}>My Story</p>
          <h2 className={styles.sectionHeading}>Where It All Began</h2>
          {about?.bio ? (
            <div className={styles.bioBody}>
              <RichText data={about.bio as SerializedEditorState} />
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

      {/* Philosophy */}
      <section className={styles.philosophy} aria-label="My Approach">
        <p className={styles.sectionEyebrow}>My Approach</p>
        <blockquote className={styles.philosophyQuote}>
          {about?.tagline ??
            "I don’t just take photographs. I preserve the in-between moments. The laugh before the kiss. The tear that falls before you even know it’s there."}
        </blockquote>
        <p className={styles.philosophyBody}>
          {"Whether it’s a wedding of three hundred or an intimate session for two, the goal is always the same: images that feel like a memory rather than a photograph. Warm, honest, and undeniably yours."}
        </p>
      </section>

      {/* Specialties */}
      <section className={styles.specialties}>
        <p className={styles.sectionEyebrow}>What I Shoot</p>
        <h2 className={styles.sectionHeading}>
          {"Capturing Life’s Most"}<br />Meaningful Moments
        </h2>
        <ul className={styles.specialtyList}>
          {specialties.map((item) => (
            <li key={item.heading} className={styles.specialtyItem}>
              <span className={styles.specialtyDot} aria-hidden="true" />
              <span className={styles.specialtyContent}>
                <span className={styles.specialtyHeading}>{item.heading}</span>
                {item.body && (
                  <span className={styles.specialtyBody}>{item.body}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <p className={styles.sectionEyebrow}>{"Let’s Work Together"}</p>
        <h2 className={styles.ctaHeading}>
          Ready to Create<br />Something Beautiful?
        </h2>
        <p className={styles.ctaBody}>
          {"I’d love to hear about your story and how I can help you preserve it."}
        </p>
        <Link href="/contact" className={styles.ctaBtn}>Book a Session</Link>
      </section>

    </main>
  )
}
