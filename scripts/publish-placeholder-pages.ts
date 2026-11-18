/**
 * Publishes Contact (39), My work (44), Wedding photography (51) and Portraits
 * (52) with obvious "[Placeholder]" words (app/builder/placeholderWords.ts), at
 * Alex's request on 2026-11-18. Never touches About (33).
 *
 * Contact and My work: their saved DRAFT becomes the live content.
 * Wedding and Portraits: their blank layout becomes the live content and the
 * page is marked published.
 * Each row is saved to <backupDir> first, every page must be in exactly the
 * state it was left in (else nothing is written), and all four change in ONE
 * transaction. Strict TLS. This skips the builder's own revalidation, so the
 * pages refresh on their normal ISR window.
 *
 * Usage (DATABASE_URI must be in the environment):
 *   node node_modules/tsx/dist/cli.mjs scripts/publish-placeholder-pages.ts <backupDir> [--dry-run]
 */
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { fillPlaceholders } from '../app/builder/placeholderWords'

type Row = { id: number; slug: string; published: boolean | null; content: unknown; draft_content: unknown }
const blocks = (v: unknown): number => (v && typeof v === 'object' && Array.isArray((v as { content?: unknown }).content) ? (v as { content: unknown[] }).content.length : 0)

// id -> where the new content comes from, and the state the row must be in.
const PAGES: Record<number, { slug: string; from: 'draft' | 'content'; published: boolean; blocks: number }> = {
  39: { slug: 'contact', from: 'draft', published: true, blocks: 5 },
  44: { slug: 'portfolio-builder', from: 'draft', published: true, blocks: 8 },
  51: { slug: 'wedding-photography', from: 'content', published: false, blocks: 13 },
  52: { slug: 'portraits', from: 'content', published: false, blocks: 13 },
}

export function assertExpectedState(row: Row): void {
  const want = PAGES[row.id]
  if (!want) throw new Error(`Page ${row.id} is not one this script publishes`)
  if (row.slug !== want.slug) throw new Error(`Page ${row.id} has slug "${row.slug}", expected "${want.slug}"`)
  if (Boolean(row.published) !== want.published) throw new Error(`Page ${row.id} published=${row.published}, expected ${want.published}`)
  const source = want.from === 'draft' ? row.draft_content : row.content
  if (blocks(source) !== want.blocks) throw new Error(`Page ${row.id} ${want.from} has ${blocks(source)} blocks, expected ${want.blocks}; it was edited, refusing`)
  if (want.from === 'content' && row.draft_content != null) throw new Error(`Page ${row.id} has a saved draft; refusing`)
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const dryRun = process.argv.includes('--dry-run')
  const [backupDir] = args
  if (!backupDir) {
    console.error('Usage: publish-placeholder-pages.ts <backupDir> [--dry-run]')
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
    const ids = Object.keys(PAGES).map(Number)
    const { rows } = await client.query('SELECT id, slug, published, content, draft_content FROM pages WHERE id = ANY($1) ORDER BY id', [ids])
    if (rows.length !== ids.length) throw new Error(`Expected ${ids.length} pages, found ${rows.length}`)
    for (const row of rows) assertExpectedState(row)

    fs.mkdirSync(backupDir, { recursive: true })
    const backupFile = path.join(backupDir, `pre-placeholder-publish-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
    fs.writeFileSync(backupFile, JSON.stringify(rows, null, 2))
    console.log(`Backup saved: ${backupFile}`)

    const next = rows.map((row: Row) => {
      const source = PAGES[row.id].from === 'draft' ? row.draft_content : row.content
      return { id: row.id, slug: row.slug, content: fillPlaceholders(source as Parameters<typeof fillPlaceholders>[0]) }
    })
    for (const n of next) console.log(`Page ${n.id} (${n.slug}): ${blocks(n.content)} blocks`)
    if (dryRun) {
      console.log('Dry run: nothing written.')
      return
    }

    await client.query('BEGIN')
    try {
      for (const n of next) {
        const r = await client.query('UPDATE pages SET content = $1, draft_content = NULL, published = true WHERE id = $2', [JSON.stringify(n.content), n.id])
        if (r.rowCount !== 1) throw new Error(`Updating page ${n.id} changed ${r.rowCount} rows`)
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    }
    console.log('Published pages 39, 44, 51 and 52 with placeholder words.')
  } finally {
    await client.end()
  }
}

if (process.argv[1] && /publish-placeholder-pages/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
