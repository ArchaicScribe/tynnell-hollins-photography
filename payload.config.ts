import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Photos } from './collections/Photos'
import { Galleries } from './collections/Galleries'
import { Testimonials } from './collections/Testimonials'
import { Services } from './collections/Services'
import { Posts } from './collections/Posts'
import { HeroSlides } from './globals/HeroSlides'
import { AboutPage } from './globals/AboutPage'
import { SiteConfig } from './globals/SiteConfig'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    theme: 'dark',
  },
  sharp,
  collections: [Users, Photos, Galleries, Testimonials, Services, Posts],
  globals: [HeroSlides, AboutPage, SiteConfig],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  plugins: [
    s3Storage({
      collections: {
        photos: {
          generateFileURL: ({ filename }) => {
            const base = process.env.R2_PUBLIC_URL ?? 'https://pub-db2dd9a6665142e4adcd4f822fbe2683.r2.dev'
            return `${base}/${filename}`
          },
        },
      },
      bucket: process.env.R2_BUCKET ?? 'tynnell-hollins-photos',
      config: {
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
        },
        region: 'auto',
        forcePathStyle: true,
      },
    }),
  ],
})
