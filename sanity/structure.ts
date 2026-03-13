import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // ── Singletons ──────────────────────────────────────────
      S.listItem()
        .title('Site Settings')
        .id('siteConfig')
        .child(
          S.document()
            .schemaType('siteConfig')
            .documentId('siteConfig')
        ),
      S.listItem()
        .title('About Page')
        .id('aboutPage')
        .child(
          S.document()
            .schemaType('aboutPage')
            .documentId('aboutPage')
        ),

      S.divider(),

      // ── Homepage content ─────────────────────────────────────
      S.listItem()
        .title('Hero Slides')
        .child(S.documentTypeList('heroSlide').title('Hero Slides')),
      S.listItem()
        .title('Testimonials')
        .child(S.documentTypeList('testimonial').title('Testimonials')),

      S.divider(),

      // ── Portfolio ────────────────────────────────────────────
      S.listItem()
        .title('Photos')
        .child(S.documentTypeList('photo').title('Photos')),
      S.listItem()
        .title('Galleries')
        .child(S.documentTypeList('gallery').title('Galleries')),

      S.divider(),

      // ── Services & Blog ──────────────────────────────────────
      S.listItem()
        .title('Services')
        .child(S.documentTypeList('service').title('Services')),
      S.listItem()
        .title('Blog Posts')
        .child(S.documentTypeList('post').title('Blog Posts')),
    ])
