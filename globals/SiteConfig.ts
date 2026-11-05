import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/app/lib/access'

export const SiteConfig: GlobalConfig = {
  slug: 'site-config',
  label: 'Site Settings',
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    group: 'Site Settings',
    description:
      'Global settings for your website - business name, contact info, and social media links.',
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
    // Rising Roots gap 4: the "Work with me" cards in the full-screen menu.
    // Edited on /site-settings; links are checked by app/lib/menuCards.ts
    // both when saved and when read.
    {
      name: 'menuCards',
      type: 'array',
      label: 'Menu "Work with me" cards',
      maxRows: 2,
      admin: {
        description: 'Up to two cards shown in the full-screen menu, each linking to a page.',
      },
      fields: [
        { name: 'title', type: 'text', label: 'Title' },
        { name: 'linkLabel', type: 'text', label: 'Link text' },
        { name: 'href', type: 'text', label: 'Link (a page like /services, or an https:// address)' },
        { name: 'imageUrl', type: 'text', label: 'Photo' },
      ],
    },
  ],
}
