import styles from './page.module.css'

export default function PortfolioPage() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Portfolio</h1>
        <p className={styles.subheading}>The full collection</p>
      </div>
      <div className={styles.filterBar}>
        {['All', 'Weddings', 'Portraits', 'Engagements', 'Family', 'Graduation', 'Sports'].map((cat) => (
          <button key={cat} className={styles.filterBtn}>{cat}</button>
        ))}
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles.imageSlot}>
            <span className={styles.placeholderLabel}>Photo {i + 1}</span>
          </div>
        ))}
      </div>
    </main>
  )
}