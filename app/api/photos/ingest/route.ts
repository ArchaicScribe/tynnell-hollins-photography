import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import config from '@payload-config'
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'
// This function downloads a full-size DSLR file from R2, runs it through sharp
// (3 resizes), and uploads 4 versions back to R2. Allow plenty of time.
export const maxDuration = 120

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
}

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

async function streamToBuffer(stream: AsyncIterable<Uint8Array>): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function POST(request: Request) {
  // Only authenticated Payload users (admin) may trigger ingest
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let key: string
  let filename: string
  let category: string | null
  try {
    const body = await request.json()
    key = body?.key
    filename = body?.filename
    category = body?.category ?? null
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate key format: must be under the temp/ prefix we control
  if (!key || typeof key !== 'string' || !key.startsWith('temp/')) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }
  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: 'filename is required' }, { status: 400 })
  }

  const s3 = buildS3Client()
  const bucket = process.env.R2_BUCKET ?? 'tynnell-hollins-photos'

  // Download the temp file from R2 into memory.
  // This is internal function memory - NOT subject to Vercel's 4.5MB request body limit.
  let fileBuffer: Buffer
  try {
    const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    if (!Body) {
      return NextResponse.json({ error: 'Temp file not found in R2' }, { status: 404 })
    }
    fileBuffer = await streamToBuffer(Body as AsyncIterable<Uint8Array>)
    console.log(`[photos/ingest] downloaded ${filename}: ${fileBuffer.length} bytes`)
  } catch (err) {
    console.error('[photos/ingest] failed to download temp file from R2:', err)
    return NextResponse.json({ error: 'Failed to retrieve uploaded file' }, { status: 500 })
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mimetype = MIME_MAP[ext] ?? 'image/jpeg'

  // Hand the buffer to Payload, which handles sharp resizing and R2 storage
  let doc: unknown
  try {
    const data: Record<string, unknown> = {}
    if (category) data.category = category

    doc = await payload.create({
      collection: 'photos',
      data,
      file: {
        data: fileBuffer,
        mimetype,
        name: filename,
        size: fileBuffer.length,
      },
      overrideAccess: false,
      user,
    })

    console.log(`[photos/ingest] created photo for ${filename}`)
  } catch (err) {
    console.error('[photos/ingest] payload.create failed:', err)
    return NextResponse.json({ error: 'Failed to create photo record' }, { status: 500 })
  }

  // Clean up the temp R2 object - non-fatal; orphans are just wasted storage
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  } catch (err) {
    console.warn('[photos/ingest] temp file cleanup failed (non-fatal):', err)
  }

  return NextResponse.json(doc)
}
