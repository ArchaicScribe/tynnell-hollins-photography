import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import type { Photo } from '@/payload-types'
import { changesSinceSent, visibleFavorites } from '@/app/lib/favorites'
import { currentList, favoritesBody, noList, openFavoritesGallery } from '@/app/lib/favoritesRequest'
import { favoritesEmailHtml } from '@/app/lib/emails'
import { favoritesListSendRatelimit, favoritesSendRatelimit, getClientIp, safeLimit } from '@/app/lib/ratelimit'
import { escapeHtml } from '@/app/lib/validation'
import { fileNameForSearch } from '@/app/lib/photoFileName'
import { EMAIL_FROM, RATE_LIMIT_ERROR, SITE_URL } from '@/app/lib/constants'

const resend = new Resend(process.env.RESEND_API_KEY)

// The per-IP limit fails open (safeLimit), and one person can come from many
// addresses. This one is keyed on the list and fails closed, so a list can
// never be used to flood Tynnell's inbox, even with Redis down.
async function listMaySend(listId: number): Promise<boolean> {
  try {
    const { success } = await favoritesListSendRatelimit.limit(String(listId))
    return success
  } catch (err) {
    console.error('[favorites/send] list limit check failed, not sending:', err)
    return false
  }
}

// POST /api/favorites/send { gallery }: "Send to Tynnell" (TYN-13). Emails
// her the client's current favorites and records what was sent. The list
// stays editable, and a later send says what changed since this one.
export async function POST(req: NextRequest) {
  const { success } = await safeLimit(favoritesSendRatelimit, getClientIp(req))
  if (!success) return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 })

  let body: { gallery?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Depth 1: the email needs each photo's file name and thumbnail.
  const ctx = await openFavoritesGallery(body.gallery, 1)
  if (ctx instanceof NextResponse) return ctx
  const list = await currentList(ctx)
  if (!list) return noList()

  const photoIds = visibleFavorites(list.photoIds, ctx.galleryPhotoIds)
  if (photoIds.length === 0) {
    return NextResponse.json({ error: 'Choose at least one favorite first' }, { status: 400 })
  }

  const isUpdate = Boolean(list.sentAt)
  const changes = changesSinceSent(photoIds, list.sentPhotoIds)
  // The button is hidden when there is nothing new, but the route is public:
  // a replayed request must not email the same list again.
  if (isUpdate && changes.added.length === 0 && changes.removed.length === 0) {
    return NextResponse.json(favoritesBody(ctx, list))
  }
  if (!(await listMaySend(list.id))) {
    return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 429 })
  }

  const contactTo = process.env.CONTACT_TO_EMAIL
  if (!contactTo) {
    console.error('[favorites/send] CONTACT_TO_EMAIL env var is not set')
    return NextResponse.json({ error: 'Failed to send. Please try again.' }, { status: 500 })
  }

  const byId = new Map(ctx.photos.filter((p): p is Photo => typeof p === 'object').map(p => [p.id, p]))
  const fileName = (id: number) => {
    const photo = byId.get(id)
    return escapeHtml((photo && fileNameForSearch(photo)) ?? `Photo ${id}`)
  }
  const thumbUrl = (id: number) => {
    const p = byId.get(id)
    const url = p?.sizes?.thumbnail?.url ?? p?.sizes?.card?.url ?? p?.url
    return url ? escapeHtml(url) : null
  }

  const clientName = list.clientName || list.clientEmail

  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to: contactTo,
    replyTo: list.clientEmail,
    subject: `${isUpdate ? 'Favorites updated by' : 'Favorites from'} ${clientName}: ${ctx.gallery.title}`,
    html: favoritesEmailHtml({
      galleryTitle: escapeHtml(ctx.gallery.title),
      clientName: escapeHtml(clientName),
      clientEmail: escapeHtml(list.clientEmail),
      photos: photoIds.map(id => ({ filename: fileName(id), thumbUrl: thumbUrl(id) })),
      ...(isUpdate && {
        added: changes.added.map(fileName),
        // A removed photo that has also left the gallery has no name to show.
        removed: changes.removed.filter(id => byId.has(id)).map(fileName),
      }),
      editorUrl: `${SITE_URL}/gallery-editor/${ctx.gallery.id}?favorites=${list.id}`,
    }),
  })
  if (result.error) {
    console.error('[favorites/send] email send failed:', JSON.stringify(result.error))
    return NextResponse.json({ error: 'Failed to send. Please try again.' }, { status: 502 })
  }

  // Send first, record second: the list must never say "sent" when no email
  // went out. If recording fails the email still went, so report success.
  const sentAt = new Date().toISOString()
  try {
    const updated = await ctx.payload.update({
      collection: 'favorite-lists',
      id: list.id,
      data: { sentAt, sentPhotoIds: photoIds },
      depth: 0,
    })
    return NextResponse.json(favoritesBody(ctx, updated))
  } catch (err) {
    console.error('[favorites/send] email sent but failed to record it:', err)
    return NextResponse.json(favoritesBody(ctx, { ...list, sentAt, sentPhotoIds: photoIds }))
  }
}
