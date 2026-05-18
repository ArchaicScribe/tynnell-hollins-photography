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

const pool = new Pool({ connectionString })

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
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
