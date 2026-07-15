import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSiteDesign } from '@/app/lib/siteDesign'
import { DesignClient } from './DesignClient'

// Site-wide theme editor (TYN-314), modeled on Pixieset's Design page - admin
// only, matching Site Config/Booking Settings/Availability's existing
// isAdmin restriction (branding changes affect the whole public site).
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Design' }

export default async function DesignPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')
  if (user.role !== 'admin') redirect('/studio')

  const theme = await getSiteDesign()

  return <DesignClient initialTheme={theme} />
}
