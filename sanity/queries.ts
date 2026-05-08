import { groq } from 'next-sanity'

// ── Hero ──────────────────────────────────────────────────────
export const heroSlidesQuery = groq`
  *[_type == "heroSlide"] | order(order asc) {
    _id, image, alt, tagline, order
  }
`

// ── Portfolio ─────────────────────────────────────────────────
export const featuredPhotosQuery = groq`
  *[_type == "photo" && featured == true] | order(order asc) [0...6] {
    _id, title, alt, image, category
  }
`

export const allPhotosQuery = groq`
  *[_type == "photo"] | order(order asc) {
    _id, title, alt, image, category, featured, order
  }
`

export const galleriesQuery = groq`
  *[_type == "gallery"] | order(title asc) {
    _id, title, slug, category, featured,
    coverImage->{ _id, image, alt },
    "photoCount": count(photos)
  }
`

export const galleryBySlugQuery = groq`
  *[_type == "gallery" && slug.current == $slug][0] {
    _id, title, slug, category,
    coverImage->{ _id, image, alt },
    photos[]{ _key, image, alt, caption }
  }
`

export const allGallerySlugsQuery = groq`
  *[_type == "gallery" && defined(slug.current)] {
    "slug": slug.current
  }
`

// ── Testimonials ──────────────────────────────────────────────
export const testimonialsQuery = groq`
  *[_type == "testimonial"] | order(order asc) {
    _id, clientName, quote, sessionType, order
  }
`

// ── About ─────────────────────────────────────────────────────
export const aboutPageQuery = groq`
  *[_type == "aboutPage"][0] {
    headshot, headshotAlt, tagline, bio, previewBio, values
  }
`

// ── Services ──────────────────────────────────────────────────
export const servicesQuery = groq`
  *[_type == "service"] | order(order asc) {
    _id, eyebrow, title, description, features, price, depositAmount, order
  }
`

// ── Blog ──────────────────────────────────────────────────────
export const postsQuery = groq`
  *[_type == "post"] | order(publishedAt desc) {
    _id, title, slug, publishedAt, excerpt,
    coverImage->{ _id, image, alt }
  }
`

export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id, title, slug, publishedAt, excerpt, body,
    coverImage->{ _id, image, alt }
  }
`

// ── Site settings ─────────────────────────────────────────────
export const siteConfigQuery = groq`
  *[_type == "siteConfig"][0] {
    title, tagline, email, phone,
    instagramUrl, facebookUrl, tiktokUrl, pinterestUrl
  }
`
