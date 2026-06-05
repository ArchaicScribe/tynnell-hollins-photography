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

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })

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
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
