import type { CollectionAfterChangeHook, CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Auto-generate slug from title so Tynnell never has to think about URLs.
// Only sets the slug if it is empty, manual slugs are preserved.
const autoSlugFromTitle: CollectionBeforeValidateHook = ({ data = {} }) => {
  if (!data.slug && data.title) {
    data.slug = toSlug(data.title as string)
  }
  return data
}

// Bust the ISR cache for the affected gallery page (and the portfolio index)
// on every save so the Live Preview pane reflects changes immediately instead
// of waiting up to the 120s revalidate window (TYN-200). No-op outside a Next
// request scope (e.g. the Payload CLI).
const revalidateGallery: CollectionAfterChangeHook = ({ doc }) => {
  try {
    if (doc?.slug) revalidatePath(`/portfolio/${doc.slug}`)
    revalidatePath('/portfolio')
  } catch {
    // No-op outside a Next request scope.
  }
  return doc
}

export const Galleries: CollectionConfig = {
  slug: 'galleries',
  labels: {
    singular: 'Gallery',
    plural: 'Galleries',
  },
  hooks: {
    beforeValidate: [autoSlugFromTitle],
    afterChange: [revalidateGallery],
  },
  admin: {
    group: 'My Portfolio',
    useAsTitle: 'title',
    description:
      'Curated collections of photos shown on your Portfolio page. Each gallery has a category, a cover photo, and a set of photos.',
    defaultColumns: ['coverPhoto', 'title', 'category', 'featured', 'updatedAt'],
    components: {
      views: {
        list: {
          Component: './components/admin/GalleryGridView#GalleryGridView',
        },
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Gallery Title',
      required: true,
      admin: {
        description:
          'The name of this gallery, shown on your portfolio page. Example: "Smith Wedding" or "Fall Family Portraits".',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'URL Slug',
      required: true,
      unique: true,
      admin: {
        description:
          'Auto-generated from the title - you do not need to set this. If you want a custom web address, you can edit it here. Use lowercase letters and hyphens only.',
      },
    },
    {
      name: 'viewOnSite',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: './components/admin/GalleryViewOnSiteButton#GalleryViewOnSiteButton',
        },
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      required: true,
      admin: {
        description: 'The type of session this gallery is from. Used to filter your portfolio.',
      },
      options: [
        { label: 'Weddings', value: 'weddings' },
        { label: 'Portraits', value: 'portraits' },
        { label: 'Families', value: 'families' },
        { label: 'Couples', value: 'couples' },
        { label: 'Brands', value: 'brands' },
      ],
    },
    {
      name: 'coverPhoto',
      type: 'relationship',
      label: 'Cover Photo',
      relationTo: 'photos',
      required: true,
      admin: {
        description:
          'The photo shown as the preview for this gallery on your portfolio page. Must be a photo already uploaded to All Photos.',
        components: {
          Cell: './components/admin/CoverPhotoCell#CoverPhotoCell',
          Field: './components/admin/CoverPhotoPicker#CoverPhotoPicker',
        },
      },
    },
    {
      name: 'bulkPhotoPicker',
      type: 'ui',
      admin: {
        components: {
          Field: './components/admin/GalleryBulkPhotoPicker#GalleryBulkPhotoPicker',
        },
      },
    },
    {
      name: 'photos',
      type: 'array',
      label: 'Photos in This Gallery',
      admin: {
        description:
          'Use the button above to add photos. Drag the thumbnails to reorder them - the order here is exactly how they appear on your site. Hover a photo to set it as the cover or remove it.',
        components: {
          // Visual grid arranger replaces Payload's default vertical row list.
          Field: './components/admin/GalleryPhotoArranger#GalleryPhotoArranger',
        },
      },
      fields: [
        {
          name: 'photo',
          type: 'relationship',
          relationTo: 'photos',
          required: true,
          label: 'Photo',
        },
      ],
    },
    {
      name: 'tapedStyle',
      type: 'checkbox',
      label: 'Taped Photo Style',
      defaultValue: false,
      admin: {
        description:
          'Display this gallery with the editorial taped-photo look (each photo on a cream mat with tape corners and a slight tilt). Leave off for a clean grid.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Show on Homepage',
      defaultValue: false,
      admin: {
        description: 'Turn on to feature this gallery on your homepage.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      label: 'Display Position',
      admin: {
        hidden: true,
      },
    },
  ],
}
