import { NextResponse } from 'next/server'
import { draftMode } from 'next/headers'

// Disables the Draft Mode enabled by /api/builder-preview (TYN-343).
export async function GET(request: Request) {
  const dm = await draftMode()
  dm.disable()
  return NextResponse.redirect(new URL('/', request.url))
}
