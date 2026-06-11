import type { ReactNode } from 'react'
import type { Config } from '@measured/puck'

// Section blocks for the visual-builder POC (TYN-214). Each block maps to an
// on-brand React section. Plain <img> is used (not next/image) so the same
// config renders identically in the client editor and the server (/landing).
//
// Brand tokens: bg #0C0C0C, heading #D6D1CE, body #E6E1DE, detail #9B9A9A,
// heading font Archivo, body font "Roboto Mono".

const HEADING_FONT = "var(--font-heading, Archivo, sans-serif)"
const BODY_FONT = "var(--font-body, 'Roboto Mono', monospace)"

export const config: Config = {
  root: {
    render: ({ children }: { children?: ReactNode }) => (
      <div style={{ background: '#0C0C0C', color: '#E6E1DE', minHeight: '100%', fontFamily: BODY_FONT }}>
        {children}
      </div>
    ),
  },
  components: {
    Hero: {
      label: 'Hero',
      fields: {
        heading: { type: 'text', label: 'Heading' },
        subheading: { type: 'textarea', label: 'Subheading' },
        imageUrl: { type: 'text', label: 'Background image URL' },
      },
      defaultProps: {
        heading: 'Refined. Editorial. Artful. Lasting.',
        subheading: 'Photos that feel like your favorite memory.',
        imageUrl: '',
      },
      render: ({ heading, subheading, imageUrl }) => (
        <section style={{ position: 'relative', minHeight: '70vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#1a1a1a,#0c0c0c)' }} />
          )}
          <div style={{ position: 'relative', padding: '3rem clamp(1.25rem,5vw,5rem)', maxWidth: '60ch' }}>
            <h1 style={{ fontFamily: HEADING_FONT, fontSize: 'clamp(2rem,5vw,3.75rem)', lineHeight: 1.05, color: '#D6D1CE', margin: 0, background: 'rgba(12,12,12,0.55)', display: 'inline', padding: '0.1em 0.2em' }}>
              {heading}
            </h1>
            {subheading && (
              <p style={{ marginTop: '1.25rem', color: '#E6E1DE', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                {subheading}
              </p>
            )}
          </div>
        </section>
      ),
    },

    PhotoGallery: {
      label: 'Photo Gallery',
      fields: {
        images: {
          type: 'array',
          label: 'Photos',
          arrayFields: {
            url: { type: 'text', label: 'Image URL' },
          },
          defaultItemProps: { url: '' },
          getItemSummary: (item) => item.url || 'Photo',
        },
      },
      defaultProps: { images: [] },
      render: ({ images }) => {
        const list = ((images ?? []) as { url: string }[]).filter((i) => i.url)
        return (
          <section style={{ padding: 'clamp(2rem,5vw,4rem) clamp(1.25rem,2.5vw,2.5rem)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '0.75rem' }}>
              {list.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img.url} alt="" style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: '2px' }} />
              ))}
              {list.length === 0 && (
                <p style={{ color: '#9B9A9A' }}>Add photo URLs to populate the gallery.</p>
              )}
            </div>
          </section>
        )
      },
    },

    RichText: {
      label: 'Text',
      fields: {
        text: { type: 'textarea', label: 'Text' },
        align: {
          type: 'radio',
          label: 'Alignment',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
          ],
        },
      },
      defaultProps: { text: 'Tell your story here.', align: 'left' },
      render: ({ text, align }) => (
        <section style={{ padding: 'clamp(2rem,5vw,4rem) clamp(1.25rem,2.5vw,2.5rem)', maxWidth: '70ch', margin: align === 'center' ? '0 auto' : undefined, textAlign: align }}>
          <p style={{ color: '#E6E1DE', fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{text}</p>
        </section>
      ),
    },

    CTA: {
      label: 'Call to Action',
      fields: {
        heading: { type: 'text', label: 'Heading' },
        buttonText: { type: 'text', label: 'Button text' },
        buttonHref: { type: 'text', label: 'Button link' },
      },
      defaultProps: {
        heading: 'Ready to create something beautiful?',
        buttonText: 'Book a Session',
        buttonHref: '/contact',
      },
      render: ({ heading, buttonText, buttonHref }) => (
        <section style={{ padding: 'clamp(3rem,6vw,5rem) clamp(1.25rem,2.5vw,2.5rem)', textAlign: 'center', background: '#131313' }}>
          <h2 style={{ fontFamily: HEADING_FONT, fontSize: 'clamp(1.5rem,3vw,2.5rem)', color: '#D6D1CE', margin: 0 }}>{heading}</h2>
          {buttonText && (
            <a href={buttonHref || '#'} style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#9B9A9A', color: '#0C0C0C', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              {buttonText}
            </a>
          )}
        </section>
      ),
    },
  },
}
