import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import path from 'path'

// Step 5, item 2: one set of motion tokens so the whole site moves with one
// feel. The public stylesheets use them instead of their own timings, and a new
// stylesheet that adds a raw 0.2s / 0.3s / 0.35s timing fails here.

const root = path.resolve(__dirname, '../..')
const tokens = readFileSync(path.join(root, 'app/(site)/styles/tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return cssFiles(full)
    return full.endsWith('.css') ? [full] : []
  })
}

const declared = (name: string) => tokens.match(new RegExp(`${name}:\s*([^;]+);`))?.[1].trim()

describe('motion tokens', () => {
  it('are declared once in the site tokens, with the agreed values', () => {
    expect(declared('--motion-fast')).toBe('0.2s')
    expect(declared('--motion-base')).toBe('0.35s')
    expect(declared('--motion-slow')).toBe('1s')
    expect(declared('--ease')).toBe('ease-out')
  })

  it('are the only timings the public stylesheets use for quick and medium transitions', () => {
    const files = [...cssFiles(path.join(root, 'app/(site)')), ...cssFiles(path.join(root, 'app/components'))]
      .filter((f) => !f.endsWith('tokens.css'))
    const offenders: string[] = []
    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (/transition\s*:/.test(line) && /(^|[\s,:])(0?\.2|0?\.3|0?\.35)s\b/.test(line)) {
          offenders.push(`${path.relative(root, file)}:${i + 1}: ${line.trim()}`)
        }
      })
    }

    expect(offenders).toEqual([])
  })
})
