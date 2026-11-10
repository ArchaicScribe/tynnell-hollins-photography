import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, r2Bucket } from './r2'

// TYN-11: a client's download allowance only means something if the
// full-resolution file can be reached through the download route alone.
// Every upload keeps its untouched original in a private R2 bucket and hands
// Payload a display-size copy, which Payload then publishes as the photo's
// "original" and resizes into thumbnail/card/hero. 2560px matches the largest
// of those sizes, so nothing on the site loses quality.

export type UploadedFile = { data: Buffer; mimetype: string; name: string; size: number }

export type OriginalsStore = {
  put(key: string, body: Buffer, contentType: string): Promise<void>
  get(key: string): Promise<{ body: ReadableStream<Uint8Array>; contentType: string }>
  delete(key: string): Promise<void>
}

export const DISPLAY_MAX_EDGE = 2560

// Formats sharp can re-encode without losing anything the site relies on.
// Anything else (an animated GIF, say) is published as uploaded.
const SHRINKABLE = new Set(['jpeg', 'png', 'webp'])

async function displayCopy(file: UploadedFile): Promise<UploadedFile> {
  const { width = 0, height = 0, format } = await sharp(file.data).metadata()
  if (!format || !SHRINKABLE.has(format) || Math.max(width, height) <= DISPLAY_MAX_EDGE) return file

  // rotate() applies the EXIF orientation first, so a phone photo is not
  // turned sideways once its metadata is dropped.
  const data = await sharp(file.data)
    .rotate()
    .resize({ width: DISPLAY_MAX_EDGE, height: DISPLAY_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .toFormat(format, format === 'jpeg' ? { quality: 92 } : {})
    .toBuffer()
  return { ...file, data, size: data.length }
}

export async function keepPrivateOriginal(
  file: UploadedFile,
  store: OriginalsStore,
): Promise<{ file: UploadedFile; originalKey: string }> {
  const originalKey = `${randomUUID()}/${file.name}`
  try {
    await store.put(originalKey, file.data, file.mimetype)
  } catch (err) {
    throw new Error(`Could not store the full-resolution original of "${file.name}", so the upload was stopped: ${(err as Error).message}`)
  }
  return { file: await displayCopy(file), originalKey }
}

/**
 * The private bucket that holds full-resolution originals. It must never be
 * the public photo bucket: falling back to it would publish every original,
 * so a missing or wrong setting stops the upload instead.
 */
export function r2OriginalsStore(): OriginalsStore {
  const bucket = process.env.R2_ORIGINALS_BUCKET
  if (!bucket) throw new Error('R2_ORIGINALS_BUCKET is not set, so full-resolution originals have nowhere private to go.')
  if (bucket === r2Bucket()) throw new Error('R2_ORIGINALS_BUCKET is the public photo bucket. Originals must go to a separate, private bucket.')
  const s3 = r2Client()

  return {
    async put(key, body, contentType) {
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }))
    },
    async get(key) {
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      if (!res.Body) throw new Error(`Original "${key}" is empty`)
      return { body: res.Body.transformToWebStream(), contentType: res.ContentType ?? 'application/octet-stream' }
    },
    async delete(key) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    },
  }
}
