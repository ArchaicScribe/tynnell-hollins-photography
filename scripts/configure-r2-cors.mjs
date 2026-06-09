/**
 * One-time script: configure CORS on the R2 bucket so the browser can PUT
 * files directly to R2 using presigned upload URLs (required by TYN-199 fix).
 *
 * Run via 1Password (injects real credentials):
 *   op run --env-file=.env.local.template -- node scripts/configure-r2-cors.mjs
 *
 * Or inject credentials manually and run:
 *   $env:R2_ACCOUNT_ID     = "..."
 *   $env:R2_ACCESS_KEY_ID  = "..."
 *   $env:R2_SECRET_ACCESS_KEY = "..."
 *   $env:R2_BUCKET         = "tynnell-hollins-photos"
 *   node scripts/configure-r2-cors.mjs
 *
 * This only needs to be run once per bucket. You can verify the rule was
 * applied by checking Cloudflare R2 dashboard > bucket > Settings > CORS.
 */

import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3'

const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']
const missing = required.filter(k => !process.env[k])
if (missing.length) {
  console.error('Missing required env vars:', missing.join(', '))
  process.exit(1)
}

const s3 = new S3Client({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  region: 'auto',
  forcePathStyle: true,
})

const bucket = process.env.R2_BUCKET

// Allow browsers from any origin to PUT presigned upload URLs.
// Presigned URLs are self-authenticating (HMAC-signed, 10-minute expiry,
// UUID key) so open origins are acceptable here. Limiting to specific origins
// is not practical because Vercel preview deployments use unpredictable
// subdomains under *.vercel.app.
const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: ['*'],
      AllowedMethods: ['PUT'],
      AllowedHeaders: ['Content-Type'],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3600,
    },
  ],
}

console.log(`Applying CORS rule to bucket: ${bucket}`)
console.log(JSON.stringify(corsConfig, null, 2))

try {
  await s3.send(new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: corsConfig,
  }))
  console.log('\nCORS rule applied successfully.')

  // Verify by reading it back
  const { CORSRules } = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }))
  console.log('\nVerified CORS rules on bucket:')
  console.log(JSON.stringify(CORSRules, null, 2))
} catch (err) {
  console.error('Failed to apply CORS rule:', err)
  process.exit(1)
}
