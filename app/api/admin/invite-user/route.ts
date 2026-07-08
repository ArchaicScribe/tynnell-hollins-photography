import { NextResponse } from 'next/server'
import { getPayload, ValidationError } from 'payload'
import { headers } from 'next/headers'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'
import config from '@payload-config'
import { isValidEmail, escapeHtml } from '@/app/lib/validation'
import { adminInviteEmailHtml } from '@/app/lib/emails'
import { EMAIL_FROM } from '@/app/lib/constants'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateTempPassword(): string {
  // 12 random bytes -> 16-char base64url string. Readable enough to type from
  // an email, long enough to be a secure one-time credential.
  return randomBytes(12).toString('base64url')
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // payload.create below runs with the local API's default overrideAccess:
  // true, which bypasses the Users collection's own create access control -
  // so this route must enforce "inviter must be admin" itself.
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Only an admin can invite new users.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  // Default to the least-privileged role so a plain invite never silently
  // grants full admin access - the inviter must explicitly opt into 'admin'.
  const role = body.role === 'admin' ? 'admin' : 'editor'

  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 })
  }

  const tempPassword = generateTempPassword()

  try {
    await payload.create({
      collection: 'users',
      data: {
        name,
        email,
        role,
        password: tempPassword,
        mustChangePassword: true,
      },
    })
  } catch (err) {
    // Two concurrent invites for the same email can both pass the
    // existence check above (TOCTOU) - the unique constraint on email
    // catches it here instead, surfacing as a ValidationError. Treat that
    // the same as the upfront duplicate check rather than a generic retry.
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 })
    }
    payload.logger.error({ msg: 'Failed to create invited user', err })
    return NextResponse.json({ error: 'Failed to create the user. Please try again.' }, { status: 500 })
  }

  const loginUrl = `${process.env.APP_URL ?? 'https://tynnellhollinsphotography.com'}/admin/login`

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your Tynnell Hollins Photography dashboard invite',
      html: adminInviteEmailHtml({
        name: escapeHtml(name),
        email: escapeHtml(email),
        tempPassword,
        loginUrl,
      }),
    })
  } catch (err) {
    payload.logger.error({ msg: 'Invited user created but invite email failed to send', err })
    return NextResponse.json(
      { error: 'User created, but the invite email failed to send. Share the login manually.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ success: true })
}
