import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CONTACT_EMAIL } from './constants'

// Server-only: reads the SiteConfig global (TYN-326) for the public site's
// business name, tagline, contact info, and social links - previously
// completely disconnected from the live site (every consuming page hardcoded
// its own copy of these values). Falls back to those same hardcoded values on
// any DB hiccup or before the global is ever saved, so a missing/broken
// SiteConfig doc never takes down the public site - mirrors the pattern
// already used for the Design global (app/lib/siteDesign.ts).
//
// EMAIL_FROM (the Resend "from" sender) and CONTACT_TO_EMAIL (the env var
// contact-form submissions are actually delivered to) deliberately do NOT
// read from this global - those are operational/deliverability config that
// must match a domain verified in Resend, not editable display text. Only
// CONTACT_EMAIL (the address shown to visitors) has a display counterpart
// here, via the `email` field.
export interface SiteConfigData {
  title: string
  tagline: string
  email: string
  phone: string
  instagramUrl: string
  facebookUrl: string
  tiktokUrl: string
  pinterestUrl: string
}

export const DEFAULT_SITE_CONFIG: SiteConfigData = {
  title: 'Tynnell Hollins Photography',
  tagline: 'Lost in the Moment, Found in Forever',
  email: CONTACT_EMAIL,
  phone: '',
  instagramUrl: 'https://instagram.com/tynnellhollinsphotography',
  facebookUrl: '',
  tiktokUrl: 'https://tiktok.com/@tynnellhollinsphotography',
  pinterestUrl: '',
}

// A few pages display "@handle" text alongside the Instagram link (not just
// the link itself) - derive it from the URL so it never goes stale if the
// URL changes but this text doesn't. Falls back to the raw URL if it can't
// be parsed as one (e.g. blank, or someone pastes just a handle).
export function instagramHandle(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/^\/|\/$/g, '')
    return path ? `@${path}` : url
  } catch {
    return url
  }
}

// Wrapped in React's cache() so multiple call sites within one request (e.g.
// a page's generateMetadata plus its own body) share one DB read.
export const getSiteConfig = cache(async (): Promise<SiteConfigData> => {
  try {
    const payload = await getPayload({ config })
    const doc = await payload.findGlobal({ slug: 'site-config' })
    return {
      title: doc.title || DEFAULT_SITE_CONFIG.title,
      tagline: doc.tagline || DEFAULT_SITE_CONFIG.tagline,
      email: doc.email || DEFAULT_SITE_CONFIG.email,
      phone: doc.phone || DEFAULT_SITE_CONFIG.phone,
      instagramUrl: doc.instagramUrl || DEFAULT_SITE_CONFIG.instagramUrl,
      facebookUrl: doc.facebookUrl || DEFAULT_SITE_CONFIG.facebookUrl,
      tiktokUrl: doc.tiktokUrl || DEFAULT_SITE_CONFIG.tiktokUrl,
      pinterestUrl: doc.pinterestUrl || DEFAULT_SITE_CONFIG.pinterestUrl,
    }
  } catch {
    return DEFAULT_SITE_CONFIG
  }
})
