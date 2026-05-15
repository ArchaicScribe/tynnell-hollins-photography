import type { GlobalConfig } from 'payload'

export const SiteConfig: GlobalConfig = {
  slug: 'site-config',
  label: 'Site Settings',
  admin: {
    description:
      'Global settings for your website — business name, contact info, and social media links.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Business Name',
      required: true,
      admin: {
        description:
          'Your business name as it appears in browser tabs and search results. Example: "Tynnell Hollins Photography".',
      },
    },
    {
      name: 'tagline',
      type: 'text',
      label: 'Brand Tagline',
      admin: {
        description:
          "Your tagline shown on your homepage. Example: \"Capturing life's most meaningful moments\".",
      },
    },
    {
      name: 'email',
      type: 'email',
      label: 'Contact Email',
      admin: {
        description: 'Your contact email address, displayed on your contact page.',
      },
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Phone Number',
      admin: {
        description: 'Your phone number, displayed on your contact page.',
      },
    },
    {
      name: 'instagramUrl',
      type: 'text',
      label: 'Instagram Profile URL',
      admin: {
        description:
          'Your full Instagram URL. Example: https://instagram.com/tynnellhollinsphotography',
      },
    },
    {
      name: 'facebookUrl',
      type: 'text',
      label: 'Facebook Page URL',
      admin: {
        description: 'Your full Facebook page URL.',
      },
    },
    {
      name: 'tiktokUrl',
      type: 'text',
      label: 'TikTok Profile URL',
      admin: {
        description: 'Your full TikTok profile URL.',
      },
    },
    {
      name: 'pinterestUrl',
      type: 'text',
      label: 'Pinterest Profile URL',
      admin: {
        description: 'Your full Pinterest profile URL.',
      },
    },
  ],
}
