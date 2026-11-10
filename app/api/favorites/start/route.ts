import { NextRequest, NextResponse } from 'next/server'
import type { FavoriteList } from '@/payload-types'
import { normalizeEmail } from '@/app/lib/favorites'
import { favoritesBody, openFavoritesGallery, rememberList, type FavoritesContext } from '@/app/lib/favoritesRequest'
import { favoritesStartRatelimit, getClientIp, safeLimit } from '@/app/lib/ratelimit'
import { isValidEmail } from '@/app/lib/validation'
import { RATE_LIMIT_ERROR } from '@/app/lib/constants'

const MAX_NAME = 100

async function findList(ctx: FavoritesContext, email: string): Promise<FavoriteList | undefined> {
  const { docs } = await ctx.payload.find({
    collection: 'favorite-lists',
    where: { and: [{ gallery: { equals: ctx.gallery.id } }, { clientEmail: { equals: email } }] },
    depth: 0,
    limit: 1,
  })
  return docs[0]
}

// POST /api/favorites/start { gallery, name, email }: start a favorites list
// (TYN-13), or pick an existing one back up by email. There is deliberately
// no email confirmation: anyone who can open the gallery and knows a client's
// email can open that client's list. The gallery's own password is the gate.
export async function POST(req: NextRequest) {
  const { success } = await safeLimit(favoritesStartRatelimit, getClientIp(req))
  if (!success) return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 })

  let body: { gallery?: unknown; name?: unknown; email?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Control characters are dropped because the name goes into an email subject.
  const name = typeof body.name === 'string' ? body.name.replace(/[\u0000-\u001f\u007f]/g, ' ').trim() : ''
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  if (!name || name.length > MAX_NAME) {
    return NextResponse.json({ error: 'Please enter your name' }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
  }

  const ctx = await openFavoritesGallery(body.gallery)
  if (ctx instanceof NextResponse) return ctx

  let list = await findList(ctx, email)
  if (!list) {
    try {
      list = await ctx.payload.create({
        collection: 'favorite-lists',
        data: { gallery: ctx.gallery.id, clientName: name, clientEmail: email, photoIds: [] },
        depth: 0,
      })
    } catch (err) {
      // Two tabs starting at once: the database allows one list per gallery
      // and email, so the loser of that race uses the winner's list.
      list = await findList(ctx, email)
      if (!list) {
        console.error('[favorites/start] could not create list:', err)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
      }
    }
  }

  return rememberList(NextResponse.json(favoritesBody(ctx, list)), ctx.slug, list.id)
}
