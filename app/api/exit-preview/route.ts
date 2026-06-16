import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

// Turn off draft-mode preview (TYN-231) and return to the homepage.
export const dynamic = 'force-dynamic'

export async function GET() {
  const draft = await draftMode()
  draft.disable()
  redirect('/')
}
