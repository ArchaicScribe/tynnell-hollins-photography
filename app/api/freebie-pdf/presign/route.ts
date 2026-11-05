import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requireAdminUser } from '@/app/lib/builderAuth'
import { MAX_FREEBIE_PDF_BYTES, isPdfFileName } from '@/app/lib/freebiePdf'

// Step 1 of uploading the freebie guide from Site Settings: sign a direct
// browser-to-R2 PUT for one PDF and say where it will be served. The browser
// then sends the file itself, so a large PDF never passes through a Vercel
// function. Admin only, like the rest of Site Settings.
//
// The signature covers the content type and the exact byte count, so the
// signed link cannot be reused to store a different kind of file or a bigger
// one. Files go under files/, not temp/, because nothing moves them later:
// the link returned here is the one emailed to subscribers.
export const dynamic = 'force-dynamic'

const DEFAULT_PUBLIC_URL = 'https://pub-db2dd9a6665142e4adcd4f822fbe2683.r2.dev'

function slugFromFileName(name: string): string {
  const base = name.replace(/^.*[\\/]/, '').replace(/\.pdf$/i, '')
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
  return slug || 'guide'
}

export async function POST(request: Request) {
  const auth = await requireAdminUser()
  if (auth instanceof NextResponse) return auth

  let body: { filename?: unknown; size?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { filename, size } = body
  if (typeof filename !== 'string' || !filename.trim()) {
    return NextResponse.json({ error: 'filename is required' }, { status: 400 })
  }
  if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0) {
    return NextResponse.json({ error: 'size is required' }, { status: 400 })
  }
  if (!isPdfFileName(filename)) {
    return NextResponse.json({ error: 'Only PDF files can be uploaded here.' }, { status: 415 })
  }
  if (size > MAX_FREEBIE_PDF_BYTES) {
    return NextResponse.json({ error: 'That PDF is too large. The limit is 25 MB.' }, { status: 413 })
  }

  if (!process.env.R2_ACCOUNT_ID) {
    console.error('[freebie-pdf/presign] R2_ACCOUNT_ID is not set')
    return NextResponse.json({ error: 'Storage is not configured' }, { status: 503 })
  }

  const key = `files/${crypto.randomUUID()}-${slugFromFileName(filename)}.pdf`
  const publicBase = (process.env.R2_PUBLIC_URL || DEFAULT_PUBLIC_URL).replace(/\/+$/, '')

  try {
    const s3 = new S3Client({
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
      region: 'auto',
      forcePathStyle: true,
    })
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET ?? 'tynnell-hollins-photos',
      Key: key,
      ContentType: 'application/pdf',
      ContentLength: size,
    })
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 })
    return NextResponse.json({ uploadUrl, url: `${publicBase}/${key}` })
  } catch (err) {
    console.error('[freebie-pdf/presign] failed to generate presigned URL:', err)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
