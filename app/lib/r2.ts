import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Shared Cloudflare R2 access for routes that manage files directly (the
// photo pipeline keeps its own copies). Server only: it reads the R2 keys.

const DEFAULT_PUBLIC_URL = 'https://pub-db2dd9a6665142e4adcd4f822fbe2683.r2.dev'

// The exact shape of a key made by /api/freebie-pdf/presign:
// files/<uuid>-<lower-case-dashed-name>.pdf
const FREEBIE_KEY = /^files\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[a-z0-9-]+\.pdf$/

export function r2Client(): S3Client {
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

export function r2Bucket(): string {
  return process.env.R2_BUCKET ?? 'tynnell-hollins-photos'
}

/** The public address files are served from, with no trailing slash. */
export function r2PublicBase(): string {
  return (process.env.R2_PUBLIC_URL || DEFAULT_PUBLIC_URL).replace(/\/+$/, '')
}

/**
 * The storage key behind a freebie guide link, but only when the link is one
 * of our own Site Settings uploads. Anything else (a guide hosted elsewhere, a
 * site page, a photo in the same bucket) gives null, so it is never deleted.
 */
export function uploadedFreebieKey(url: string): string | null {
  const prefix = `${r2PublicBase()}/`
  if (!url.startsWith(prefix)) return null
  const key = url.slice(prefix.length)
  return FREEBIE_KEY.test(key) ? key : null
}

export async function deleteR2Object(key: string): Promise<void> {
  await r2Client().send(new DeleteObjectCommand({ Bucket: r2Bucket(), Key: key }))
}
