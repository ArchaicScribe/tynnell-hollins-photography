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
import { AccordionBlock } from './AccordionBlock'
import { TypewriterText } from './TypewriterText'
import ContactForm from '@/app/(site)/contact/ContactForm'
import { LayoutVariantField, type LayoutOption } from './LayoutVariantField'

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

// Simple brand-icon paths for the Social Links block (TYN-334). Instagram
// and TikTok match the same marks already used in the site footer
// (components/Footer/Footer.tsx) for visual consistency.
const SOCIAL_ICON_PATHS: Record<string, string> = {
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  facebook: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.892h-2.33v6.987C18.343 21.128 22 16.991 22 12z',
  tiktok: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.22 8.22 0 0 0 4.82 1.55V6.79a4.85 4.85 0 0 1-1.05-.1z',
  pinterest: 'M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.182-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.809-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.996.499 1.807 1.481 1.807 1.777 0 3.144-1.874 3.144-4.579 0-2.394-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.744 2.281a.3.3 0 0 1 .069.287c-.076.316-.244.996-.277 1.135-.043.183-.143.222-.33.134-1.234-.575-2.005-2.379-2.005-3.828 0-3.118 2.265-5.983 6.53-5.983 3.428 0 6.093 2.443 6.093 5.708 0 3.406-2.148 6.148-5.13 6.148-1.002 0-1.944-.52-2.266-1.135l-.616 2.35c-.223.858-.826 1.933-1.229 2.588A10 10 0 1 0 12 2z',
}

function SocialIcon({ platform, size, color }: { platform: string; size: number; color: string }) {
  const path = SOCIAL_ICON_PATHS[platform]
  if (!path) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d={path} />
    </svg>
  )
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

// Custom field: "Change Layout" thumbnail picker (TYN-329). All layout
// options for a block share the same content fields, so switching never
// discards anything the user typed in.
const layoutField = (options: LayoutOption[]) => ({
  type: 'custom' as const,
  label: 'Layout',
  render: ({ value, onChange }: any) => <LayoutVariantField value={value} onChange={onChange} options={options} />,
})

