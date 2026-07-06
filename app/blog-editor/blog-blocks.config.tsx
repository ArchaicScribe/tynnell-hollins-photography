/* eslint-disable @typescript-eslint/no-explicit-any */
// Blog post body block library. A deliberately small subset of app/builder's
// puck.config.tsx pattern (fields/defaultProps/render), scoped to what the
// in-context blog editor's bottom toolbar offers: Text, Image, Image Grid,
// Video. Same architecture rule as the page builder - the render function is
// identical between the editor canvas and the public /blog/[slug] page, so
// there's no edit/publish mismatch to maintain.
//
// Typography/spacing for Text intentionally reuses the public blog post's own
// CSS module classes (styles.body / styles.body p) rather than re-deriving
// values here, so the editor canvas and the published page can never drift.
import type { ReactNode } from 'react'
import type { Config } from '@measured/puck'
import { ImagePickerField } from '../builder/ImagePickerField'
import styles from '../(site)/blog/[slug]/page.module.css'

const imageField = (label: string) => ({
  type: 'custom' as const,
  label,
  render: ({ value, onChange }: any) => <ImagePickerField value={value} onChange={onChange} />,
})

function isEmbedUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url)
}

function toEmbedSrc(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return url
}

export const blogBlocksConfig: Config = {
  root: {
    render: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  },

  components: {
    Text: {
      label: 'Text',
      fields: {
        text: { type: 'textarea', label: 'Text' },
      },
      defaultProps: { text: '' },
      render: ({ text }: any) => (
        <div className={styles.body}>
          {String(text ?? '')
            .split(/\n{2,}/)
            .filter((p: string) => p.trim())
            .map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
        </div>
      ),
    },

    Image: {
      label: 'Image',
      fields: {
        url: imageField('Image'),
        caption: { type: 'text', label: 'Caption (optional)' },
      },
      defaultProps: { url: '', caption: '' },
      render: ({ url, caption }: any) => (
        <>
          {url && (
            <figure style={{ margin: '2rem 0' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={caption || ''} style={{ width: '100%', height: 'auto', borderRadius: 2, display: 'block' }} />
              {caption && (
                <figcaption style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--color-detail)', textAlign: 'center' }}>
                  {caption}
                </figcaption>
              )}
            </figure>
          )}
        </>
      ),
    },

    ImageGrid: {
      label: 'Image Grid',
      fields: {
        images: {
          type: 'array',
          label: 'Photos',
          arrayFields: { url: imageField('Image') },
          defaultItemProps: { url: '' },
          getItemSummary: (item: any) => item?.url || 'Photo',
        },
      },
      defaultProps: { images: [] },
      render: ({ images }: any) => {
        const valid = (images ?? []).filter((i: any) => i?.url)
        return (
          <>
            {valid.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', margin: '2rem 0' }}>
                {valid.map((img: any, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img.url} alt="" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 2 }} />
                ))}
              </div>
            )}
          </>
        )
      },
    },

    Video: {
      label: 'Video',
      fields: {
        url: { type: 'text', label: 'Video URL (YouTube, Vimeo, or direct file link)' },
      },
      defaultProps: { url: '' },
      render: ({ url }: any) => (
        <>
          {url && (
            <div style={{ margin: '2rem 0', position: 'relative', width: '100%', aspectRatio: '16 / 9', background: 'var(--color-bg-accent)' }}>
              {isEmbedUrl(url) ? (
                <iframe
                  src={toEmbedSrc(url)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                />
              ) : (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={url} controls style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>
          )}
        </>
      ),
    },
  },
}
