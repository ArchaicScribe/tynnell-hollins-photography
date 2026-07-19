/* eslint-disable @typescript-eslint/no-explicit-any */
// On-brand section-block library for the visual builder (TYN-217 + TYN-220 image
// picker + TYN-221 style controls).
//
// Plain <img> is used (not next/image) so the same config renders identically
// in the client editor and on the server (/[slug]). Layout is responsive via
// flexbox wrap + grid auto-fit (no media queries needed in inline styles).
//
// Render props are typed `any`: Puck's generic Config doesn't carry per-block
// prop types, and each block's shape is pinned by its fields/defaultProps.
//
// Brand tokens: bg #0C0C0C, accent #131313, heading #D6D1CE, body #E6E1DE,
// detail #9B9A9A. Fonts come from the site layout CSS vars (with fallbacks).
import type { ReactNode } from 'react'
import type { Config } from '@measured/puck'
import { ImagePickerField } from './ImagePickerField'
import { PhotoCarouselBlock } from './PhotoCarouselBlock'

// CSS-var-backed (TYN-314) so page-builder content follows the site-wide
// Design editor theme, not a fixed palette - fallbacks match tokens.css's
// defaults for when the var isn't set (e.g. isolated tooling/tests).
const C = {
  bg: 'var(--color-bg, #0C0C0C)',
  accent: 'var(--color-bg-accent, #131313)',
  heading: 'var(--color-heading, #D6D1CE)',
  body: 'var(--color-body, #E6E1DE)',
  detail: 'var(--color-detail, #9B9A9A)',
  btn: 'var(--color-btn-bg, #9B9A9A)',
  border: 'rgba(155,154,154,0.18)',
}
const HEADING_FONT = "var(--font-heading, Archivo, sans-serif)"
const BODY_FONT = "var(--font-body, 'Roboto Mono', monospace)"
const PAD_X = 'clamp(1.25rem, 5vw, 5rem)'

// Vertical spacing presets for the shared Section wrapper.
const SPACING: Record<string, string> = {
  none: '0',
  compact: 'clamp(1.5rem, 3vw, 2.75rem)',
  normal: 'clamp(2.75rem, 6vw, 5.5rem)',
  spacious: 'clamp(4.5rem, 9vw, 8.5rem)',
}

// Responsive visibility (TYN-229). Blocks already reflow (flex-wrap + grid
// auto-fit), so the missing per-breakpoint capability is showing/hiding a
// section per device. Two utility classes injected once at the root drive it;
// the breakpoint is 640px (phones). Using classes (not inline styles) is the
// only way to attach a media query, and it renders identically in the editor
// and on the public page.
const MOBILE_MAX = 640
const RESPONSIVE_CSS = `
@media (max-width:${MOBILE_MAX}px){.pk-hide-mobile{display:none !important}}
@media (min-width:${MOBILE_MAX + 1}px){.pk-hide-desktop{display:none !important}}
`

// Taped-photo treatment (TYN-233): an editorial "scrapbook" look where each
// photo sits on a cream mat with a strip of translucent washi tape at the top.
// Tape strips are pseudo-elements, which inline styles can't express, so the
// rules live in the root-injected stylesheet. Per-photo rotation is applied
// inline (alternating) so the grid feels hand-placed, not mechanical.
const TAPE_CSS = `
.pk-taped{position:relative;background:var(--tape-mat);padding:0.7rem 0.7rem 1.1rem;box-shadow:var(--tape-shadow);transition:transform .25s ease}
.pk-taped:hover{transform:rotate(0deg) scale(1.015) !important;z-index:2}
.pk-taped img{display:block;width:100%;height:auto}
.pk-taped::before,.pk-taped::after{content:'';position:absolute;top:-0.55rem;width:4.5rem;height:1.4rem;background:var(--tape-color);box-shadow:0 1px 2px rgba(0,0,0,0.18);backdrop-filter:blur(1px)}
.pk-taped::before{left:0.6rem;transform:rotate(-32deg)}
.pk-taped::after{right:0.6rem;transform:rotate(32deg)}
`

