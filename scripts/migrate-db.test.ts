import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'

// migrate-db.mjs runs raw SQL against the database as the Vercel pre-build
// step, so a SQL typo fails every deploy, and nothing else in the suite
// executes it. These checks read the script as text.
const source = readFileSync(path.resolve(__dirname, 'migrate-db.mjs'), 'utf8')

describe('scripts/migrate-db.mjs', () => {
  // Postgres anonymous blocks are quoted with a pair of dollar signs. A
  // single one is a syntax error ("syntax error at or near $"), which is
  // exactly what a JavaScript String.replace does to "$$" in a replacement
  // string when a block is pasted in by script.
  it('opens and closes every DO block with $$', () => {
    const blocks = source.match(/\bDO \$+ BEGIN/g) ?? []
    const ends = source.match(/\bEND \$+/g) ?? []
    expect(blocks.length).toBeGreaterThan(0)
    expect(blocks.filter(b => b !== 'DO $$ BEGIN')).toEqual([])
    expect(ends.filter(e => e !== 'END $$')).toEqual([])
    expect(ends.length).toBe(blocks.length)
  })

  // TYN-352: the navbar colours are deliberately empty until chosen (empty
  // means "follow the button colours"), so unlike the other palette columns
  // they get no default and no backfill. A backfill would overwrite the
  // olive the navbar shows today.
  describe('site_design navbar colors (TYN-352)', () => {
    for (const column of ['color_nav_bg', 'color_nav_text']) {
      it(`adds ${column} as a plain varchar with no default`, () => {
        expect(source).toMatch(
          new RegExp(`ALTER TABLE "site_design" ADD COLUMN IF NOT EXISTS "${column}" varchar\\s*\`\\)`),
        )
      })

      it(`does not backfill ${column}`, () => {
        expect(source).not.toMatch(new RegExp(`UPDATE "site_design" SET "${column}"`))
        expect(source).not.toMatch(new RegExp(`\\['${column}'`))
      })
    }
  })

  // TYN-311: galleries.event_date is a Payload `date` field, which Payload
  // stores as timestamp(3) with time zone. Anything else here and the schema
  // push in `next dev` would try to alter the column.
  describe('galleries event date (TYN-311)', () => {
    it('adds event_date as a nullable timestamp with time zone', () => {
      expect(source).toMatch(
        /ALTER TABLE "galleries" ADD COLUMN IF NOT EXISTS "event_date" timestamp\(3\) with time zone\s*`\)/,
      )
    })
  })

  // `next dev` syncs the database to the Payload config. Anything this
  // script creates under a different name, or with a different rule, than
  // Payload would generate is dropped or duplicated the next time dev runs.
  describe('favorite_lists matches what Payload generates (TYN-13)', () => {
    it('names the one-list-per-client unique index as Payload does', () => {
      expect(source).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS "gallery_clientEmail_idx"\s+ON "favorite_lists" USING btree \("gallery_id", "client_email"\)/)
    })

    it('names the gallery foreign key as Payload does, with the same delete rule', () => {
      expect(source).toMatch(/ADD CONSTRAINT "favorite_lists_gallery_id_galleries_id_fk"\s+FOREIGN KEY \("gallery_id"\)\s+REFERENCES "galleries"\("id"\)\s+ON DELETE SET NULL/)
    })

    it('removes the differently named index and key an earlier build created', () => {
      expect(source).toContain('DROP INDEX IF EXISTS "favorite_lists_gallery_client_email_idx"')
      expect(source).toContain('ALTER TABLE "favorite_lists" DROP CONSTRAINT IF EXISTS "favorite_lists_gallery_id_fk"')
    })
  })
})
