import Link from 'next/link'
import { ProtectedImage } from '@/app/components/ProtectedImage/ProtectedImage'
import styles from './AboutPreview.module.css'

export interface AboutData {
  headshotUrl: string | null
  headshotAlt?: string
  tagline?: string
  previewBio?: string
}

interface Props {
  about: AboutData | null
}

export default function AboutPreview({ about }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.imageSlot}>
        {about?.headshotUrl ? (
          <ProtectedImage
            src={about.headshotUrl}
            alt={about?.headshotAlt ?? 'Tynnell Hollins'}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={styles.headshotImg}
          />
        ) : (
          <span className={styles.placeholderLabel}>Photographer portrait</span>
        )}
      </div>
      <div className={styles.content}>
        <p className={styles.eyebrow}>About</p>
        <p className={styles.greeting}>{"Hey, I'm Tynnell Hollins"}</p>
        <h2 className={styles.heading}>{about?.tagline ?? 'Every Moment Deserves to Last Forever'}</h2>
        <p className={styles.body}>
          {about?.previewBio ??
            'Based in New Mexico, I believe the best images are the ones that feel like a memory. Warm, honest, and full of life. From weddings to family portraits, I bring the same quiet attention to every session.'}
        </p>
        <Link href="/about" className={styles.cta}>My Story</Link>
      </div>
    </section>
  )
}