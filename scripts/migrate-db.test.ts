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
})
