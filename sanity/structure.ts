import type { StructureResolver } from 'sanity/structure'
import {
  CogIcon,
  ComposeIcon,
  DocumentsIcon,
  EarthGlobeIcon,
  FolderIcon,
  ImageIcon,
  ImagesIcon,
  PlayIcon,
  StarFilledIcon,
  TagIcon,
  UploadIcon,
  UserIcon,
} from '@sanity/icons'
import { BulkUploadPane } from './components/BulkUploadPane'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Studio')
    .items([

      // ── My Website ──────────────────────────────────────────────
      // Homepage-facing content: slides, services, testimonials
      S.listItem()
        .title('My Website')
        .icon(EarthGlobeIcon)
        .child(
          S.list()
            .title('My Website')
            .items([
              S.listItem()
                .title('Hero Slides')
                .icon(PlayIcon)
                .child(S.documentTypeList('heroSlide').title('Hero Slides')),
              S.listItem()
                .title('Services')
                .icon(TagIcon)
                .child(S.documentTypeList('service').title('Services')),
              S.listItem()
                .title('Testimonials')
                .icon(StarFilledIcon)
                .child(S.documentTypeList('testimonial').title('Testimonials')),
            ])
        ),

      S.divider(),

      // ── Portfolio ───────────────────────────────────────────────
      // Galleries, bulk upload tool, and individual photo management
      S.listItem()
        .title('Portfolio')
        .icon(ImagesIcon)
        .child(
          S.list()
            .title('Portfolio')
            .items([
              S.listItem()
                .title('Galleries')
                .icon(FolderIcon)
                .child(S.documentTypeList('gallery').title('Galleries')),
              S.listItem()
                .title('Upload Photos')
                .icon(UploadIcon)
                .id('bulkUpload')
                .child(
                  S.component(BulkUploadPane)
                    .title('Upload Multiple Photos')
                ),
              S.listItem()
                .title('All Photos')
                .icon(ImageIcon)
                .child(S.documentTypeList('photo').title('All Photos')),
            ])
        ),

      S.divider(),

      // ── Blog ────────────────────────────────────────────────────
      S.listItem()
        .title('Blog')
        .icon(ComposeIcon)
        .child(S.documentTypeList('post').title('Blog Posts')),

      S.divider(),

      // ── Singletons ──────────────────────────────────────────────
      // Open directly into the document — no list view needed
      S.listItem()
        .title('About Page')
        .icon(UserIcon)
        .id('aboutPage')
        .child(
          S.document()
            .schemaType('aboutPage')
            .documentId('aboutPage')
        ),
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .id('siteConfig')
        .child(
          S.document()
            .schemaType('siteConfig')
            .documentId('siteConfig')
        ),

      S.divider(),

      // ── Pages ───────────────────────────────────────────────────
      S.listItem()
        .title('Pages')
        .icon(DocumentsIcon)
        .child(S.documentTypeList('page').title('Pages')),

    ])
