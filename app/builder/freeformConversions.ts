/* eslint-disable @typescript-eslint/no-explicit-any */
// TYN-355 Phase 4 follow-up: one-way "Convert to Freeform" - turns an
// existing top-level block into a FreeformSection with equivalent freeform
// elements, so a page built from the old stacked-block model can be
// incrementally moved to Pixieset-style drag-anywhere editing without a
// wholesale site migration.
//
// Only blocks with a clean, small, fixed-shape mapping to the 15 freeform
// element types are covered here. Live-data-bound blocks (LiveTestimonials,
// LiveServices, LiveBlog, PortfolioGrid, AlbumGrid, SpecialtiesReveal) and
// multi-item list layouts with no natural fixed-position equivalent
// (Testimonials, Services) are deliberately NOT included - ConvertToFreeformTrigger
// simply doesn't render a button for any componentType not listed here.
//
// Positions are reasonable starting layouts, not pixel-perfect replicas of
// the original block's render - the whole point of freeform elements is that
// they get dragged into place afterward, not that this has to be exact.
export type FreeformElementSeed = { type: string; props: Record<string, unknown> }

const imageDefaults = { alt: '', focalX: 50, focalY: 50, imageOpacity: 100, overlayOpacity: 0, overlayColor: '#000000', anchorHref: '' }

