/**
 * Writes the new Rising Roots Home into a page's DRAFT (pages.draft_content).
 * The live `content` and `published` are never touched, so production keeps
 * rendering the current Home until the draft is published from the builder.
 *
 * Usage (DATABASE_URI must be in the environment):
 *   node node_modules/tsx/dist/cli.mjs scripts/write-home-draft.ts <pageId> <backupDir> [--dry-run]
 *
 * The whole row is saved as JSON in <backupDir> before anything else happens.
 * Refuses to run unless the page is flagged as the homepage.
 */
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { buildHome, homeWordsFromCurrent } from '../app/builder/homeLayout'

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const dryRun = process.argv.includes('--dry-run')
  const [pageIdArg, backupDir] = args
  const pageId = Number(pageIdArg)
  if (!Number.isInteger(pageId) || !backupDir) {
    console.error('Usage: write-home-draft.ts <pageId> <backupDir> [--dry-run]')
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
    const { rows } = await client.query(
      'SELECT id, title, slug, is_homepage, published, content, draft_content FROM pages WHERE id = $1',
      [pageId],
    )
    const row = rows[0]
    if (!row) throw new Error(`No page with id ${pageId}`)
    if (!row.is_homepage) throw new Error(`Page ${pageId} (${row.slug}) is not the homepage; refusing to write`)
    // A saved draft is someone's unpublished work; the builder's Publish button also
    // publishes every page's draft at once. Never overwrite one silently.
    if (row.draft_content != null && !process.argv.includes('--dry-run')) {
      throw new Error(`Page ${pageId} already has a saved draft; refusing to overwrite it`)
    }

    fs.mkdirSync(backupDir, { recursive: true })
    const backupFile = path.join(backupDir, `page-${pageId}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
    fs.writeFileSync(backupFile, JSON.stringify(row, null, 2))
    console.log(`Backup saved: ${backupFile}`)

    const words = homeWordsFromCurrent(row.content)
    const home = buildHome(words)
    console.log('Carried-over words:', JSON.stringify(words, null, 2))
    console.log('New blocks:', (home.content as { type: string }[]).map((b) => b.type).join(', '))

    if (dryRun) {
      console.log('Dry run: nothing written.')
      return
    }
    await client.query('UPDATE pages SET draft_content = $1 WHERE id = $2', [JSON.stringify(home), pageId])
    console.log(`Wrote draft_content for page ${pageId}. content and published are unchanged.`)
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