// Polaroid-photo treatment (TYN-309): a classic instant-photo frame - thick
// cream mat with extra depth at the bottom, no tape strips. Shares the same
// mat color token as the taped style for brand consistency.
const POLAROID_CSS = `
.pk-polaroid{position:relative;background:var(--tape-mat, #f4efe8);padding:0.65rem 0.65rem 2.75rem;box-shadow:0 10px 24px rgba(0,0,0,0.35);transition:transform .25s ease}
.pk-polaroid:hover{transform:rotate(0deg) scale(1.015) !important;z-index:2}
.pk-polaroid img{display:block;width:100%;height:auto}
`
// Detects a YouTube/Vimeo URL and extracts its video ID so it can be rendered
// as a proper embed iframe; anything else is treated as a direct video file
// URL (R2-hosted or otherwise) and rendered with a native <video> element.
function parseVideoEmbed(url: string): { type: 'youtube' | 'vimeo' | 'file'; id?: string } | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/)
  if (yt) return { type: 'youtube', id: yt[1] }
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return { type: 'vimeo', id: vimeo[1] }
  return { type: 'file' }
}

function visClass(hideOnMobile?: boolean, hideOnDesktop?: boolean): string | undefined {
  const c = []
  if (hideOnMobile) c.push('pk-hide-mobile')
  if (hideOnDesktop) c.push('pk-hide-desktop')
  return c.length ? c.join(' ') : undefined
}

// Per-block device-visibility controls, spread into every block's fields.
const responsiveFields = {
  hideOnMobile: { type: 'radio' as const, label: 'Show on phones', options: [ { label: 'Show', value: false }, { label: 'Hide', value: true } ] },
  hideOnDesktop: { type: 'radio' as const, label: 'Show on desktop', options: [ { label: 'Show', value: false }, { label: 'Hide', value: true } ] },
}
const responsiveDefaults = { hideOnMobile: false, hideOnDesktop: false }

// Shared section wrapper: applies the per-section Background + Spacing controls
// so every content block has consistent, Pixieset-style design options.
// backgroundImage/backgroundFade (TYN-305) layer a user-picked, dimmed photo
// behind the content instead of/under the flat background color.
function Section({ background, backgroundImage, backgroundFade, spacing, className, children }: { background?: string; backgroundImage?: string; backgroundFade?: string; spacing?: string; className?: string; children?: ReactNode }) {
  const padY = SPACING[spacing ?? 'normal'] ?? SPACING.normal
  const bg = background && background !== 'transparent' ? background : undefined
  const fade = backgroundFade ? Number(backgroundFade) : 0.55
  return (
    <section className={className} style={{ position: 'relative', background: bg, overflow: backgroundImage ? 'hidden' : undefined }}>
      {backgroundImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={backgroundImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: `rgba(12,12,12,${fade})` }} />
        </>
      )}
      <div style={{ position: 'relative', padding: `${padY} ${PAD_X}` }}>{children}</div>
    </section>
  )
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '0.72rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: C.detail,
  margin: '0 0 0.75rem',
}
const headingStyle = (size = 'clamp(1.6rem, 3.5vw, 2.75rem)'): React.CSSProperties => ({
  fontFamily: HEADING_FONT,
  fontSize: size,
  lineHeight: 1.1,
  color: C.heading,
  margin: 0,
})
function btnStyle(): React.CSSProperties {
  return {
    display: 'inline-block',
    marginTop: '1.5rem',
    padding: '0.75rem 2rem',
    background: C.btn,
    color: C.bg,
    textDecoration: 'none',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontSize: '0.78rem',
    fontFamily: BODY_FONT,
    borderRadius: 'var(--btn-radius, 2px)',
  }
}

const alignField = {
  type: 'radio' as const,
  label: 'Alignment',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
  ],
}

// Custom field: pick an image from the photo library (TYN-220).
const imageField = (label: string) => ({
  type: 'custom' as const,
  label,
  render: ({ value, onChange }: any) => <ImagePickerField value={value} onChange={onChange} />,
})

