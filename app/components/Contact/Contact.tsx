import styles from './Contact.module.css';
import Link from 'next/link';

export default function Contact() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>GET IN TOUCH</p>
        <h2 className={styles.heading}>Let&apos;s Create Something Beautiful</h2>
        <p className={styles.body}>
          Ready to capture your story? Reach out and let&apos;s start planning
          your session together.
        </p>
        <Link href="/contact" className={styles.btn}>
          BOOK A SESSION
        </Link>
      </div>
    </section>
  );
}