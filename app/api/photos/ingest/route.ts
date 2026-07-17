import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import config from '@payload-config'
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { applyWatermarkIfEnabled } from '@/app/lib/watermark'
import type { Photo } from '@/payload-types'

export const dynamic = 'force-dynamic'
// This function downloads a full-size DSLR file from R2, runs it through sharp
// (3 resizes), and uploads 4 versions back to R2. Allow the maximum time we can.
// Vercel Hobby caps at 60s; Pro allows up to 300s.
export const maxDuration = 60

// MIME types that sharp can actually process on Vercel (no native HEIC/HEIF support)
const SUPPORTED_MIME_MAP: Record<string, string> = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  gif:  'image/gif',
}

// Extensions that would require native libheif - reject with a clear message
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

async function streamToBuffer(stream: AsyncIterable<Uint8Array>): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function POST(request: Request) {
  const requestStart = Date.now()

  try {
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

    // Reject unsupported formats before we even hit R2 -- much better than
    // downloading the file and then having sharp crash on it.
    const ext = (filename.split('.').pop() ?? '').toLowerCase()
    if (UNSUPPORTED_EXTENSIONS.has(ext)) {
      console.warn(`[photos/ingest] rejected unsupported format: ${filename} (${ext})`)
      return NextResponse.json(
        { error: `${ext.toUpperCase()} files cannot be processed. Please export as JPEG or PNG before uploading.` },
        { status: 415 }
      )
    }

    const mimetype = SUPPORTED_MIME_MAP[ext] ?? 'image/jpeg'
    console.log(`[photos/ingest] starting: ${filename} (${mimetype})`)

    const s3 = buildS3Client()
    const bucket = process.env.R2_BUCKET ?? 'tynnell-hollins-photos'

    // Download the temp file from R2 into memory.
    // This is internal function memory - NOT subject to Vercel's 4.5 MB request body limit.
    let fileBuffer: Buffer
    try {
      const downloadStart = Date.now()
      const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      if (!Body) {
        console.error(`[photos/ingest] R2 returned empty body for key: ${key}`)
        return NextResponse.json({ error: 'Temp file not found in R2' }, { status: 404 })
      }
      fileBuffer = await streamToBuffer(Body as AsyncIterable<Uint8Array>)
      console.log(`[photos/ingest] downloaded ${filename}: ${fileBuffer.length} bytes in ${Date.now() - downloadStart}ms`)
    } catch (err) {
      console.error('[photos/ingest] failed to download temp file from R2:', err)
      return NextResponse.json({ error: 'Failed to retrieve uploaded file' }, { status: 500 })
    }

    // Sanity check: reject files over 200 MB (protects against memory exhaustion)
    const MAX_BYTES = 200 * 1024 * 1024
    if (fileBuffer.length > MAX_BYTES) {
      console.warn(`[photos/ingest] file too large: ${fileBuffer.length} bytes (${filename})`)
      return NextResponse.json(
        { error: `File is too large (${Math.round(fileBuffer.length / 1024 / 1024)} MB). Maximum size is 200 MB.` },
        { status: 413 }
      )
    }

    // Hand the buffer to Payload, which handles sharp resizing and R2 storage
    let doc: unknown
    try {
      const data: Record<string, unknown> = {}
      if (category) data.category = category

      console.log(`[photos/ingest] calling payload.create for ${filename}...`)
      const createStart = Date.now()

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

      console.log(`[photos/ingest] payload.create done for ${filename} in ${Date.now() - createStart}ms (total: ${Date.now() - requestStart}ms)`)

      // Watermark the preview sizes if enabled (TYN-322) - best-effort,
      // never fails the upload. The full original stays untouched.
      try {
        const watermarkStart = Date.now()
        await applyWatermarkIfEnabled({ s3, bucket, sizes: (doc as Photo).sizes })
        console.log(`[photos/ingest] watermark step for ${filename} took ${Date.now() - watermarkStart}ms`)
      } catch (err) {
        console.warn(`[photos/ingest] watermark step failed for ${filename} (non-fatal):`, err)
      }
    } catch (err) {
      console.error(`[photos/ingest] payload.create failed for ${filename}:`, err)
      // Distinguish sharp format errors from other failures so we can surface them clearly
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('unsupported image format') || message.includes('Input file is missing') || message.includes('heic') || message.includes('heif')) {
        return NextResponse.json(
          { error: `${filename} could not be processed. Please convert to JPEG or PNG and try again.` },
          { status: 415 }
        )
      }
      return NextResponse.json({ error: 'Failed to create photo record' }, { status: 500 })
    }

    // Clean up the temp R2 object - non-fatal; orphans are just wasted storage
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    } catch (err) {
      console.warn('[photos/ingest] temp file cleanup failed (non-fatal):', err)
    }

    return NextResponse.json(doc)
  } catch (err) {
    // Catch-all: log the full error so it appears in Vercel runtime logs
    console.error('[photos/ingest] unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
