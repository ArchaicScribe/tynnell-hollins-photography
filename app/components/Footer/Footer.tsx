import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CONTACT_EMAIL } from '@/app/lib/constants'
import styles from './Footer.module.css'

const INSTAGRAM_URL = 'https://instagram.com/tynnellhollinsphotography'
const TIKTOK_URL = 'https://tiktok.com/@tynnellhollinsphotography'

export default async function Footer() {
  const year = new Date().getFullYear()

  const payload = await getPayload({ config })
  const { docs: stripPhotos } = await payload.find({
    collection: 'photos',
    where: { featured: { equals: true } },
    sort: '-updatedAt',
    limit: 4,
    depth: 0,
  })

  return (
    <footer className={styles.footer}>
      {/* CTA row */}
      <div className={styles.cta}>
        <p className={styles.ctaText}>
          Send me a message, and I&apos;ll set up a free discovery call to start planning your dream session.
        </p>
        <Link href="/contact" className={styles.ctaLink}>
          Let&apos;s connect
        </Link>
      </div>

      {/* Instagram strip */}
      <div className={styles.instagram}>
        <div className={styles.igInfo}>
          <p className={styles.igLabel}>Follow me on Instagram</p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.igHandle}
            aria-label="Tynnell Hollins Photography on Instagram"
          >
            @tynnellhollinsphotography
          </a>
        </div>
        {stripPhotos.length > 0 && (
          <div className={styles.igPhotos} aria-hidden="true">
            {stripPhotos.map(photo => {
              const src = photo.sizes?.card?.url ?? photo.url
              if (!src) return null
              return (
                <div key={photo.id} className={styles.igPhoto}>
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="120px"
                    className={styles.igPhotoImg}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className={styles.socials}>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            aria-label="Instagram"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
          <a
            href={TIKTOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
            aria-label="TikTok"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.22 8.22 0 0 0 4.82 1.55V6.79a4.85 4.85 0 0 1-1.05-.1z" />
            </svg>
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className={styles.socialLink}
            aria-label={`Email ${CONTACT_EMAIL}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </a>
        </div>
        <p className={styles.copy}>&copy; {year} Tynnell Hollins Photography</p>
      </div>
    </footer>
  )
}
