import styles from './Testimonials.module.css';

const testimonials = [
  {
    id: 1,
    name: 'Jaqui C.',
    quote:
      'Tynnell made me feel so confident and beautiful during my bridal session. I was a little nervous going in, but she immediately put me at ease with her calm energy and gentle direction. The final gallery was everything I hoped for and more: timeless, romantic, and full of emotion.',
  },
  {
    id: 2,
    name: 'Catalina S.',
    quote:
      'Tynnell has photographed every special moment in our lives, so of course we trusted her with my daughter\'s senior session. She made her feel so confident and comfortable, and the photos truly captured her spirit. Tynnell\'s work and heart always blow us away.',
  },
  {
    id: 3,
    name: 'Martinez Family',
    quote:
      'Our at-home session with Tynnell was everything we didn\'t know we needed. She captured the love, softness, and newness of this season so effortlessly, and all in the comfort of our own space. The photos feel so personal and true to us.',
  },
];

export default function Testimonials() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>KIND WORDS</p>
        <h2 className={styles.heading}>Client Testimonials</h2>
      </div>
      <div className={styles.grid}>
        {testimonials.map((t) => (
          <div key={t.id} className={styles.card}>
            <div className={styles.stars}>★★★★★</div>
            <hr className={styles.divider} />
            <p className={styles.name}>{t.name}</p>
            <hr className={styles.divider} />
            <p className={styles.quote}>{t.quote}</p>
          </div>
        ))}
      </div>
    </section>
  );
}