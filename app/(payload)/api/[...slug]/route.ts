import { REST_DELETE, REST_GET, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'
import config from '@payload-config'

// Allow up to 60s for photo uploads: sharp decodes + 3 resizes + 4 R2 PUTs
// for a full-res DSLR JPEG can easily take 10-20s per file.
export const maxDuration = 60

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