// Small hand-drawn CSS diagrams for the layout thumbnails - see
// LayoutVariantField.tsx for why these aren't real screenshots.
const diagramBar = (style: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', background: '#9b9a9a', borderRadius: 1, ...style })
const HERO_LAYOUT_OPTIONS: LayoutOption[] = [
  {
    value: 'bottom',
    label: 'Bottom-aligned',
    preview: (
      <>
        <div style={{ position: 'absolute', inset: 0, background: '#2a2a2a' }} />
        <div style={diagramBar({ left: 6, bottom: 6, width: 28, height: 4 })} />
        <div style={diagramBar({ left: 6, bottom: 13, width: 20, height: 6, opacity: 0.6 })} />
      </>
    ),
  },
  {
    value: 'centered',
    label: 'Centered',
    preview: (
      <>
        <div style={{ position: 'absolute', inset: 0, background: '#2a2a2a' }} />
        <div style={diagramBar({ left: '50%', top: 16, width: 24, height: 6, opacity: 0.6, transform: 'translateX(-50%)' })} />
        <div style={diagramBar({ left: '50%', top: 24, width: 30, height: 4, transform: 'translateX(-50%)' })} />
      </>
    ),
  },
  {
    value: 'split',
    label: 'Split',
    preview: (
      <>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', background: '#2a2a2a' }} />
        <div style={diagramBar({ left: 36, top: 14, width: 22, height: 4 })} />
        <div style={diagramBar({ left: 36, top: 21, width: 18, height: 4, opacity: 0.6 })} />
        <div style={diagramBar({ left: 36, top: 28, width: 14, height: 5, opacity: 0.9 })} />
      </>
    ),
  },
]
const SPLIT_LAYOUT_OPTIONS: LayoutOption[] = [
  {
    value: 'side-by-side',
    label: 'Side by side',
    preview: (
      <>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', background: '#2a2a2a' }} />
        <div style={diagramBar({ left: 36, top: 14, width: 22, height: 4 })} />
        <div style={diagramBar({ left: 36, top: 21, width: 18, height: 4, opacity: 0.6 })} />
      </>
    ),
  },
  {
    value: 'overlay',
    label: 'Image overlay',
    preview: (
      <>
        <div style={{ position: 'absolute', inset: 0, background: '#2a2a2a' }} />
        <div style={diagramBar({ left: 6, bottom: 6, width: 28, height: 4 })} />
        <div style={diagramBar({ left: 6, bottom: 13, width: 20, height: 6, opacity: 0.6 })} />
      </>
    ),
  },
  {
    value: 'stacked',
    label: 'Stacked',
    preview: (
      <>
        <div style={{ position: 'absolute', left: 4, right: 4, top: 4, height: 20, background: '#2a2a2a' }} />
        <div style={diagramBar({ left: '50%', top: 28, width: 24, height: 4, transform: 'translateX(-50%)' })} />
        <div style={diagramBar({ left: '50%', top: 34, width: 32, height: 4, opacity: 0.6, transform: 'translateX(-50%)' })} />
      </>
    ),
  },
]
// Fixed column counts for the Masonry/Featured layouts (the Grid layout uses
// CSS auto-fit instead, which doesn't need a fixed count).
const GALLERY_COLS_BY_SIZE: Record<string, number> = { '440px': 2, '300px': 3, '220px': 4 }
const GALLERY_LAYOUT_OPTIONS: LayoutOption[] = [
  {
    value: 'grid',
    label: 'Grid',
    preview: (
      <div style={{ position: 'absolute', inset: 4, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ background: '#2a2a2a' }} />)}
      </div>
    ),
  },
  {
    value: 'masonry',
    label: 'Masonry',
    preview: (
      <div style={{ position: 'absolute', inset: 4, display: 'flex', gap: 2 }}>
        <div style={{ flex: 1, background: '#2a2a2a', height: '60%' }} />
        <div style={{ flex: 1, background: '#2a2a2a', height: '100%' }} />
        <div style={{ flex: 1, background: '#2a2a2a', height: '40%' }} />
      </div>
    ),
  },
  {
    value: 'featured',
    label: 'Featured + grid',
    preview: (
      <div style={{ position: 'absolute', inset: 4, display: 'flex', gap: 2 }}>
        <div style={{ flex: 1.4, background: '#2a2a2a' }} />
        <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'repeat(2, 1fr)', gap: 2 }}>
          <div style={{ background: '#2a2a2a' }} />
          <div style={{ background: '#2a2a2a' }} />
        </div>
      </div>
    ),
  },
]

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
    layout: { title: 'Layout', components: ['SectionHeading', 'Spacer', 'Shape', 'Line', 'SocialLinks'] },
    content: { title: 'Content', components: ['RichText', 'TypewriterHeading', 'SplitImageText', 'Services', 'Testimonials', 'Accordion', 'ContactFormBlock', 'CTA'] },
    media: { title: 'Media', components: ['Hero', 'PhotoGallery', 'PhotoCarousel', 'ImageGrid', 'FullWidthImage', 'Video', 'Map', 'InstagramFeed'] },
  },

  components: {
    // ---------------------------------------------------------------- Hero
    Hero: {
      label: 'Hero',
      fields: {
        // TYN-329: layout options share every field below, so switching
        // layouts never discards content. In the Split layout, the
        // Alignment field repurposes to "which side the image sits on"
        // (Left = image left, Center = image right) since a 2-up layout
        // has no meaningful center option of its own.
        layout: layoutField(HERO_LAYOUT_OPTIONS),
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
          label: 'Background behavior (Bottom-aligned/Centered only)',
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
        layout: 'bottom',
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
      render: ({ layout, eyebrow, heading, subheading, imageUrl, height, backgroundBehavior, align, buttonText, buttonHref, hideOnMobile, hideOnDesktop }: any) => {
        const cls = visClass(hideOnMobile, hideOnDesktop)
        if (layout === 'split') {
          const imageLeft = align !== 'center'
          const img = (
            <div style={{ flex: '1 1 340px', minHeight: height, position: 'relative', background: C.accent }}>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
          )
          const txt = (
            <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(2rem,4vw,3.5rem)' }}>
              {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
              <h1 style={headingStyle('clamp(1.75rem,3.5vw,3rem)')}>{heading}</h1>
              {subheading && <p style={{ marginTop: '1rem', color: C.body, letterSpacing: '0.06em', fontSize: '0.95rem' }}>{subheading}</p>}
              {buttonText && <a href={buttonHref || '#'} style={btnStyle()}>{buttonText}</a>}
            </div>
          )
          return (
            <section className={cls} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
              {imageLeft ? <>{img}{txt}</> : <>{txt}{img}</>}
            </section>
          )
        }

        const centered = layout === 'centered'
        return (
          <section className={cls} style={{ position: 'relative', minHeight: height, display: 'flex', alignItems: centered ? 'center' : 'flex-end', justifyContent: centered ? 'center' : (align === 'center' ? 'center' : 'flex-start'), overflow: 'hidden' }}>
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
            <div style={{ position: 'absolute', inset: 0, background: centered ? 'rgba(12,12,12,0.45)' : 'linear-gradient(to top, rgba(12,12,12,0.7), rgba(12,12,12,0.1))' }} />
            <div style={{ position: 'relative', padding: 'clamp(2rem,5vw,4rem) clamp(1.25rem,5vw,5rem)', maxWidth: centered ? '70ch' : '60ch', textAlign: centered ? 'center' : align }}>
              {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
              <h1 style={headingStyle('clamp(2rem,5vw,3.75rem)')}>{heading}</h1>
              {subheading && <p style={{ marginTop: '1rem', color: C.body, letterSpacing: '0.06em', fontSize: '0.95rem' }}>{subheading}</p>}
              {buttonText && <a href={buttonHref || '#'} style={btnStyle()}>{buttonText}</a>}
            </div>
          </section>
        )
      },
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

    // ------------------------------------------------------ TypewriterHeading
    TypewriterHeading: {
      label: 'Typewriter Text',
      fields: {
        prefix: { type: 'text', label: 'Prefix (optional, stays static)' },
        phrases: {
          type: 'array',
          label: 'Phrases (typed one at a time, in a loop)',
          arrayFields: { text: { type: 'text', label: 'Phrase' } },
          defaultItemProps: { text: 'A new phrase' },
          getItemSummary: (item: any) => item?.text || 'Phrase',
        },
        size: {
          type: 'select',
          label: 'Size',
          options: [
            { label: 'Small', value: 'clamp(1.1rem, 2.5vw, 1.5rem)' },
            { label: 'Medium', value: 'clamp(1.6rem, 3.5vw, 2.75rem)' },
            { label: 'Large', value: 'clamp(2rem, 5vw, 3.75rem)' },
          ],
        },
        align: alignField,
        ...styleFields,
        ...responsiveFields,
      },
      defaultProps: {
        prefix: 'I photograph ',
        phrases: [
          { text: 'weddings.' },
          { text: 'portraits.' },
          { text: 'families.' },
        ],
        size: 'clamp(1.6rem, 3.5vw, 2.75rem)',
        align: 'center',
        ...styleDefaults,
        ...responsiveDefaults,
      },
      render: ({ prefix, phrases, size, align, background, backgroundImage, backgroundFade, spacing, hideOnMobile, hideOnDesktop }: any) => (
        <Section background={background} backgroundImage={backgroundImage} backgroundFade={backgroundFade} spacing={spacing} className={visClass(hideOnMobile, hideOnDesktop)}>
          <p style={{ ...headingStyle(size), textAlign: align, maxWidth: align === 'center' ? '70ch' : undefined, margin: align === 'center' ? '0 auto' : 0 }}>
            {prefix}
            <TypewriterText phrases={(phrases ?? []).map((p: any) => p.text).filter(Boolean)} />
          </p>
        </Section>
      ),
    },

    // ------------------------------------------------------- SplitImageText
    SplitImageText: {
      label: 'Split Image + Text',
      fields: {
        // TYN-329: same content fields power all 3 layouts. imagePosition
        // only applies to Side by side; Image overlay/Stacked always use a
        // fixed arrangement since a 2-way position toggle isn't meaningful
        // for a single full-width image.
        layout: layoutField(SPLIT_LAYOUT_OPTIONS),
        imageUrl: imageField('Image'),
        imagePosition: {
          type: 'radio',
          label: 'Image position (Side by side only)',
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
        layout: 'side-by-side',
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
      render: ({ layout, imageUrl, imagePosition, eyebrow, heading, body, buttonText, buttonHref, background, hideOnMobile, hideOnDesktop }: any) => {
        const bg = background && background !== 'transparent' ? background : undefined
        const cls = visClass(hideOnMobile, hideOnDesktop)

        if (layout === 'overlay') {
          return (
            <section className={cls} style={{ position: 'relative', minHeight: '50vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: C.accent }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(12,12,12,0.75), rgba(12,12,12,0.1))' }} />
              <div style={{ position: 'relative', padding: 'clamp(2rem,4vw,3.5rem)', maxWidth: '60ch' }}>
                {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
                <h2 style={headingStyle('clamp(1.5rem,3vw,2.4rem)')}>{heading}</h2>
                <p style={{ marginTop: '1rem', color: C.body, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{body}</p>
                {buttonText && <a href={buttonHref || '#'} style={btnStyle()}>{buttonText}</a>}
              </div>
            </section>
          )
        }

        if (layout === 'stacked') {
          return (
            <section className={cls} style={{ background: bg }}>
              <div style={{ minHeight: '280px', position: 'relative', background: C.accent }}>
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', maxHeight: '55vh', objectFit: 'cover', display: 'block' }} />
                )}
              </div>
              <div style={{ padding: 'clamp(2rem,4vw,3.5rem)', textAlign: 'center', maxWidth: '65ch', margin: '0 auto' }}>
                {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
                <h2 style={headingStyle('clamp(1.5rem,3vw,2.4rem)')}>{heading}</h2>
                <p style={{ marginTop: '1rem', color: C.body, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{body}</p>
                {buttonText && <a href={buttonHref || '#'} style={btnStyle()}>{buttonText}</a>}
              </div>
            </section>
          )
        }

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
          <section className={cls} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', background: bg }}>
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

    // ----------------------------------------------------------- Accordion
    Accordion: {
      label: 'Accordion',
      fields: {
        heading: { type: 'text', label: 'Heading (optional)' },
        items: {
          type: 'array',
          label: 'Sections',
          arrayFields: {
            title: { type: 'text', label: 'Title' },
            body: { type: 'textarea', label: 'Body' },
          },
          defaultItemProps: { title: 'A common question', body: 'The answer, in a sentence or two.' },
          getItemSummary: (item: any) => item?.title || 'Section',
        },
        ...styleFields,
        ...responsiveFields,
      },
      defaultProps: {
        heading: 'Frequently Asked Questions',
        items: [
          { title: 'How far in advance should I book?', body: 'Most sessions book 4-8 weeks out - weddings often further ahead.' },
        ],
        ...styleDefaults,
        ...responsiveDefaults,
      },
      render: ({ heading, items, background, backgroundImage, backgroundFade, spacing, hideOnMobile, hideOnDesktop }: any) => (
        <Section background={background} backgroundImage={backgroundImage} backgroundFade={backgroundFade} spacing={spacing} className={visClass(hideOnMobile, hideOnDesktop)}>
          {heading && <h2 style={{ ...headingStyle(), textAlign: 'center', marginBottom: '2rem' }}>{heading}</h2>}
          <AccordionBlock items={items ?? []} />
        </Section>
      ),
    },
    // ------------------------------------------------------- ContactFormBlock
    ContactFormBlock: {
      label: 'Contact Form',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow (optional)' },
        heading: { type: 'text', label: 'Heading (optional)' },
        subtext: { type: 'textarea', label: 'Subtext (optional)' },
        ...styleFields,
        ...responsiveFields,
      },
      defaultProps: {
        eyebrow: '',
        heading: "Let's Connect",
        subtext: "Fill out the form and I'll be in touch within 48 hours.",
        ...styleDefaults,
        ...responsiveDefaults,
      },
      render: ({ eyebrow, heading, subtext, background, backgroundImage, backgroundFade, spacing, hideOnMobile, hideOnDesktop }: any) => (
        <Section background={background} backgroundImage={backgroundImage} backgroundFade={backgroundFade} spacing={spacing} className={visClass(hideOnMobile, hideOnDesktop)}>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            {eyebrow && <p style={{ ...eyebrowStyle, textAlign: 'center' }}>{eyebrow}</p>}
            {heading && <h2 style={{ ...headingStyle('clamp(1.5rem,3vw,2.4rem)'), textAlign: 'center' }}>{heading}</h2>}
            {subtext && <p style={{ marginTop: '0.85rem', marginBottom: '2rem', color: C.detail, textAlign: 'center' }}>{subtext}</p>}
            <ContactForm />
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
        // TYN-329: photos/size/aspect/frame apply across all 3 layouts (aspect
        // is ignored by Masonry, which preserves each photo's natural ratio).
        layout: layoutField(GALLERY_LAYOUT_OPTIONS),
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
          label: 'Shape (Grid/Featured only)',
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
      defaultProps: { layout: 'grid', images: [], size: '300px', aspect: '4 / 5', frame: 'plain', ...responsiveDefaults },
      render: ({ layout, images, size, aspect, frame, hideOnMobile, hideOnDesktop }: any) => {
        const valid = (images ?? []).filter((i: any) => i?.url)
        const taped = frame === 'taped'
        const polaroid = frame === 'polaroid'
        const framed = taped || polaroid
        const frameClass = taped ? 'pk-taped' : polaroid ? 'pk-polaroid' : undefined
        const cols = GALLERY_COLS_BY_SIZE[size] ?? 3
        const gap = framed ? 'clamp(1.5rem,3vw,2.75rem)' : '0.75rem'

        if (valid.length === 0) {
          return (
            <section className={visClass(hideOnMobile, hideOnDesktop)} style={{ padding: 'clamp(1.5rem,4vw,3rem) clamp(1.25rem,2.5vw,2.5rem)' }}>
              <p style={{ color: C.detail, textAlign: 'center' }}>Add photos to populate the gallery.</p>
            </section>
          )
        }

        if (layout === 'masonry') {
          return (
            <section className={visClass(hideOnMobile, hideOnDesktop)} style={{ padding: framed ? 'clamp(2rem,5vw,3.75rem) clamp(1.25rem,3vw,3rem)' : 'clamp(1.5rem,4vw,3rem) clamp(1.25rem,2.5vw,2.5rem)' }}>
              <div style={{ columnCount: cols, columnGap: gap }}>
                {valid.map((img: any, i: number) => (
                  <div key={i} className={frameClass} style={{ breakInside: 'avoid', marginBottom: gap, transform: framed ? `rotate(${(i % 2 === 0 ? -1 : 1) * (1.2 + (i % 3) * 0.6)}deg)` : undefined }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: framed ? undefined : '2px' }} />
                  </div>
                ))}
              </div>
            </section>
          )
        }

        if (layout === 'featured') {
          return (
            <section className={visClass(hideOnMobile, hideOnDesktop)} style={{ padding: framed ? 'clamp(2rem,5vw,3.75rem) clamp(1.25rem,3vw,3rem)' : 'clamp(1.5rem,4vw,3rem) clamp(1.25rem,2.5vw,2.5rem)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: '1fr', gap, alignItems: 'start' }}>
                {valid.map((img: any, i: number) => {
                  const isFeatured = i === 0 && valid.length > 1
                  const tile = (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', aspectRatio: isFeatured ? undefined : aspect, objectFit: 'cover', borderRadius: framed ? undefined : '2px' }} />
                  )
                  return (
                    <div
                      key={i}
                      className={frameClass}
                      style={{
                        gridColumn: isFeatured ? `span ${Math.min(2, cols)}` : undefined,
                        gridRow: isFeatured ? 'span 2' : undefined,
                        transform: framed ? `rotate(${(i % 2 === 0 ? -1 : 1) * (1.2 + (i % 3) * 0.6)}deg)` : undefined,
                      }}
                    >
                      {tile}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        }

        return (
          <section className={visClass(hideOnMobile, hideOnDesktop)} style={{ padding: framed ? 'clamp(2rem,5vw,3.75rem) clamp(1.25rem,3vw,3rem)' : 'clamp(1.5rem,4vw,3rem) clamp(1.25rem,2.5vw,2.5rem)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${size}, 1fr))`, gap, alignItems: 'start' }}>
              {valid.map((img: any, i: number) =>
                framed ? (
                  <div key={i} className={frameClass} style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (1.2 + (i % 3) * 0.6)}deg)` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" style={{ width: '100%', aspectRatio: aspect, objectFit: 'cover' }} />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img.url} alt="" style={{ width: '100%', aspectRatio: aspect, objectFit: 'cover', borderRadius: '2px' }} />
                )
              )}
            </div>
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

    // ---------------------------------------------------------- ImageGrid
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
        columns: {
          type: 'select',
          label: 'Columns',
          options: [
            { label: '2 columns', value: '2' },
            { label: '3 columns', value: '3' },
            { label: '4 columns', value: '4' },
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
        gap: {
          type: 'select',
          label: 'Gap',
          options: [
            { label: 'None', value: '0' },
            { label: 'Small', value: '0.5rem' },
            { label: 'Medium', value: '1rem' },
            { label: 'Large', value: '2rem' },
          ],
        },
        ...responsiveFields,
      },
      defaultProps: { images: [], columns: '3', aspect: '1 / 1', gap: '0.5rem', ...responsiveDefaults },
      render: ({ images, columns, aspect, gap, hideOnMobile, hideOnDesktop }: any) => {
        const valid = (images ?? []).filter((i: any) => i?.url)
        return (
          <section className={visClass(hideOnMobile, hideOnDesktop)} style={{ padding: 'clamp(1.5rem,4vw,3rem) clamp(1.25rem,2.5vw,2.5rem)' }}>
            {valid.length === 0 ? (
              <p style={{ color: C.detail, textAlign: 'center' }}>Add photos to populate the grid.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
                {valid.map((img: any, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img.url} alt="" style={{ width: '100%', aspectRatio: aspect, objectFit: 'cover' }} />
                ))}
              </div>
            )}
          </section>
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

    // ----------------------------------------------------------- SocialLinks
    SocialLinks: {
      label: 'Social Links',
      fields: {
        instagramUrl: { type: 'text', label: 'Instagram URL' },
        facebookUrl: { type: 'text', label: 'Facebook URL' },
        tiktokUrl: { type: 'text', label: 'TikTok URL' },
        pinterestUrl: { type: 'text', label: 'Pinterest URL' },
        size: {
          type: 'select',
          label: 'Icon size',
          options: [
            { label: 'Small', value: '18' },
            { label: 'Medium', value: '24' },
            { label: 'Large', value: '32' },
          ],
        },
        color: {
          type: 'select',
          label: 'Icon color',
          options: [
            { label: 'Detail', value: 'var(--color-detail, #9B9A9A)' },
            { label: 'Heading', value: 'var(--color-heading, #D6D1CE)' },
            { label: 'Button', value: 'var(--color-btn-bg, #9B9A9A)' },
          ],
        },
        align: alignField,
        ...responsiveFields,
      },
      defaultProps: {
        // Pre-filled with the same handles the site footer currently links to
        // (components/Footer/Footer.tsx) - editable per-instance since Site
        // Config's social fields aren't wired into the live site yet (TYN-326).
        instagramUrl: 'https://instagram.com/tynnellhollinsphotography',
        facebookUrl: '',
        tiktokUrl: 'https://tiktok.com/@tynnellhollinsphotography',
        pinterestUrl: '',
        size: '24',
        color: 'var(--color-detail, #9B9A9A)',
        align: 'center',
        ...responsiveDefaults,
      },
      render: ({ instagramUrl, facebookUrl, tiktokUrl, pinterestUrl, size, color, align, hideOnMobile, hideOnDesktop }: any) => {
        const links: { platform: string; href: string; label: string }[] = [
          instagramUrl && { platform: 'instagram', href: instagramUrl, label: 'Instagram' },
          facebookUrl && { platform: 'facebook', href: facebookUrl, label: 'Facebook' },
          tiktokUrl && { platform: 'tiktok', href: tiktokUrl, label: 'TikTok' },
          pinterestUrl && { platform: 'pinterest', href: pinterestUrl, label: 'Pinterest' },
        ].filter(Boolean) as { platform: string; href: string; label: string }[]

        if (links.length === 0) return <></>
        const iconSize = Number(size) || 24

        return (
          <div
            className={visClass(hideOnMobile, hideOnDesktop)}
            style={{ padding: 'clamp(1rem,3vw,2rem)', display: 'flex', gap: '1.1rem', justifyContent: align === 'center' ? 'center' : 'flex-start' }}
          >
            {links.map(({ platform, href, label }) => (
              <a key={platform} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} style={{ display: 'flex' }}>
                <SocialIcon platform={platform} size={iconSize} color={color} />
              </a>
            ))}
          </div>
        )
      },
    },

    // -------------------------------------------------------------------- Map
    // Plain Google Maps "output=embed" iframe (TYN-333) - no API key, no JS
    // map library, so this costs nothing and can't fail on a missing/rotated
    // key. Zoom/style customization isn't available on this embed form, which
    // is the deliberate tradeoff for zero setup and zero recurring cost.
    Map: {
      label: 'Map',
      fields: {
        heading: { type: 'text', label: 'Heading (optional)' },
        address: { type: 'text', label: 'Address or location' },
        height: {
          type: 'select',
          label: 'Height',
          options: [
            { label: 'Tall', value: '480px' },
            { label: 'Medium', value: '380px' },
            { label: 'Short', value: '280px' },
          ],
        },
        ...styleFields,
        ...responsiveFields,
      },
      defaultProps: {
        heading: '',
        address: 'Los Angeles, CA',
        height: '380px',
        ...styleDefaults,
        ...responsiveDefaults,
      },
      render: ({ heading, address, height, background, backgroundImage, backgroundFade, spacing, hideOnMobile, hideOnDesktop }: any) => (
        <Section background={background} backgroundImage={backgroundImage} backgroundFade={backgroundFade} spacing={spacing} className={visClass(hideOnMobile, hideOnDesktop)}>
          {heading && <h2 style={{ ...headingStyle(), textAlign: 'center', marginBottom: '1.5rem' }}>{heading}</h2>}
          <div style={{ position: 'relative', width: '100%', height }}>
            {address ? (
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={heading || 'Map'}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.accent, color: C.detail }}>
                Add an address to show the map.
              </div>
            )}
          </div>
        </Section>
      ),
    },
    // --------------------------------------------------------- InstagramFeed
    // Third-party embed (TYN-335), not Instagram's own Graph API - avoids
    // registering a developer app and refreshing an access token forever.
    // Standardized on SnapWidget specifically because its default embed is a
    // plain iframe (no injected <script>, so no CSP script-src loosening
    // needed) with a free tier. Switching providers later means updating
    // both this block's help text and the snapwidget.com CSP frame-src entry
    // in next.config.mjs.
    InstagramFeed: {
      label: 'Instagram Feed',
      fields: {
        heading: { type: 'text', label: 'Heading (optional)' },
        embedUrl: { type: 'text', label: 'SnapWidget embed URL (from snapwidget.com, looks like https://snapwidget.com/embed/123456)' },
        height: {
          type: 'select',
          label: 'Height',
          options: [
            { label: 'Tall', value: '600px' },
            { label: 'Medium', value: '450px' },
            { label: 'Short', value: '300px' },
          ],
        },
        ...styleFields,
        ...responsiveFields,
      },
      defaultProps: {
        heading: '',
        embedUrl: '',
        height: '450px',
        ...styleDefaults,
        ...responsiveDefaults,
      },
      render: ({ heading, embedUrl, height, background, backgroundImage, backgroundFade, spacing, hideOnMobile, hideOnDesktop }: any) => (
        <Section background={background} backgroundImage={backgroundImage} backgroundFade={backgroundFade} spacing={spacing} className={visClass(hideOnMobile, hideOnDesktop)}>
          {heading && <h2 style={{ ...headingStyle(), textAlign: 'center', marginBottom: '1.5rem' }}>{heading}</h2>}
          <div style={{ position: 'relative', width: '100%', height }}>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                loading="lazy"
                scrolling="no"
                title={heading || 'Instagram Feed'}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.accent, color: C.detail, textAlign: 'center', padding: '1rem' }}>
                Add a SnapWidget embed URL to show the feed.
              </div>
            )}
          </div>
        </Section>
      ),
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
