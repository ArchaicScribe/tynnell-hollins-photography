import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { Resend } from 'resend'
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
import { BookingSettings } from './globals/BookingSettings'
import { Availability } from './globals/Availability'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const FROM_NAME = 'Tynnell Hollins Photography'
const FROM_ADDRESS = process.env.CONTACT_TO_EMAIL ?? 'Hello@TynnellHollinsPhotography.com'

export default buildConfig({
  email: ({ payload }) => {
    const resend = new Resend(process.env.RESEND_API_KEY)
    return {
      name: 'resend',
      defaultFromName: FROM_NAME,
      defaultFromAddress: FROM_ADDRESS,
      sendEmail: async (message) => {
        type Addr = string | { name?: string; address?: string }
        const rawTo = message.to as Addr | Addr[]
        const to: string | string[] = Array.isArray(rawTo)
          ? (rawTo as Addr[]).map((t) => (typeof t === 'string' ? t : (t.address ?? ''))).filter(Boolean)
          : typeof rawTo === 'string'
          ? rawTo
          : (rawTo as { address?: string })?.address ?? ''

        const rawFrom = message.from as Addr | undefined
        const fromStr =
          !rawFrom
            ? `${FROM_NAME} <${FROM_ADDRESS}>`
            : typeof rawFrom === 'string'
            ? rawFrom
            : rawFrom.address
            ? `${rawFrom.name ?? FROM_NAME} <${rawFrom.address}>`
            : `${FROM_NAME} <${FROM_ADDRESS}>`

        try {
          await resend.emails.send({
            from: fromStr,
            to,
            subject: message.subject ?? '(no subject)',
            html: (message.html as string) ?? (message.text as string) ?? '',
          })
        } catch (err) {
          payload.logger.error({ msg: 'Resend email send failed', err })
        }
      },
    }
  },
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    theme: 'dark',
    suppressHydrationWarning: true,
    components: {
      graphics: {
        Logo: './components/admin/AdminLogo#AdminLogo',
      },
      views: {
        dashboard: {
          Component: './components/admin/Dashboard#Dashboard',
        },
      },
    },
  },
  sharp,
  collections: [Users, Photos, Galleries, Testimonials, Services, Posts],
  globals: [HeroSlides, AboutPage, SiteConfig, BookingSettings, Availability],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      ssl: { rejectUnauthorized: false },
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
