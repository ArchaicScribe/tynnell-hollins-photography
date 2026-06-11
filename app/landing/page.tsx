import { getPayload } from 'payload'
import { Render } from '@measured/puck/rsc'
import type { Data } from '@measured/puck'
import payloadConfig from '@payload-config'
import { config as puckConfig } from '@/app/builder/puck.config'

// Public render of the Puck-built page (TYN-214 POC). Server-rendered from the
// saved `builder` global document, so "Publish" in /builder shows up here.
export const dynamic = 'force-dynamic'

const EMPTY: Data = { content: [], root: {} }

export default async function LandingPage() {
  const payload = await getPayload({ config: payloadConfig })
  const doc = await payload.findGlobal({ slug: 'builder' })
  const data = (doc?.data as Data | undefined) ?? EMPTY

  return <Render config={puckConfig} data={data} />
}
