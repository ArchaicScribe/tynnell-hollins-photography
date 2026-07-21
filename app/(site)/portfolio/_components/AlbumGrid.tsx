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
export default function AlbumGrid({ albums }: { albums: AlbumItem[] }) {
  if (albums.length === 0) return null

  return (
    <section className={styles.albums}>
      <h2 className={styles.albumsHeading}>Albums</h2>
      <div className={styles.albumGrid}>
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