// Per-section style controls (TYN-221), spread into each content block's fields.
const bgField = {
  type: 'select' as const,
  label: 'Background',
  options: [
    { label: 'None', value: 'transparent' },
    { label: 'Dark', value: 'var(--color-bg, #0C0C0C)' },
    { label: 'Accent', value: 'var(--color-bg-accent, #131313)' },
  ],
}
// Faded background photo (TYN-305): an optional user-picked image behind the
// section, dimmed by a dark scrim so content stays legible. Placed here (not
// baked into any one block) so Tynnell can add/remove it on any section, on
// any page, alongside the existing flat Background option.
const backgroundImageField = imageField('Background photo (optional)')
const backgroundFadeField = {
  type: 'select' as const,
  label: 'Background photo fade',
  options: [
    { label: 'Light', value: '0.35' },
    { label: 'Medium', value: '0.55' },
    { label: 'Heavy', value: '0.75' },
  ],
}
const styleFields = {
  background: bgField,
  backgroundImage: backgroundImageField,
  backgroundFade: backgroundFadeField,
  spacing: {
    type: 'select' as const,
    label: 'Spacing',
    options: [
      { label: 'Compact', value: 'compact' },
      { label: 'Normal', value: 'normal' },
      { label: 'Spacious', value: 'spacious' },
      { label: 'None', value: 'none' },
    ],
  },
}
const styleDefaults = { background: 'transparent', backgroundImage: '', backgroundFade: '0.55', spacing: 'normal' }

