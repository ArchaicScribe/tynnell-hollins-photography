import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

// Puck's default stylesheet (`@measured/puck/puck.css`) opens with
// `@import "https://rsms.me/inter/inter.css"`. The site's CSP only allows
// stylesheets from 'self', so the browser blocks that import, fails the whole
// <link>, and Turbopack turns the failed CSS chunk into a ChunkLoadError. That
// crashed every page editor at /builder/[slug] on production. Puck ships
// `@measured/puck/no-external.css` for exactly this case.
//
// This guards every Puck CSS import in the app, not just the two that exist
// today, so a new editor surface cannot reintroduce it.
const repoRoot = path.resolve(__dirname, '..', '..')
const require = createRequire(path.join(repoRoot, 'package.json'))

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return name === 'node_modules' ? [] : sourceFiles(full)
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : []
  })
}

const puckCssImports = ['app', 'components']
  .flatMap((dir) => sourceFiles(path.join(repoRoot, dir)))
  .flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/['"](@measured\/puck\/[^'"]+\.css)['"]/g)].map(([, spec]) => ({
      file: path.relative(repoRoot, file),
      spec,
    })),
  )

describe('Puck stylesheet imports', () => {
  it('finds the editor stylesheet imports it is meant to guard', () => {
    expect(puckCssImports.length).toBeGreaterThan(0)
  })

  it.each(puckCssImports)('$file imports $spec, which loads nothing from another origin', ({ spec }) => {
    const css = readFileSync(require.resolve(spec), 'utf8')
    const remoteImports = (css.match(/@import[^;]*;/g) ?? []).filter((rule) => /(https?:)?\/\//.test(rule))
    expect(remoteImports).toEqual([])
  })
})