export const FREEFORM_CONVERSIONS: Record<string, (props: Record<string, any>) => FreeformElementSeed[]> = {
  Hero: (p) => {
    const els: FreeformElementSeed[] = []
    if (p.imageUrl) els.push({ type: 'ImageElement', props: { ...imageDefaults, url: p.imageUrl, x: 0, y: 0, width: 100, height: 100, rotate: 0 } })
    if (p.eyebrow) els.push({ type: 'TextElement', props: { text: p.eyebrow, align: p.align ?? 'left', x: 8, y: 15, width: 60, height: 10, rotate: 0 } })
    if (p.heading) els.push({ type: 'TextElement', props: { text: p.heading, align: p.align ?? 'left', x: 8, y: 28, width: 70, height: 20, rotate: 0 } })
    if (p.subheading) els.push({ type: 'TextElement', props: { text: p.subheading, align: p.align ?? 'left', x: 8, y: 50, width: 60, height: 15, rotate: 0 } })
    if (p.buttonText) els.push({ type: 'ButtonElement', props: { text: p.buttonText, href: p.buttonHref ?? '', align: p.align ?? 'left', x: 8, y: 68, width: 24, height: 9, rotate: 0 } })
    return els
  },

  SplitImageText: (p) => {
    const els: FreeformElementSeed[] = []
    const imageRight = p.imagePosition === 'right'
    if (p.imageUrl) els.push({ type: 'ImageElement', props: { ...imageDefaults, url: p.imageUrl, x: imageRight ? 55 : 0, y: 0, width: 45, height: 100, rotate: 0 } })
    const textX = imageRight ? 5 : 52
    if (p.eyebrow) els.push({ type: 'TextElement', props: { text: p.eyebrow, align: 'left', x: textX, y: 10, width: 40, height: 10, rotate: 0 } })
    if (p.heading) els.push({ type: 'TextElement', props: { text: p.heading, align: 'left', x: textX, y: 25, width: 40, height: 20, rotate: 0 } })
    if (p.body) els.push({ type: 'TextElement', props: { text: p.body, align: 'left', x: textX, y: 48, width: 40, height: 30, rotate: 0 } })
    if (p.buttonText) els.push({ type: 'ButtonElement', props: { text: p.buttonText, href: p.buttonHref ?? '', align: 'left', x: textX, y: 80, width: 24, height: 9, rotate: 0 } })
    return els
  },

  CTA: (p) => {
    const els: FreeformElementSeed[] = []
    if (p.heading) els.push({ type: 'TextElement', props: { text: p.heading, align: 'center', x: 15, y: 25, width: 70, height: 20, rotate: 0 } })
    if (p.subtext) els.push({ type: 'TextElement', props: { text: p.subtext, align: 'center', x: 20, y: 48, width: 60, height: 15, rotate: 0 } })
    if (p.buttonText) els.push({ type: 'ButtonElement', props: { text: p.buttonText, href: p.buttonHref ?? '', align: 'center', x: 38, y: 66, width: 24, height: 9, rotate: 0 } })
    return els
  },

  SectionHeading: (p) => {
    const els: FreeformElementSeed[] = []
    if (p.eyebrow) els.push({ type: 'TextElement', props: { text: p.eyebrow, align: p.align ?? 'center', x: 10, y: 10, width: 80, height: 12, rotate: 0 } })
    if (p.heading) els.push({ type: 'TextElement', props: { text: p.heading, align: p.align ?? 'center', x: 10, y: 28, width: 80, height: 20, rotate: 0 } })
    if (p.subtext) els.push({ type: 'TextElement', props: { text: p.subtext, align: p.align ?? 'center', x: 10, y: 52, width: 80, height: 20, rotate: 0 } })
    return els
  },

  RichText: (p) => [{ type: 'TextElement', props: { text: p.text ?? '', align: p.align ?? 'left', x: 10, y: 10, width: 80, height: 60, rotate: 0 } }],

  Shape: (p) => {
    const sizePct = p.size === '80px' ? 15 : p.size === '280px' ? 35 : 25
    return [{ type: 'ShapeElement', props: { shapeType: p.shapeType ?? 'circle', color: p.color, opacity: p.opacity, x: (100 - sizePct) / 2, y: (100 - sizePct) / 2, width: sizePct, height: sizePct, rotate: 0 } }]
  },

  Line: (p) => {
    const widthPct = p.length === '160px' ? 20 : p.length === '100%' ? 90 : 40
    return [{ type: 'LineElement', props: { thickness: p.thickness ?? '2px', color: p.color, x: (100 - widthPct) / 2, y: 45, width: widthPct, height: 1, rotate: 0 } }]
  },

  SocialLinks: (p) => [{
    type: 'SocialLinksElement',
    props: { instagramUrl: p.instagramUrl ?? '', facebookUrl: p.facebookUrl ?? '', tiktokUrl: p.tiktokUrl ?? '', pinterestUrl: p.pinterestUrl ?? '', size: p.size ?? '24', color: p.color, x: 30, y: 40, width: 40, height: 10, rotate: 0 },
  }],

  Video: (p) => [{ type: 'VideoElement', props: { videoUrl: p.videoUrl ?? '', autoplay: p.autoplay ?? false, loop: p.loop ?? false, muted: p.muted ?? true, x: 10, y: 10, width: 80, height: 80, rotate: 0 } }],

  Map: (p) => {
    const els: FreeformElementSeed[] = []
    if (p.heading) els.push({ type: 'TextElement', props: { text: p.heading, align: 'center', x: 10, y: 5, width: 80, height: 12, rotate: 0 } })
    els.push({ type: 'MapElement', props: { address: p.address ?? '', x: 10, y: p.heading ? 20 : 10, width: 80, height: p.heading ? 70 : 80, rotate: 0 } })
    return els
  },

  InstagramFeed: (p) => {
    const els: FreeformElementSeed[] = []
    if (p.heading) els.push({ type: 'TextElement', props: { text: p.heading, align: 'center', x: 10, y: 5, width: 80, height: 12, rotate: 0 } })
    els.push({ type: 'InstagramFeedElement', props: { embedUrl: p.embedUrl ?? '', x: 10, y: p.heading ? 20 : 10, width: 80, height: p.heading ? 70 : 80, rotate: 0 } })
    return els
  },

  ContactFormBlock: (p) => [{ type: 'ContactFormElement', props: { eyebrow: p.eyebrow ?? '', heading: p.heading ?? '', subtext: p.subtext ?? '', x: 20, y: 5, width: 60, height: 90, rotate: 0 } }],

  Accordion: (p) => [{ type: 'AccordionElement', props: { heading: p.heading ?? '', items: p.items ?? [], x: 15, y: 10, width: 70, height: 80, rotate: 0 } }],

  TypewriterHeading: (p) => [{ type: 'TypewriterTextElement', props: { prefix: p.prefix ?? '', phrases: p.phrases ?? [], size: p.size, align: p.align ?? 'center', x: 10, y: 35, width: 80, height: 30, rotate: 0 } }],

  PhotoCarousel: (p) => {
    const els: FreeformElementSeed[] = []
    if (p.heading) els.push({ type: 'TextElement', props: { text: p.heading, align: 'center', x: 10, y: 5, width: 80, height: 12, rotate: 0 } })
    els.push({ type: 'ImageCarouselElement', props: { images: p.images ?? [], x: 10, y: p.heading ? 20 : 10, width: 80, height: p.heading ? 70 : 80, rotate: 0 } })
    return els
  },

  ImageGrid: (p) => [{ type: 'ImageGridElement', props: { images: p.images ?? [], columns: p.columns ?? '3', gap: p.gap ?? '0.5rem', x: 10, y: 10, width: 80, height: 80, rotate: 0 } }],

  FullWidthImage: (p) => [{ type: 'ImageElement', props: { ...imageDefaults, url: p.imageUrl ?? '', alt: p.caption ?? '', x: 0, y: 0, width: 100, height: 100, rotate: 0 } }],
}

export function canConvertToFreeform(componentType: string): boolean {
  return componentType in FREEFORM_CONVERSIONS
}
