/**
 * Seeds the Sanity dataset with the 6 booking packages.
 * Run with: node scripts/seed-services.mjs
 * Requires SANITY_API_TOKEN in environment (uses op run via dev.ps1 or direct env).
 */

import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'pl42d383',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const services = [
  {
    _type: 'service',
    eyebrow: 'Weddings',
    title: 'Wedding Day',
    description: 'Full-day coverage of your ceremony, portraits, and reception. Every moment, beautifully told.',
    depositAmount: 500,
    order: 1,
  },
  {
    _type: 'service',
    eyebrow: 'Engagements',
    title: 'Engagement Session',
    description: 'A relaxed session for couples to celebrate their story before the big day.',
    depositAmount: 150,
    order: 2,
  },
  {
    _type: 'service',
    eyebrow: 'Portraits',
    title: 'Portrait Session',
    description: 'Individual portraits that capture who you are - confident, honest, and full of life.',
    depositAmount: 100,
    order: 3,
  },
  {
    _type: 'service',
    eyebrow: 'Families',
    title: 'Family Session',
    description: 'Candid, warm images of the people who matter most. Perfect for any season.',
    depositAmount: 150,
    order: 4,
  },
  {
    _type: 'service',
    eyebrow: 'Maternity',
    title: 'Maternity Session',
    description: 'A gentle, beautiful celebration of this season before your little one arrives.',
    depositAmount: 100,
    order: 5,
  },
  {
    _type: 'service',
    eyebrow: 'Brands',
    title: 'Brand & Commercial',
    description: 'Polished imagery for entrepreneurs, creatives, and businesses ready to show up visually.',
    depositAmount: 200,
    order: 6,
  },
]

console.log('Seeding services...')

const transaction = client.transaction()
services.forEach((service) => transaction.create(service))
await transaction.commit()

console.log(`Done. Created ${services.length} service documents.`)
