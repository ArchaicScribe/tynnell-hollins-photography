import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import payloadConfig from '@payload-config'
import { NewCollectionClient } from './NewCollectionClient'

export const dynamic = 'force-dynamic'

// TYN-311: the full-page Create New Collection. Same sign-in gate as the
// gallery editor it leads to.
export default async function NewCollectionPage() {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  return <NewCollectionClient />
}