export const config: Config = {
  root: {
    render: ({ children }: { children?: ReactNode }) => (
      <div style={{ background: C.bg, color: C.body, minHeight: '100%', fontFamily: BODY_FONT }}>
        <style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS + TAPE_CSS + POLAROID_CSS }} />
        {children}
      </div>
    ),
  },

  categories: {
    layout: { title: 'Layout', components: ['SectionHeading', 'Spacer', 'Shape', 'Line'] },
    content: { title: 'Content', components: ['RichText', 'SplitImageText', 'Services', 'Testimonials', 'CTA'] },
    media: { title: 'Media', components: ['Hero', 'PhotoGallery', 'PhotoCarousel', 'FullWidthImage', 'Video'] },
  },

  components: {
    // ---------------------------------------------------------------- Hero
    Hero: {
      label: 'Hero',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow (small label)' },
        heading: { type: 'text', label: 'Heading' },
        subheading: { type: 'textarea', label: 'Subheading' },
        imageUrl: imageField('Background image'),
        height: {
          type: 'select',
          label: 'Height',
          options: [
            { label: 'Tall', value: '80vh' },
            { label: 'Medium', value: '60vh' },
            { label: 'Short', value: '45vh' },
          ],
        },
        backgroundBehavior: {
          type: 'radio',
          label: 'Background behavior',
          options: [
            { label: 'Scrolls with page', value: 'scroll' },
            { label: 'Stays fixed (parallax)', value: 'fixed' },
          ],
        },
        align: alignField,
        buttonText: { type: 'text', label: 'Button text (optional)' },
        buttonHref: { type: 'text', label: 'Button link' },
        ...responsiveFields,
      },
      defaultProps: {
        eyebrow: '',
        heading: 'Refined. Editorial. Artful. Lasting.',
        subheading: 'Photos that feel like your favorite memory.',
        imageUrl: '',
        height: '60vh',
        backgroundBehavior: 'scroll',
        align: 'left',
        buttonText: '',
        buttonHref: '',
        ...responsiveDefaults,
      },
      render: ({ eyebrow, heading, subheading, imageUrl, height, backgroundBehavior, align, buttonText, buttonHref, hideOnMobile, hideOnDesktop }: any) => (
        <section className={visClass(hideOnMobile, hideOnDesktop)} style={{ position: 'relative', minHeight: height, display: 'flex', alignItems: 'flex-end', justifyContent: align === 'center' ? 'center' : 'flex-start', overflow: 'hidden' }}>
          {imageUrl ? (
            backgroundBehavior === 'fixed' ? (
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            )
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#1a1a1a,#0c0c0c)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(12,12,12,0.7), rgba(12,12,12,0.1))' }} />
          <div style={{ position: 'relative', padding: 'clamp(2rem,5vw,4rem) clamp(1.25rem,5vw,5rem)', maxWidth: '60ch', textAlign: align }}>
            {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
            <h1 style={headingStyle('clamp(2rem,5vw,3.75rem)')}>{heading}</h1>
            {subheading && <p style={{ marginTop: '1rem', color: C.body, letterSpacing: '0.06em', fontSize: '0.95rem' }}>{subheading}</p>}
            {buttonText && <a href={buttonHref || '#'} style={btnStyle()}>{buttonText}</a>}
          </div>
        </section>
      ),
    },

    // ------------------------------------------------------ SectionHeading
    SectionHeading: {
      label: 'Section Heading',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow (small label)' },
        heading: { type: 'text', label: 'Heading' },
        subtext: { type: 'textarea', label: 'Subtext (optional)' },
        align: alignField,
        ...styleFields,
        ...responsiveFields,
      },
      defaultProps: { eyebrow: 'My Work', heading: 'A Section Heading', subtext: '', align: 'center', ...styleDefaults, ...responsiveDefaults },
      render: ({ eyebrow, heading, subtext, align, background, backgroundImage, backgroundFade, spacing, hideOnMobile, hideOnDesktop }: any) => (
        <Section background={background} backgroundImage={backgroundImage} backgroundFade={backgroundFade} spacing={spacing} className={visClass(hideOnMobile, hideOnDesktop)}>
          <div style={{ textAlign: align, maxWidth: align === 'center' ? '70ch' : undefined, margin: align === 'center' ? '0 auto' : undefined }}>
            {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
            <h2 style={headingStyle()}>{heading}</h2>
            {subtext && <p style={{ marginTop: '1rem', color: C.detail, lineHeight: 1.7 }}>{subtext}</p>}
          </div>
        </Section>
      ),
    },

    // ------------------------------------------------------------ RichText
    RichText: {
      label: 'Text',
      fields: {
        text: { type: 'textarea', label: 'Text' },
        align: alignField,
        ...styleFields,
        ...responsiveFields,
      },
      defaultProps: { text: 'Tell your story here.', align: 'left', ...styleDefaults, ...responsiveDefaults },
      render: ({ text, align, background, backgroundImage, backgroundFade, spacing, hideOnMobile, hideOnDesktop }: any) => (
        <Section background={background} backgroundImage={backgroundImage} backgroundFade={backgroundFade} spacing={spacing} className={visClass(hideOnMobile, hideOnDesktop)}>
          <div style={{ maxWidth: '70ch', margin: align === 'center' ? '0 auto' : undefined, textAlign: align }}>
            <p style={{ color: C.body, fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{text}</p>
          </div>
        </Section>
      ),
    },

    // ------------------------------------------------------- SplitImageText
    SplitImageText: {
      label: 'Split Image + Text',
      fields: {
        imageUrl: imageField('Image'),
        imagePosition: {
          type: 'radio',
          label: 'Image position',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
        },
        eyebrow: { type: 'text', label: 'Eyebrow (optional)' },
        heading: { type: 'text', label: 'Heading' },
        body: { type: 'textarea', label: 'Body text' },
        buttonText: { type: 'text', label: 'Button text (optional)' },
        buttonHref: { type: 'text', label: 'Button link' },
        background: bgField,
        ...responsiveFields,
      },
      defaultProps: {
        imageUrl: '',
        imagePosition: 'left',
        eyebrow: '',
        heading: 'Where It All Began',
        body: 'Share the story behind your work. A sentence or two that gives visitors a sense of who you are.',
        buttonText: '',
        buttonHref: '',
        background: 'transparent',
        ...responsiveDefaults,
      },
      render: ({ imageUrl, imagePosition, eyebrow, heading, body, buttonText, buttonHref, background, hideOnMobile, hideOnDesktop }: any) => {
        const bg = background && background !== 'transparent' ? background : undefined
        const img = (
          <div style={{ flex: '1 1 340px', minHeight: '320px', position: 'relative', background: C.accent }}>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
        )
        const txt = (
          <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(2rem,4vw,3.5rem)' }}>
            {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
            <h2 style={headingStyle('clamp(1.5rem,3vw,2.4rem)')}>{heading}</h2>
            <p style={{ marginTop: '1rem', color: C.body, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{body}</p>
            {buttonText && <a href={buttonHref || '#'} style={btnStyle()}>{buttonText}</a>}
          </div>
        )
        return (
          <section className={visClass(hideOnMobile, hideOnDesktop)} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', background: bg }}>
            {imagePosition === 'left' ? <>{img}{txt}</> : <>{txt}{img}</>}
          </section>
        )
      },
    },

    // -------------------------------------------------------------- Services
    Services: {
      label: 'Services / Pricing',
      fields: {
        heading: { type: 'text', label: 'Heading (optional)' },
        items: {
          type: 'array',
          label: 'Cards',
          arrayFields: {
            name: { type: 'text', label: 'Name' },
            price: { type: 'text', label: 'Price' },
            description: { type: 'textarea', label: 'Description' },
          },
          defaultItemProps: { name: 'Session', price: '$350', description: 'What this session includes.' },
          getItemSummary: (item: any) => item?.name || 'Card',
        },
        ...styleFields,
        ...responsiveFields,
      },
      defaultProps: {
        heading: 'Services',
        items: [
          { name: 'Portrait Session', price: '$350', description: 'A 1-hour session at the location of your choice.' },
          { name: 'Wedding Collection', price: 'From $2,800', description: 'Full-day coverage with a second shooter.' },
        ],
        ...styleDefaults,
        ...responsiveDefaults,
      },
      render: ({ heading, items, background, backgroundImage, backgroundFade, spacing, hideOnMobile, hideOnDesktop }: any) => (
        <Section background={background} backgroundImage={backgroundImage} backgroundFade={backgroundFade} spacing={spacing} className={visClass(hideOnMobile, hideOnDesktop)}>
          {heading && <h2 style={{ ...headingStyle(), textAlign: 'center', marginBottom: '2.5rem' }}>{heading}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', maxWidth: '1100px', margin: '0 auto' }}>
            {(items ?? []).map((it: any, i: number) => (
              <div key={i} style={{ background: C.accent, border: `1px solid ${C.border}`, borderRadius: '4px', padding: '1.75rem' }}>
                <h3 style={{ fontFamily: HEADING_FONT, color: C.heading, fontSize: '1.15rem', margin: 0 }}>{it.name}</h3>
                {it.price && <p style={{ color: C.detail, fontSize: '1.4rem', fontFamily: HEADING_FONT, margin: '0.5rem 0 0.85rem' }}>{it.price}</p>}
                {it.description && <p style={{ color: C.body, lineHeight: 1.7, fontSize: '0.9rem', margin: 0 }}>{it.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      ),
    },

    // ----------------------------------------------------------- Testimonials
    Testimonials: {
      label: 'Testimonials',
      fields: {
        heading: { type: 'text', label: 'Heading (optional)' },
        items: {
          type: 'array',
          label: 'Quotes',
          arrayFields: {
            quote: { type: 'textarea', label: 'Quote' },
            name: { type: 'text', label: 'Client name' },
          },
          defaultItemProps: { quote: 'Tynnell captured our day perfectly.', name: 'A Happy Client' },
          getItemSummary: (item: any) => item?.name || 'Quote',
        },
        ...styleFields,
        ...responsiveFields,
      },
      defaultProps: {
        heading: 'Kind Words',
        items: [
          { quote: 'Working with Tynnell was effortless. The photos feel like us.', name: 'Sarah & James' },
        ],
        background: 'var(--color-bg-accent, #131313)',
        spacing: 'normal',
        ...responsiveDefaults,
      },
      render: ({ heading, items, background, backgroundImage, backgroundFade, spacing, hideOnMobile, hideOnDesktop }: any) => (
        <Section background={background} backgroundImage={backgroundImage} backgroundFade={backgroundFade} spacing={spacing} className={visClass(hideOnMobile, hideOnDesktop)}>
          {heading && <h2 style={{ ...headingStyle(), textAlign: 'center', marginBottom: '2.5rem' }}>{heading}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
            {(items ?? []).map((it: any, i: number) => (
              <figure key={i} style={{ margin: 0, padding: '1.75rem', border: `1px solid ${C.border}`, borderRadius: '4px' }}>
                <blockquote style={{ margin: 0, color: C.body, fontStyle: 'italic', lineHeight: 1.7 }}>&ldquo;{it.quote}&rdquo;</blockquote>
                {it.name && <figcaption style={{ marginTop: '1rem', color: C.detail, fontSize: '0.8rem', letterSpacing: '0.06em' }}><span aria-hidden="true">- </span>{it.name}</figcaption>}
              </figure>
            ))}
          </div>
        </Section>
      ),
    },

    // ----------------------------------------------------------------- CTA
    CTA: {
      label: 'Call to Action',
      fields: {
        heading: { type: 'text', label: 'Heading' },
        subtext: { type: 'textarea', label: 'Subtext (optional)' },
        buttonText: { type: 'text', label: 'Button text' },
        buttonHref: { type: 'text', label: 'Button link' },
        ...styleFields,
        ...responsiveFields,
      },
      defaultProps: {
        heading: 'Ready to create something beautiful?',
        subtext: '',
        buttonText: 'Book a Session',
        buttonHref: '/contact',
        background: 'var(--color-bg-accent, #131313)',
        spacing: 'spacious',
        ...responsiveDefaults,
      },
      render: ({ heading, subtext, buttonText, buttonHref, background, backgroundImage, backgroundFade, spacing, hideOnMobile, hideOnDesktop }: any) => (
        <Section background={background} backgroundImage={backgroundImage} backgroundFade={backgroundFade} spacing={spacing} className={visClass(hideOnMobile, hideOnDesktop)}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={headingStyle('clamp(1.5rem,3vw,2.5rem)')}>{heading}</h2>
            {subtext && <p style={{ marginTop: '0.85rem', color: C.detail, maxWidth: '60ch', margin: '0.85rem auto 0' }}>{subtext}</p>}
            {buttonText && <a href={buttonHref || '#'} style={btnStyle()}>{buttonText}</a>}
          </div>
        </Section>
      ),
    },

    // -------------------------------------------------------- PhotoGallery
    PhotoGallery: {
      label: 'Photo Gallery',
      fields: {
        images: {
          type: 'array',
          label: 'Photos',
          arrayFields: { url: imageField('Image') },
          defaultItemProps: { url: '' },
          getItemSummary: (item: any) => item?.url || 'Photo',
        },
        size: {
          type: 'select',
          label: 'Tile size',
          options: [
            { label: 'Large (2-3 across)', value: '440px' },
            { label: 'Medium (3-4 across)', value: '300px' },
            { label: 'Small (4-5 across)', value: '220px' },
          ],
        },
        aspect: {
          type: 'select',
          label: 'Shape',
          options: [
            { label: 'Portrait', value: '4 / 5' },
            { label: 'Square', value: '1 / 1' },
            { label: 'Landscape', value: '3 / 2' },
          ],
        },
        frame: {
          type: 'radio',
          label: 'Photo style',
          options: [
            { label: 'Clean', value: 'plain' },
            { label: 'Taped', value: 'taped' },
            { label: 'Polaroid', value: 'polaroid' },
          ],
        },
        ...responsiveFields,
      },
      defaultProps: { images: [], size: '300px', aspect: '4 / 5', frame: 'plain', ...responsiveDefaults },
      render: ({ images, size, aspect, frame, hideOnMobile, hideOnDesktop }: any) => {
        const valid = (images ?? []).filter((i: any) => i?.url)
        const taped = frame === 'taped'
        const polaroid = frame === 'polaroid'
        const framed = taped || polaroid
        return (
          <section className={visClass(hideOnMobile, hideOnDesktop)} style={{ padding: framed ? 'clamp(2rem,5vw,3.75rem) clamp(1.25rem,3vw,3rem)' : 'clamp(1.5rem,4vw,3rem) clamp(1.25rem,2.5vw,2.5rem)' }}>
            {valid.length === 0 ? (
              <p style={{ color: C.detail, textAlign: 'center' }}>Add photos to populate the gallery.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${size}, 1fr))`, gap: framed ? 'clamp(1.5rem,3vw,2.75rem)' : '0.75rem', alignItems: 'start' }}>
                {valid.map((img: any, i: number) =>
                  framed ? (
                    <div key={i} className={taped ? 'pk-taped' : 'pk-polaroid'} style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (1.2 + (i % 3) * 0.6)}deg)` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" style={{ width: '100%', aspectRatio: aspect, objectFit: 'cover' }} />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={img.url} alt="" style={{ width: '100%', aspectRatio: aspect, objectFit: 'cover', borderRadius: '2px' }} />
                  )
                )}
              </div>
            )}
          </section>
        )
      },
    },

    // ------------------------------------------------------- PhotoCarousel
    PhotoCarousel: {
      label: 'Photo Carousel',
      fields: {
        heading: { type: 'text', label: 'Heading (optional)' },
        images: {
          type: 'array',
          label: 'Photos',
          arrayFields: { url: imageField('Image') },
          defaultItemProps: { url: '' },
          getItemSummary: (item: any) => item?.url || 'Photo',
        },
        ...styleFields,
        ...responsiveFields,
      },
      defaultProps: { heading: '', images: [], ...styleDefaults, ...responsiveDefaults },
      render: ({ heading, images, background, backgroundImage, backgroundFade, spacing, hideOnMobile, hideOnDesktop }: any) => {
        const valid = (images ?? []).filter((i: any) => i?.url)
        return (
          <Section background={background} backgroundImage={backgroundImage} backgroundFade={backgroundFade} spacing={spacing} className={visClass(hideOnMobile, hideOnDesktop)}>
            {heading && <h2 style={{ ...headingStyle(), textAlign: 'center', marginBottom: '1.5rem' }}>{heading}</h2>}
            {valid.length === 0 ? (
              <p style={{ color: C.detail, textAlign: 'center' }}>Add photos to populate the carousel.</p>
            ) : (
              <PhotoCarouselBlock images={valid} />
            )}
          </Section>
        )
      },
    },

    // ------------------------------------------------------- FullWidthImage
    FullWidthImage: {
      label: 'Full-Width Image',
      fields: {
        imageUrl: imageField('Image'),
        height: {
          type: 'select',
          label: 'Height',
          options: [
            { label: 'Tall', value: '75vh' },
            { label: 'Medium', value: '55vh' },
            { label: 'Band', value: '38vh' },
          ],
        },
        caption: { type: 'text', label: 'Caption (optional)' },
        ...responsiveFields,
      },
      defaultProps: { imageUrl: '', height: '55vh', caption: '', ...responsiveDefaults },
      render: ({ imageUrl, height, caption, hideOnMobile, hideOnDesktop }: any) => (
        <section className={visClass(hideOnMobile, hideOnDesktop)}>
          <div style={{ position: 'relative', width: '100%', height, background: C.accent }}>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={caption || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          {caption && <p style={{ textAlign: 'center', color: C.detail, fontSize: '0.78rem', padding: '0.75rem 1rem 0', margin: 0 }}>{caption}</p>}
        </section>
      ),
    },

    // ----------------------------------------------------------------- Video
    Video: {
      label: 'Video',
      fields: {
        videoUrl: { type: 'text', label: 'Video URL (YouTube, Vimeo, or direct file link)' },
        height: {
          type: 'select',
          label: 'Height',
          options: [
            { label: 'Tall', value: '75vh' },
            { label: 'Medium', value: '55vh' },
            { label: 'Band', value: '38vh' },
          ],
        },
        autoplay: {
          type: 'radio',
          label: 'Autoplay',
          options: [{ label: 'Off', value: false }, { label: 'On', value: true }],
        },
        loop: {
          type: 'radio',
          label: 'Loop',
          options: [{ label: 'Off', value: false }, { label: 'On', value: true }],
        },
        muted: {
          type: 'radio',
          label: 'Muted (required for autoplay to work in most browsers)',
          options: [{ label: 'Off', value: false }, { label: 'On', value: true }],
        },
        ...responsiveFields,
      },
      defaultProps: { videoUrl: '', height: '55vh', autoplay: false, loop: false, muted: true, ...responsiveDefaults },
      render: ({ videoUrl, height, autoplay, loop, muted, hideOnMobile, hideOnDesktop }: any) => {
        const embed = parseVideoEmbed(videoUrl)
        // Browsers block audible autoplay outright, so autoplay always implies
        // muted regardless of the field value - otherwise the video would
        // simply fail to play rather than play with sound.
        const effectiveMuted = muted || autoplay
        return (
          <section className={visClass(hideOnMobile, hideOnDesktop)}>
            <div style={{ position: 'relative', width: '100%', height, background: C.accent }}>
              {!embed ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.detail, fontSize: '0.85rem' }}>
                  Add a video URL
                </div>
              ) : embed.type === 'file' ? (
                <video
                  src={videoUrl}
                  autoPlay={autoplay}
                  loop={loop}
                  muted={effectiveMuted}
                  controls={!autoplay}
                  playsInline
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <iframe
                  src={
                    embed.type === 'youtube'
                      ? `https://www.youtube.com/embed/${embed.id}?${autoplay ? `autoplay=1&mute=${effectiveMuted ? 1 : 0}&` : ''}${loop ? `loop=1&playlist=${embed.id}&` : ''}`
                      : `https://player.vimeo.com/video/${embed.id}?${autoplay ? 'autoplay=1&' : ''}${loop ? 'loop=1&' : ''}${effectiveMuted ? 'muted=1&' : ''}`
                  }
                  title="Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          </section>
        )
      },
    },

    // ----------------------------------------------------------------- Shape
    Shape: {
      label: 'Shape',
      fields: {
        shapeType: {
          type: 'radio',
          label: 'Shape',
          options: [{ label: 'Rectangle', value: 'rectangle' }, { label: 'Circle', value: 'circle' }],
        },
        size: {
          type: 'select',
          label: 'Size',
          options: [
            { label: 'Small', value: '80px' },
            { label: 'Medium', value: '160px' },
            { label: 'Large', value: '280px' },
          ],
        },
        color: {
          type: 'select',
          label: 'Color',
          options: [
            { label: 'Heading', value: 'var(--color-heading, #D6D1CE)' },
            { label: 'Detail', value: 'var(--color-detail, #9B9A9A)' },
            { label: 'Button', value: 'var(--color-btn-bg, #9B9A9A)' },
            { label: 'Accent background', value: 'var(--color-bg-accent, #131313)' },
          ],
        },
        opacity: {
          type: 'select',
          label: 'Opacity',
          options: [
            { label: 'Light', value: '0.25' },
            { label: 'Medium', value: '0.6' },
            { label: 'Solid', value: '1' },
          ],
        },
        align: alignField,
        ...responsiveFields,
      },
      defaultProps: {
        shapeType: 'circle',
        size: '160px',
        color: 'var(--color-detail, #9B9A9A)',
        opacity: '0.6',
        align: 'center',
        ...responsiveDefaults,
      },
      render: ({ shapeType, size, color, opacity, align, hideOnMobile, hideOnDesktop }: any) => (
        <div
          className={visClass(hideOnMobile, hideOnDesktop)}
          style={{ padding: 'clamp(1rem,3vw,2rem)', display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start' }}
        >
          <div
            style={{ width: size, height: size, background: color, opacity: Number(opacity), borderRadius: shapeType === 'circle' ? '50%' : '4px' }}
            aria-hidden="true"
          />
        </div>
      ),
    },

    // ------------------------------------------------------------------ Line
    Line: {
      label: 'Line',
      fields: {
        orientation: {
          type: 'radio',
          label: 'Orientation',
          options: [{ label: 'Horizontal', value: 'horizontal' }, { label: 'Vertical', value: 'vertical' }],
        },
        thickness: {
          type: 'select',
          label: 'Thickness',
          options: [
            { label: 'Thin', value: '1px' },
            { label: 'Medium', value: '2px' },
            { label: 'Thick', value: '4px' },
          ],
        },
        length: {
          type: 'select',
          label: 'Length',
          options: [
            { label: 'Narrow', value: '160px' },
            { label: 'Medium', value: '360px' },
            { label: 'Full', value: '100%' },
          ],
        },
        color: {
          type: 'select',
          label: 'Color',
          options: [
            { label: 'Detail', value: 'var(--color-detail, #9B9A9A)' },
            { label: 'Heading', value: 'var(--color-heading, #D6D1CE)' },
            { label: 'Subtle', value: 'rgba(155,154,154,0.18)' },
          ],
        },
        margin: {
          type: 'select',
          label: 'Margin',
          options: [
            { label: 'Compact', value: SPACING.compact },
            { label: 'Normal', value: SPACING.normal },
            { label: 'Spacious', value: SPACING.spacious },
          ],
        },
        ...responsiveFields,
      },
      defaultProps: {
        orientation: 'horizontal',
        thickness: '1px',
        length: '100%',
        color: 'var(--color-detail, #9B9A9A)',
        margin: SPACING.normal,
        ...responsiveDefaults,
      },
      render: ({ orientation, thickness, length, color, margin, hideOnMobile, hideOnDesktop }: any) => {
        const horizontal = orientation !== 'vertical'
        return (
          <div
            className={visClass(hideOnMobile, hideOnDesktop)}
            style={{ display: 'flex', justifyContent: 'center', padding: horizontal ? `${margin} 0` : `0 ${margin}` }}
          >
            <div
              style={
                horizontal
                  ? { width: length, height: thickness, background: color }
                  : { width: thickness, height: length === '100%' ? '4rem' : length, background: color }
              }
              aria-hidden="true"
            />
          </div>
        )
      },
    },

    // ---------------------------------------------------------------- Spacer
    Spacer: {
      label: 'Spacer',
      fields: {
        size: {
          type: 'select',
          label: 'Height',
          options: [
            { label: 'Small', value: '2rem' },
            { label: 'Medium', value: '4rem' },
            { label: 'Large', value: '7rem' },
            { label: 'Extra Large', value: '11rem' },
          ],
        },
        ...responsiveFields,
      },
      defaultProps: { size: '4rem', ...responsiveDefaults },
      render: ({ size, hideOnMobile, hideOnDesktop }: any) => <div className={visClass(hideOnMobile, hideOnDesktop)} style={{ height: size }} aria-hidden="true" />,
    },
  },
}
