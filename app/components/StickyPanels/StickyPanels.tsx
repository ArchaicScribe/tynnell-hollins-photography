'use client'

import { useActiveOnScroll } from '@/app/hooks/useActiveOnScroll'
import styles from './StickyPanels.module.css'

export type StickyPanel = { imageUrl: string; heading: string; text: string }

const hasContent = (p: StickyPanel) => Boolean(p.heading?.trim() || p.text?.trim() || p.imageUrl?.trim())

// The photo for the panel in view. A panel without its own photo keeps the
// nearest earlier one, so the pinned column never goes blank mid-scroll. If
// no earlier panel has a photo either, fall forward to the first one that
// does, so the column is filled from the start.
function photoFor(panels: StickyPanel[], activeIndex: number): StickyPanel | null {
  for (let i = activeIndex; i >= 0; i--) if (panels[i]?.imageUrl) return panels[i]
  return panels.find((p) => p.imageUrl) ?? null
}

// Rising Roots "things that make my heart full" / "what's included": one
// photo pinned on one side while short panels scroll past on the other, the
// photo changing to match the panel in view. A general version of the
// sticky testimonials layout, for any content.
export default function StickyPanels({
  heading,
  panels,
  photoSide = 'left',
}: {
  heading?: string
  panels: StickyPanel[]
  photoSide?: 'left' | 'right'
}) {
  const shown = (panels ?? []).filter(hasContent)
  const { activeIndex, itemRef } = useActiveOnScroll(shown.length)

  if (shown.length === 0) return null

  const photo = photoFor(shown, activeIndex)

  return (
    <div className={styles.wrap}>
      {heading && <h2 className={styles.heading}>{heading}</h2>}
      <div className={`${styles.layout} ${photoSide === 'right' ? styles.photoRight : ''}`}>
        <div className={styles.photoCol} data-testid="sticky-panels-photo">
          <div className={styles.photoFrame}>
            {photo && (
              // Plain <img>, like the rest of the builder blocks, so the
              // editor canvas and the public page render the same thing.
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo.imageUrl} src={photo.imageUrl} alt={photo.heading} className={styles.photo} />
            )}
          </div>
        </div>
        <div className={styles.panels}>
          {shown.map((p, i) => (
            <article key={i} ref={itemRef(i)} className={styles.panel}>
              {p.heading && <h3 className={styles.panelHeading}>{p.heading}</h3>}
              {p.text && <p className={styles.panelText}>{p.text}</p>}
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
