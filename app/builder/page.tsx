import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import payloadConfig from '@payload-config'
import type { Data } from '@measured/puck'
import { Editor } from './Editor'

// Visual builder editor route (TYN-214 POC). Authenticated: only logged-in
// Payload users may open the builder. Loads the saved Puck document from the
// `builder` global and hands it to the client editor.
export const dynamic = 'force-dynamic'

const EMPTY: Partial<Data> = { content: [], root: {} }

export default async function BuilderPage() {
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  const doc = await payload.findGlobal({ slug: 'builder' })
  const data = (doc?.data as Data | undefined) ?? EMPTY

  return <Editor initialData={data} />
}
