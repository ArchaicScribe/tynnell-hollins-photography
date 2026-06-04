import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

const BASE_URL = 'https://tynnellhollinsphotography.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Dynamic gallery pages
  const { docs: galleries } = await payload.find({
    collection: 'galleries',
    depth: 0,
    limit: 1000,
  })

  const galleryPages: MetadataRoute.Sitemap = galleries
    .filter((g): g is typeof g & { slug: string } => typeof g.slug === 'string' && g.slug.length > 0)
    .map(g => ({
      url: `${BASE_URL}/portfolio/${g.slug}`,
      lastModified: new Date(g.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

  // Published blog posts only
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    depth: 0,
    limit: 1000,
  })

  const postPages: MetadataRoute.Sitemap = posts
    .filter((p): p is typeof p & { slug: string } => typeof p.slug === 'string' && p.slug.length > 0)
    .map(p => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  return [...staticPages, ...galleryPages, ...postPages]
}
