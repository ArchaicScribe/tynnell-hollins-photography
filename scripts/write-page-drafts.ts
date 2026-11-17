/**
 * Creates or drafts the Rising Roots inner pages (see app/builder/pageLayouts.ts).
 * Never touches `content` or `published` of an existing page, and never
 * publishes anything: the builder's Publish button does that, and publishes
 * EVERY page's draft and every unpublished page at once, so do not run it
 * casually after this.
 *
 * Usage (DATABASE_URI must be in the environment):
 *   node node_modules/tsx/dist/cli.mjs scripts/write-page-drafts.ts create <slug> <backupDir>
 *       Inserts a new UNPUBLISHED page built from the slug's blank layout.
 *   node node_modules/tsx/dist/cli.mjs scripts/write-page-drafts.ts draft <pageId> <backupDir> [--dry-run]
 *       Writes only draft_content of an existing page, carrying its current
 *       words over where the layout supports it. Refuses to overwrite a draft.
 *
 * Every row touched is saved as JSON in <backupDir> first. Strict TLS.
 */
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { layoutForSlug, assertCanCreate, assertCanDraft } from '../app/builder/pageLayouts'

const TITLES: Record<string, string> = {
  'wedding-photography': 'Wedding photography',
  portraits: 'Portraits',
}

function backup(backupDir: string, name: string, row: unknown): string {
  fs.mkdirSync(backupDir, { recursive: true })
  const file = path.join(backupDir, `${name}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(file, JSON.stringify(row, null, 2))
  return file
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const dryRun = process.argv.includes('--dry-run')
  const [mode, target, backupDir] = args
  if ((mode !== 'create' && mode !== 'draft') || !target || !backupDir) {
    console.error('Usage: write-page-drafts.ts create <slug> <backupDir> | draft <pageId> <backupDir> [--dry-run]')
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
    if (mode === 'create') {
      const slug = target
      const { rows: all } = await client.query('SELECT slug FROM pages')
      assertCanCreate(all.map((r) => r.slug as string), slug)
      const layout = layoutForSlug(slug)!
      const title = TITLES[slug] ?? slug
      console.log('Will create unpublished page:', JSON.stringify({ title, slug }))
      console.log('Blocks:', (layout.content as { type: string }[]).map((b) => b.type).join(', '))
      const { rows } = await client.query(
        'INSERT INTO pages (title, slug, content, published, show_in_nav, display_order) VALUES ($1, $2, $3, false, false, $4) RETURNING id',
        [title, slug, JSON.stringify(layout), Date.now()], // display_order as the builder sets it
      )
      console.log(`Created page ${rows[0].id} ("${slug}"), unpublished.`)
      return
    }

    const pageId = Number(target)
    if (!Number.isInteger(pageId)) throw new Error('pageId must be a whole number')
    const { rows } = await client.query('SELECT id, title, slug, published, content, draft_content FROM pages WHERE id = $1', [pageId])
    const row = rows[0]
    if (!row) throw new Error(`No page with id ${pageId}`)
    assertCanDraft(row, dryRun)

    console.log(`Backup saved: ${backup(backupDir, `page-${pageId}`, row)}`)
    const layout = layoutForSlug(row.slug, row.content)!
    console.log('New blocks:', (layout.content as { type: string }[]).map((b) => b.type).join(', '))
    if (dryRun) {
      console.log('Dry run: nothing written.')
      console.log(JSON.stringify(layout, null, 2))
      return
    }
    await client.query('UPDATE pages SET draft_content = $1 WHERE id = $2', [JSON.stringify(layout), pageId])
    console.log(`Wrote draft_content for page ${pageId}. content and published are unchanged.`)
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
