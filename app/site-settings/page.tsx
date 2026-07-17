import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
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

  return (
    <SiteSettingsClient
      initial={{
        title: siteConfig.title ?? '',
        tagline: siteConfig.tagline ?? '',
        email: siteConfig.email ?? '',
        phone: siteConfig.phone ?? '',
        instagramUrl: siteConfig.instagramUrl ?? '',
        facebookUrl: siteConfig.facebookUrl ?? '',
        tiktokUrl: siteConfig.tiktokUrl ?? '',
        pinterestUrl: siteConfig.pinterestUrl ?? '',
      }}
    />
  )
}
