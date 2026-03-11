'use client'
import Link from 'next/link'
import styles from './AboutPreview.module.css'

export default function AboutPreview() {
  return (
    <section className={styles.section}>
      <div className={styles.imageSlot}>
        <span className={styles.placeholderLabel}>Photographer portrait</span>
      </div>
      <div className={styles.content}>
        <p className={styles.eyebrow}>About Tynnell</p>
        <h2 className={styles.heading}>Every Moment Deserves to Last Forever</h2>
        <p className={styles.body}>
          Based in New Mexico, Tynnell Hollins is a photographer who believes the
          best images are the ones that feel like a memory — warm, honest, and
          full of life. From weddings to family portraits, she brings the same
          quiet attention to every shoot.
        </p>
        <Link href="/about" className={styles.cta}>Meet Tynnell</Link>
      </div>
    </section>
  )
}