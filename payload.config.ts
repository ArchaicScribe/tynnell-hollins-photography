import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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
})
