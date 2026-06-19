import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import config from '@payload-config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const dynamic = 'force-dynamic'

// MIME types accepted for presigned upload.
// HEIC/HEIF are excluded: sharp on Vercel does not support them without
// native libheif, so the ingest step would crash with a 500. Tynnell
// should export/convert iPhone photos to JPEG before uploading.
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

// Extensions that map to unsupported formats, for a clear rejection message
const UNSUPPORTED_EXTENSIONS = new Set(['heic', 'heif', 'avif', 'tiff', 'tif', 'bmp'])

function buildS3Client(): S3Client {
  return new S3Client({
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
    region: 'auto',
    forcePathStyle: true,
  })
}

export async function POST(request: Request) {
  // Only authenticated Payload users (admin) may request presigned URLs
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let filename: string
  let contentType: string
  try {
    const body = await request.json()
    filename = body?.filename
    contentType = body?.contentType
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: 'filename is required' }, { status: 400 })
  }

  // Check extension first so we can give a helpful message for HEIC files
  const ext = (filename.split('.').pop() ?? '').toLowerCase()
  if (UNSUPPORTED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: `${ext.toUpperCase()} files are not supported. Please export as JPEG or PNG before uploading.` },
      { status: 415 }
    )
  }

  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: `File type "${contentType}" is not supported. Please upload JPEG, PNG, WebP, or GIF files.` },
      { status: 415 }
    )
  }

  // Use a temp/ prefix with a UUID so the key is unguessable and easy to clean up
  const key = `temp/${crypto.randomUUID()}-${Date.now()}.${ext || 'jpg'}`

  if (!process.env.R2_ACCOUNT_ID) {
    console.error('[upload-presign] R2_ACCOUNT_ID is not set')
    return NextResponse.json({ error: 'Storage is not configured' }, { status: 503 })
  }

  try {
    const s3 = buildS3Client()
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET ?? 'tynnell-hollins-photos',
      Key: key,
      ContentType: contentType,
    })
    // 10-minute window: enough for a slow connection uploading a large RAW/JPEG
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 })
    return NextResponse.json({ uploadUrl, key })
  } catch (err) {
    console.error('[upload-presign] failed to generate presigned URL:', err)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
