/**
 * Fills the live Home page (43) with "[Placeholder]" words
 * (app/builder/placeholderWords.ts), at Alex's request on 2026-11-24, so the
 * sections that were hidden until Tynnell writes her own words show up.
 * Only blank values are filled; words already on the page win. Numbers and the
 * freebie sign-up stay hidden (no placeholder entry for them).
 *
 * The page must be in exactly the state it was left in (published, no saved
 * draft, 11 blocks), else nothing is written. The row is saved to <backupDir>
 * first, one transaction, strict TLS. This skips the builder's revalidation,
 * so the page refreshes on its normal ISR window.
 *
 * Usage (DATABASE_URI must be in the environment):
 *   node node_modules/tsx/dist/cli.mjs scripts/fill-home-placeholders.ts <backupDir> [--dry-run]
 */
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { fillPlaceholders } from '../app/builder/placeholderWords'

type Row = { id: number; slug: string; published: boolean | null; content: unknown; draft_content: unknown }
const blocks = (v: unknown): number => (v && typeof v === 'object' && Array.isArray((v as { content?: unknown }).content) ? (v as { content: unknown[] }).content.length : 0)

export function assertHomeState(row: Row): void {
  if (row.id !== 43 || row.slug !== 'home-builder') throw new Error(`Page ${row.id} "${row.slug}" is not the Home page`)
  if (!row.published) throw new Error('Home is not published, refusing')
  if (row.draft_content != null) throw new Error('Home has a saved draft, refusing')
  if (blocks(row.content) !== 11) throw new Error(`Home has ${blocks(row.content)} blocks, expected 11; it was edited, refusing`)
}

async function main() {
  const [backupDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const dryRun = process.argv.includes('--dry-run')
  if (!backupDir) {
    console.error('Usage: fill-home-placeholders.ts <backupDir> [--dry-run]')
    process.exit(1)
  }
  const url = process.env.DATABASE_URI
  if (!url) {
    console.error('DATABASE_URI is not set')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: true } })
  await client.connect()
  try {
    const { rows } = await client.query('SELECT id, slug, published, content, draft_content FROM pages WHERE id = 43')
    if (rows.length !== 1) throw new Error('Home page 43 not found')
    assertHomeState(rows[0])

    fs.mkdirSync(backupDir, { recursive: true })
    const backupFile = path.join(backupDir, `pre-home-placeholders-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
    fs.writeFileSync(backupFile, JSON.stringify(rows, null, 2))
    console.log(`Backup saved: ${backupFile}`)

    const next = fillPlaceholders(rows[0].content as Parameters<typeof fillPlaceholders>[0])
    console.log(`Home: ${blocks(next)} blocks`)
    if (dryRun) {
      console.log('Dry run: nothing written.')
      return
    }

    await client.query('BEGIN')
    try {
      const r = await client.query('UPDATE pages SET content = $1 WHERE id = 43', [JSON.stringify(next)])
      if (r.rowCount !== 1) throw new Error(`Updating Home changed ${r.rowCount} rows`)
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    }
    console.log('Home filled with placeholder words.')
  } finally {
    await client.end()
  }
}

if (process.argv[1] && /fill-home-placeholders/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
