import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'fs'
import path from 'path'

// patch-package applies a patch file to whatever version is installed and only
// WARNS when the version in the file name differs, so a dependency bump that
// forgets to rename the patch keeps "working" while the patched lines may have
// moved upstream. Found on the 3.89.0 to 3.90.0 Payload bump (2026-11-20). The
// patch file name must carry exactly the version package.json pins.

const root = path.resolve(__dirname, '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const declared: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies }

// "@payloadcms+next+3.90.0.patch" -> { name: "@payloadcms/next", version: "3.90.0" }
function parse(file: string) {
  const m = file.match(/^(.+)\+(\d+\.\d+\.\d+[^+]*)\.patch$/)
  if (!m) return null
  return { name: m[1].replace('+', '/'), version: m[2] }
}

const files = readdirSync(path.join(root, 'patches')).filter((f) => f.endsWith('.patch'))

describe('patches/', () => {
  it('has at least one patch to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)('%s is named for a package and version', (file) => {
    expect(parse(file), file).not.toBeNull()
  })

  it.each(files)('%s matches the version package.json pins', (file) => {
    const { name, version } = parse(file)!
    expect(declared[name], `${name} is not a direct dependency`).toBe(version)
  })
})
