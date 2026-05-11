import { defineField, defineType } from 'sanity'

export const siteConfig = defineType({
  name: 'siteConfig',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Business Name',
      type: 'string',
      description: 'Your business name as it appears in browser tabs and search results. Example: "Tynnell Hollins Photography".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Brand Tagline',
      type: 'string',
      description: "Your tagline shown on your homepage. Example: \"Capturing life's most meaningful moments\".",
    }),
    defineField({
      name: 'email',
      title: 'Contact Email',
      type: 'string',
      description: 'Your contact email address, displayed on your contact page.',
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      description: 'Your phone number, displayed on your contact page.',
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram Profile URL',
      type: 'url',
      description: 'Your full Instagram URL. Example: https://instagram.com/tynnellhollinsphotography',
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Facebook Page URL',
      type: 'url',
      description: 'Your full Facebook page URL.',
    }),
    defineField({
      name: 'tiktokUrl',
      title: 'TikTok Profile URL',
      type: 'url',
      description: 'Your full TikTok profile URL.',
    }),
    defineField({
      name: 'pinterestUrl',
      title: 'Pinterest Profile URL',
      type: 'url',
      description: 'Your full Pinterest profile URL.',
    }),
  ],
  preview: {
    select: { title: 'title' },
  },
})
