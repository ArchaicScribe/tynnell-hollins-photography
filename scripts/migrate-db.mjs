/**
 * migrate-db.mjs
 *
 * Lightweight migration runner used as a Vercel pre-build step.
 * Runs pending schema changes directly via pg so we don't need the Payload
 * CLI (which fails on Node v24 due to tsx ESM + extensionless-import issues).
 *
 * Usage:  node scripts/migrate-db.mjs
 * Env:    DATABASE_URI  (standard Neon/postgres connection string)
 */

import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URI
if (!connectionString) {
  console.error('ERROR: DATABASE_URI is not set.')
  process.exit(1)
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: true } })

async function run() {
  const client = await pool.connect()
  try {
    // ------------------------------------------------------------------
    // Migration 20260518_100000: add galleries_photos array table
    // Required by TYN-139: Gallery.photos changed from hasMany relationship
    // to array type, which Payload postgres adapter stores in a dedicated
    // junction table.
    // ------------------------------------------------------------------

    await client.query(`
      CREATE TABLE IF NOT EXISTS "galleries_photos" (
        "id"         serial  PRIMARY KEY NOT NULL,
        "_order"     integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "photo_id"   integer
      )
    `)

    // FK: _parent_id → galleries.id (cascade delete)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "galleries_photos"
          ADD CONSTRAINT "galleries_photos_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "galleries"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `)

    // FK: photo_id → photos.id (set null on delete)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "galleries_photos"
          ADD CONSTRAINT "galleries_photos_photo_id_fk"
          FOREIGN KEY ("photo_id")
          REFERENCES "photos"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS "galleries_photos_order_idx"
        ON "galleries_photos" USING btree ("_order")
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "galleries_photos_parent_id_idx"
        ON "galleries_photos" USING btree ("_parent_id")
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "galleries_photos_photo_idx"
        ON "galleries_photos" USING btree ("photo_id")
    `)

    console.log('✓ galleries_photos table ready')

    // ------------------------------------------------------------------
    // Migration 20260605_120000: add booking_settings global table
    // Required by TYN-92: Booking Settings global for configurable
    // lead time and booking window.
    // ------------------------------------------------------------------

    await client.query(`
      CREATE TABLE IF NOT EXISTS "booking_settings" (
        "id"                   serial  PRIMARY KEY NOT NULL,
        "min_lead_time_hours"  numeric DEFAULT 48,
        "max_booking_months"   numeric DEFAULT 24,
        "updated_at"           timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at"           timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)

    console.log('✓ booking_settings table ready')

    // ------------------------------------------------------------------
    // Migration 20260605_120001: add availability global tables
    // Required by TYN-102: OOO / blocked availability date ranges global.
    // ------------------------------------------------------------------

    await client.query(`
      CREATE TABLE IF NOT EXISTS "availability" (
        "id"          serial  PRIMARY KEY NOT NULL,
        "updated_at"  timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at"  timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "availability_blocked_ranges" (
        "id"                   serial  PRIMARY KEY NOT NULL,
        "_order"               integer NOT NULL,
        "_parent_id"           integer NOT NULL,
        "internal_label"       varchar,
        "start_date"           timestamp(3) with time zone,
        "end_date"             timestamp(3) with time zone,
        "apply_return_buffer"  boolean DEFAULT true,
        "return_buffer_days"   numeric DEFAULT 2,
        "customer_message"     varchar
      )
    `)

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "availability_blocked_ranges"
          ADD CONSTRAINT "availability_blocked_ranges_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "availability"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS "availability_blocked_ranges_order_idx"
        ON "availability_blocked_ranges" USING btree ("_order")
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "availability_blocked_ranges_parent_id_idx"
        ON "availability_blocked_ranges" USING btree ("_parent_id")
    `)

    // ------------------------------------------------------------------
    // Migration 20260605_200000: add notification_sent column to
    // availability_blocked_ranges for TYN-110 return notification cron.
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "availability_blocked_ranges"
        ADD COLUMN IF NOT EXISTS "notification_sent" boolean DEFAULT false
    `)

    console.log('✓ availability tables ready')

    // ------------------------------------------------------------------
    // Migration 20260608_100000: add galleries_rels table
    // Required by reverting TYN-139: Gallery.photos changed back from
    // array type to hasMany relationship so the admin shows a multi-select
    // search picker instead of one-at-a-time row additions.
    // Payload postgres adapter stores hasMany relationships in a _rels table.
    // ------------------------------------------------------------------

    await client.query(`
      CREATE TABLE IF NOT EXISTS "galleries_rels" (
        "id"        serial  PRIMARY KEY NOT NULL,
        "order"     integer,
        "parent_id" integer NOT NULL,
        "path"      varchar NOT NULL,
        "photos_id" integer
      )
    `)

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "galleries_rels"
          ADD CONSTRAINT "galleries_rels_parent_id_fk"
          FOREIGN KEY ("parent_id")
          REFERENCES "galleries"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `)

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "galleries_rels"
          ADD CONSTRAINT "galleries_rels_photos_id_fk"
          FOREIGN KEY ("photos_id")
          REFERENCES "photos"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS "galleries_rels_order_idx"
        ON "galleries_rels" USING btree ("order")
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "galleries_rels_parent_id_idx"
        ON "galleries_rels" USING btree ("parent_id")
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "galleries_rels_photos_id_idx"
        ON "galleries_rels" USING btree ("photos_id")
    `)

    console.log('✓ galleries_rels table ready')

    // ------------------------------------------------------------------
    // Migration 20260608_200000: seed galleries_photos from galleries_rels
    // Required by TYN-193: Gallery.photos switched back to array type so
    // Payload's built-in drag handles work for reordering. galleries_photos
    // already has the right schema (_order, _parent_id, photo_id) from
    // TYN-139. This migration copies any rows from galleries_rels that
    // haven't already been copied so existing gallery data is preserved.
    // ------------------------------------------------------------------

    await client.query(`
      INSERT INTO "galleries_photos" ("_order", "_parent_id", "photo_id")
      SELECT
        (ROW_NUMBER() OVER (
          PARTITION BY parent_id
          ORDER BY COALESCE("order", 99999) ASC
        ) - 1) AS "_order",
        parent_id AS "_parent_id",
        photos_id AS "photo_id"
      FROM "galleries_rels"
      WHERE path = 'photos'
        AND photos_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "galleries_photos" gp
          WHERE gp."_parent_id" = "galleries_rels".parent_id
        )
    `)

    console.log('✓ galleries_photos seeded from galleries_rels')

    // ------------------------------------------------------------------
    // Migration 20260609_100000: add featured column to testimonials
    // Required by TYN-191: featured checkbox for homepage curation.
    // Only testimonials with featured=true appear on the homepage;
    // all testimonials still appear on /testimonials.
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "testimonials"
        ADD COLUMN IF NOT EXISTS "featured" boolean DEFAULT false
    `)

    console.log('✓ testimonials.featured column ready')

    // ------------------------------------------------------------------
    // Migration 20260611_100000: add builder global table
    // Required by TYN-214: Puck visual-builder POC stores the whole page
    // document as a single JSON blob in the `builder` global.
    // ------------------------------------------------------------------

    // The `builder` global was a single-page POC store; it was replaced by the
    // `pages` collection (TYN-216). Drop the orphaned table so dev schema-push
    // does not prompt and prod stays clean. (POC data is disposable.)
    await client.query(`DROP TABLE IF EXISTS "builder"`)

    console.log('✓ builder table dropped (replaced by pages collection)')

    // ------------------------------------------------------------------
    // Migration 20260611_110000: add pages collection table
    // Required by TYN-216: multi-page visual builder. Each row is one page
    // composed in /builder; `content` is the Puck document JSON.
    // ------------------------------------------------------------------

    await client.query(`
      CREATE TABLE IF NOT EXISTS "pages" (
        "id"          serial  PRIMARY KEY NOT NULL,
        "title"       varchar,
        "slug"        varchar,
        "content"     jsonb,
        "published"   boolean DEFAULT false,
        "updated_at"  timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at"  timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "pages_slug_idx" ON "pages" USING btree ("slug")
    `)

    console.log('✓ pages table ready')

    // ------------------------------------------------------------------
    // Migration 20260612_100000: add display_order to pages (TYN-225)
    // Builder page-list manual reordering. Backfill existing rows with their
    // id so every page has a stable distinct order.
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "display_order" numeric
    `)
    await client.query(`
      UPDATE "pages" SET "display_order" = "id" WHERE "display_order" IS NULL
    `)

    console.log('✓ pages.display_order ready')

    // ------------------------------------------------------------------
    // Migration 20260612_120000: page placement flags (TYN-226 / TYN-227)
    // `show_in_nav` lets a builder page appear in the public site menu.
    // `is_homepage` lets a builder page render at "/" as the site homepage.
    // Both default false so existing pages are untouched (URL-only, as before).
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "show_in_nav" boolean DEFAULT false
    `)
    await client.query(`
      ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "is_homepage" boolean DEFAULT false
    `)

    console.log('✓ pages placement flags ready')

    // ------------------------------------------------------------------
    // Migration 20260613_100000: gallery taped-photo display style (TYN-235)
    // Boolean flag: when true the public /portfolio/[slug] page renders the
    // gallery with the editorial taped-photo treatment instead of a clean grid.
    // Default false so existing galleries are unchanged.
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "galleries" ADD COLUMN IF NOT EXISTS "taped_style" boolean DEFAULT false
    `)

    console.log('✓ galleries.taped_style ready')

    // ------------------------------------------------------------------
    // Migration 20260616_100000: must_change_password column on users (TYN-175)
    // When true the admin UI prompts the user to set a new password before
    // they can continue. Pre-set for Tynnell's account so she sets her own
    // password on first login rather than using the temp one.
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false
    `)
    await client.query(`
      UPDATE "users" SET "must_change_password" = true
      WHERE email = 'Hello@TynnellHollinsPhotography.com'
        AND "must_change_password" = false
    `)

    console.log('✓ users.must_change_password ready')

    // ------------------------------------------------------------------
    // Migration 20260619_100000: galleries hero_photo_id column (TYN-239)
    // Separate hero photo for the full-bleed gallery page banner, distinct
    // from the cover photo used on the portfolio index card.
    // Optional: when null the page falls back to coverPhoto.
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "galleries"
        ADD COLUMN IF NOT EXISTS "hero_photo_id" integer
          REFERENCES "photos" ("id")
          ON DELETE SET NULL
    `)

    console.log('✓ galleries.hero_photo_id ready')

    // ------------------------------------------------------------------
    // Migration 20260619_200000: galleries.status column (gallery editor)
    // Draft/published toggle for the Pixieset-style gallery editor.
    // Default 'published' so all existing galleries remain visible.
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "galleries"
        ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'published'
    `)

    console.log('✓ galleries.status ready')

    // ------------------------------------------------------------------
    // Migration 20260629_100000: gallery password protection (TYN-10)
    // is_password_protected: toggle requiring a password to view the gallery
    // password: plaintext password visitors must enter
    // Default false/null so all existing galleries remain publicly accessible.
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "galleries"
        ADD COLUMN IF NOT EXISTS "is_password_protected" boolean DEFAULT false
    `)
    await client.query(`
      ALTER TABLE "galleries"
        ADD COLUMN IF NOT EXISTS "password" varchar
    `)

    console.log('✓ galleries password protection columns ready')

    // ------------------------------------------------------------------
    // Migration 20260629_200000: testimonials.photo_id column
    // Optional relationship to a Photo in the library. When set, the public
    // /testimonials page displays the photo full-width with the testimonial.
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "testimonials"
        ADD COLUMN IF NOT EXISTS "photo_id" integer
          REFERENCES "photos" ("id")
          ON DELETE SET NULL
    `)

    console.log('✓ testimonials.photo_id ready')

    // ------------------------------------------------------------------
    // Migration 20260629_300000: posts.category column
    // Optional select field so posts can be filtered by category on the
    // public blog page (Style Guide, Portrait Sessions, Weddings, etc.)
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "posts"
        ADD COLUMN IF NOT EXISTS "category" varchar(40)
    `)

    console.log('✓ posts.category ready')

    // ------------------------------------------------------------------
    // Migration 20260630_100000: galleries.allow_download column
    // Per-gallery toggle letting Tynnell decide whether clients can
    // download photos. Default false so existing galleries are unchanged.
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "galleries"
        ADD COLUMN IF NOT EXISTS "allow_download" boolean DEFAULT false
    `)

    console.log('✓ galleries.allow_download ready')

    // ------------------------------------------------------------------
    // Migration 20260701_100000: projects collection (TYN-124/125/126/127)
    // Client Project Management - central record for each client engagement
    // (replaces Pixieset Studio Manager). Sessions, payments, and documents
    // are array sub-tables keyed to the parent project.
    // ------------------------------------------------------------------

    await client.query(`
      CREATE TABLE IF NOT EXISTS "projects" (
        "id"              serial  PRIMARY KEY NOT NULL,
        "title"           varchar NOT NULL,
        "status"          varchar DEFAULT 'inquiry' NOT NULL,
        "client_name"     varchar NOT NULL,
        "client_email"    varchar NOT NULL,
        "project_type"    varchar,
        "project_date"    timestamp(3) with time zone,
        "location"        varchar,
        "description"     varchar,
        "internal_notes"  varchar,
        "updated_at"      timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at"      timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "projects_sessions" (
        "id"            serial  PRIMARY KEY NOT NULL,
        "_order"        integer NOT NULL,
        "_parent_id"    integer NOT NULL,
        "session_date"  timestamp(3) with time zone NOT NULL,
        "location"      varchar,
        "session_type"  varchar,
        "duration"      numeric,
        "notes"         varchar
      )
    `)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "projects_sessions"
          ADD CONSTRAINT "projects_sessions_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "projects"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "projects_sessions_order_idx" ON "projects_sessions" USING btree ("_order")
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "projects_sessions_parent_id_idx" ON "projects_sessions" USING btree ("_parent_id")
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "projects_payments" (
        "id"          serial  PRIMARY KEY NOT NULL,
        "_order"      integer NOT NULL,
        "_parent_id"  integer NOT NULL,
        "label"       varchar NOT NULL,
        "amount"      numeric NOT NULL,
        "due_date"    timestamp(3) with time zone,
        "status"      varchar DEFAULT 'upcoming' NOT NULL,
        "notes"       varchar
      )
    `)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "projects_payments"
          ADD CONSTRAINT "projects_payments_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "projects"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "projects_payments_order_idx" ON "projects_payments" USING btree ("_order")
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "projects_payments_parent_id_idx" ON "projects_payments" USING btree ("_parent_id")
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "projects_documents" (
        "id"             serial  PRIMARY KEY NOT NULL,
        "_order"         integer NOT NULL,
        "_parent_id"     integer NOT NULL,
        "title"          varchar NOT NULL,
        "document_type"  varchar DEFAULT 'contract' NOT NULL,
        "status"         varchar DEFAULT 'draft' NOT NULL,
        "document_date"  timestamp(3) with time zone,
        "amount"         numeric,
        "external_link"  varchar,
        "notes"          varchar
      )
    `)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "projects_documents"
          ADD CONSTRAINT "projects_documents_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "projects"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "projects_documents_order_idx" ON "projects_documents" USING btree ("_order")
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "projects_documents_parent_id_idx" ON "projects_documents" USING btree ("_parent_id")
    `)

    console.log('✓ projects tables ready')

    // ------------------------------------------------------------------
    // Migration 20260708_100000: users.role column (TYN-302)
    // Admin: full access. Content Editor: Photos/Galleries/Posts/
    // Testimonials/Services/Pages only, not Users/Site Config/Booking
    // Settings/Availability. Existing rows default to 'admin' since both
    // current accounts (Tynnell + developer) are fully trusted.
    // ------------------------------------------------------------------

    await client.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" varchar(20) DEFAULT 'admin'
    `)
    await client.query(`
      UPDATE "users" SET "role" = 'admin' WHERE "role" IS NULL
    `)

    console.log('✓ users.role ready')

    // ------------------------------------------------------------------
    // Migration 20260715_100000: site_design global table (TYN-314)
    // Site-wide theme (logo, fonts, colors, spacing, button style,
    // animations) edited from the /design Studio page. Defaults match
    // tokens.css's existing hardcoded values so publishing for the first
    // time is a no-op visually until something is actually changed.
    // ------------------------------------------------------------------

    await client.query(`
      CREATE TABLE IF NOT EXISTS "site_design" (
        "id"                  serial  PRIMARY KEY NOT NULL,
        "logo_url"            varchar,
        "heading_font"        varchar DEFAULT 'poppins',
        "body_font"           varchar DEFAULT 'poppins',
        "color_bg"            varchar DEFAULT '#0C0C0C',
        "color_bg_accent"     varchar DEFAULT '#131313',
        "color_heading"       varchar DEFAULT '#D6D1CE',
        "color_body"          varchar DEFAULT '#E6E1DE',
        "color_detail"        varchar DEFAULT '#9B9A9A',
        "color_btn_bg"        varchar DEFAULT '#9B9A9A',
        "spacing_scale"       varchar DEFAULT 'normal',
        "button_style"        varchar DEFAULT 'sharp',
        "animations_enabled"  boolean DEFAULT true,
        "updated_at"          timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at"          timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)

    console.log('✓ site_design table ready')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
