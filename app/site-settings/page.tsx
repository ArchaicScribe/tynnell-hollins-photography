import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DEFAULT_SITE_CONFIG } from '@/app/lib/siteConfig'
import { SiteSettingsClient } from './SiteSettingsClient'

// Site Settings rebuild (TYN-313), modeled on Pixieset's Settings > Branding
// page - admin only, matching SiteConfig's existing isAdmin access restriction.
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings' }

export default async function SiteSettingsPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')
  if (user.role !== 'admin') redirect('/studio')

  const siteConfig = await payload.findGlobal({ slug: 'site-config' })
  const galleryPresets = await payload.findGlobal({ slug: 'gallery-presets' })
  const emailTemplates = await payload.findGlobal({ slug: 'email-templates' })

  return (
    <SiteSettingsClient
      initial={{
        title: siteConfig.title ?? '',
        tagline: siteConfig.tagline ?? '',
        email: siteConfig.email ?? '',
        phone: siteConfig.phone ?? '',
        // The same rule as getSiteConfig: a value that was never saved shows (and the
        // site uses) the default, a saved blank stays blank. Without it the box showed
        // empty while the site showed the default, and saving once would have hidden it.
        instagramUrl: siteConfig.instagramUrl ?? DEFAULT_SITE_CONFIG.instagramUrl,
        facebookUrl: siteConfig.facebookUrl ?? DEFAULT_SITE_CONFIG.facebookUrl,
        tiktokUrl: siteConfig.tiktokUrl ?? DEFAULT_SITE_CONFIG.tiktokUrl,
        pinterestUrl: siteConfig.pinterestUrl ?? DEFAULT_SITE_CONFIG.pinterestUrl,
        footerBio: siteConfig.footerBio ?? DEFAULT_SITE_CONFIG.footerBio,
        footerLocation: siteConfig.footerLocation ?? DEFAULT_SITE_CONFIG.footerLocation,
        freebieTitle: siteConfig.freebieTitle ?? '',
        freebieUrl: siteConfig.freebieUrl ?? '',
        // Raw saved values (not cleaned), so Tynnell sees and can fix
        // exactly what is stored. The save route cleans them.
        menuCards: (siteConfig.menuCards ?? []).map((c) => ({
          title: c.title ?? '',
          linkLabel: c.linkLabel ?? '',
          href: c.href ?? '',
          imageUrl: c.imageUrl ?? '',
        })),
      }}
      initialPresets={{
        defaultCategory: galleryPresets.defaultCategory ?? '',
        defaultStatus: galleryPresets.defaultStatus ?? 'draft',
        defaultTapedStyle: galleryPresets.defaultTapedStyle ?? false,
        defaultFeatured: galleryPresets.defaultFeatured ?? false,
        defaultAllowDownload: galleryPresets.defaultAllowDownload ?? false,
      }}
      initialEmailTemplates={{
        shareSubject: emailTemplates.shareSubject ?? '',
        shareHeading: emailTemplates.shareHeading ?? '',
        shareBody: emailTemplates.shareBody ?? '',
        shareButtonLabel: emailTemplates.shareButtonLabel ?? '',
        reminderSubject: emailTemplates.reminderSubject ?? '',
        reminderHeading: emailTemplates.reminderHeading ?? '',
        reminderBody: emailTemplates.reminderBody ?? '',
        reminderButtonLabel: emailTemplates.reminderButtonLabel ?? '',
        reminderDaysBefore: String(emailTemplates.reminderDaysBefore ?? 3),
      }}
    />
  )
}
