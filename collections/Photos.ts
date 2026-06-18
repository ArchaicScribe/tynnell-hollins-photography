import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

// Auto-populate title and alt from the filename so bulk uploads never get
// blocked by required-field validation. Tynnell can clean up titles/alt text
// later at her own pace.
const autoPopulateFromFilename: CollectionBeforeValidateHook = ({ data = {} }) => {
  const filename = (data.filename as string | undefined) ?? ''

  if (!data.title && filename) {
    // "smith-wedding_first-dance.jpg" -> "Smith wedding first dance"
    const stem = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
    data.title = stem.charAt(0).toUpperCase() + stem.slice(1)
  }

  if (!data.alt && data.title) {
    data.alt = data.title as string
  }

  return data
}

export const Photos: CollectionConfig = {
  slug: 'photos',
  labels: {
    singular: 'Photo',
    plural: 'Photos',
  },
  hooks: {
    beforeValidate: [autoPopulateFromFilename],
  },
  upload: {
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    bulkUpload: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 800,
        height: 600,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/*'],
  },
  admin: {
    group: 'My Portfolio',
    useAsTitle: 'title',
    description:
      'Your photo library. Drop images here and they upload instantly - title and alt text are filled in automatically from the filename so you can bulk-upload without stopping. Edit any photo afterwards to update the details.',
    defaultColumns: ['filename', 'title', 'category', 'featured', 'updatedAt'],
    components: {
      views: {
        list: {
          Component: './components/admin/PhotoGridView#PhotoGridView',
        },
      },
    },
  },
  fields: [
    {
      // Custom edit header: large preview + metadata + featured/gallery at a
      // glance. Sits above the form fields; Payload still owns Save + upload.
      name: 'editHeader',
      type: 'ui',
      admin: {
        components: {
          Field: './components/admin/PhotoEditHeader#PhotoEditHeader',
        },
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      admin: {
        description:
          'Auto-filled from the filename on upload. Edit this to give the photo a meaningful name - clients never see it. Example: "Smith Wedding - First Dance".',
      },
    },
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text (Accessibility and SEO)',
      admin: {
        description:
          'Describe what is in this photo. Screen readers read this aloud for visually impaired visitors and Google uses it to understand your images. Auto-filled on upload - update it when you have a moment. Example: "Bride and groom laughing during their first dance at an outdoor reception."',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      admin: {
        description: 'The type of session this photo is from. Used to filter your portfolio.',
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
      name: 'viewInPortfolio',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: './components/admin/PhotoViewInPortfolioButton#PhotoViewInPortfolioButton',
        },
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      admin: {
        description:
          'Optional text displayed beneath this photo in galleries. Leave blank for no caption.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Show on Homepage',
      defaultValue: false,
      admin: {
        description:
          'Turn on to feature this photo in the portfolio preview section on your homepage. Up to 6 photos are shown.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      label: 'Display Position',
      admin: {
        description:
          'Controls the order this photo appears in. Lower numbers appear first. Leave blank and sort manually later.',
      },
    },
  ],
}
