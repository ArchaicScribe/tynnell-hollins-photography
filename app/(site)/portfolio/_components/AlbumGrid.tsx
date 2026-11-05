import Link from 'next/link'
import { ProtectedImage } from '@/app/components/ProtectedImage/ProtectedImage'
import styles from './AlbumGrid.module.css'

export type AlbumItem = {
  id: string | number
  slug: string
  title: string
  coverUrl: string | null
  coverAlt: string
  previewUrls: string[]
  photoCount: number
}

// Extracted from the original weddings/page.tsx inline markup (unchanged
// behavior: hides the whole section when there are no albums, same as
// before) so the same album-card grid can be reused by the AlbumGrid Puck
// block (app/builder/puck.config.tsx) without duplicating markup.
// `strip` is the Rising Roots "portfolio-scrolling" row: one line of album
// cards that scrolls sideways. The strip is a focusable, labelled region so a
// keyboard user can scroll it too (a scrolling box with nothing focusable in
// view is otherwise unreachable without a mouse or touch).
export type AlbumLayout = 'grid' | 'strip'

export default function AlbumGrid({ albums, layout = 'grid' }: { albums: AlbumItem[]; layout?: AlbumLayout }) {
  if (albums.length === 0) return null

  const isStrip = layout === 'strip'

  return (
    <section className={styles.albums}>
      <h2 className={styles.albumsHeading}>Albums</h2>
      <div
        className={isStrip ? styles.albumStrip : styles.albumGrid}
        {...(isStrip ? { role: 'region', 'aria-label': 'Albums', tabIndex: 0 } : {})}
      >
        {albums.map(album => (
          <Link key={album.id} href={`/portfolio/${album.slug}`} className={styles.albumCard}>
            <div className={styles.albumCover}>
              {album.coverUrl ? (
                <ProtectedImage
                  src={album.coverUrl}
                  alt={album.coverAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={styles.albumImg}
                />
              ) : (
                <div className={styles.noCover} />
              )}
            </div>
            {album.previewUrls.length > 0 && (
              <div className={styles.albumPreviews}>
                {album.previewUrls.slice(0, 3).map((url, i) => (
                  <div key={i} className={styles.albumPreview}>
                    <ProtectedImage
                      src={url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 17vw, 11vw"
                      className={styles.albumImg}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className={styles.albumFooter}>
              <span className={styles.albumTitle}>{album.title}</span>
              <span className={styles.albumMeta}>{album.photoCount} photos</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
