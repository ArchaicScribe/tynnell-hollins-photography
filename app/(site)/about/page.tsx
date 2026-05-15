import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Photo } from '@/payload-types'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'About | Tynnell Hollins Photography',
  description: 'Meet Tynnell Hollins — New Mexico photographer specializing in weddings, engagements, portraits, and family sessions.',
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

export default async function AboutPage() {
  const payload = await getPayload({ config })
  const about = await payload.findGlobal({ slug: 'about-page', depth: 1 })

  const headshotPhoto = typeof about?.headshot === 'object' && about.headshot !== null
    ? about.headshot as Photo
    : null
  const headshotUrl = headshotPhoto?.sizes?.card?.url ?? headshotPhoto?.url ?? null

  const specialties: AboutValue[] = about?.values?.length
    ? about.values.map(v => ({ heading: v.heading ?? '', body: v.body ?? undefined }))
    : DEFAULT_VALUES

  return (
    <main className={styles.main}>

      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.eyebrow}>About Tynnell</p>
        <h1 className={styles.heroHeading}>
          The Woman<br />Behind the Lens
        </h1>
      </section>

      {/* Story */}
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
              <RichText data={about.bio} />
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
      <section className={styles.philosophy}>
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
