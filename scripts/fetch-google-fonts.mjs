import fs from 'node:fs'
import path from 'node:path'

// Downloads the latin-subset woff2 files for every family the app currently
// pulls from Google at build time, so next/font/local can serve them from the
// repo instead. Chrome UA is required or Google returns legacy ttf/woff.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const OUT = path.resolve('app/fonts/google')
fs.mkdirSync(OUT, { recursive: true })

// slug -> css2 query. Weights mirror exactly what the layouts request today.
const FAMILIES = {
  tangerine: 'family=Tangerine:wght@400;700',
  poppins: 'family=Poppins:wght@300;400;500;600;700;800',
  'abril-fatface': 'family=Abril+Fatface:wght@400',
  'cormorant-garamond': 'family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600',
  barlow: 'family=Barlow:wght@300;400;500;600',
  jost: 'family=Jost:wght@300;400;500',
  parisienne: 'family=Parisienne:wght@400',
  archivo: 'family=Archivo:wght@400;500;600;700',
  'roboto-mono': 'family=Roboto+Mono:ital,wght@0,300;0,400;0,500;1,400',
}

const manifest = {}

for (const [slug, query] of Object.entries(FAMILIES)) {
  const cssUrl = `https://fonts.googleapis.com/css2?${query}&subset=latin&display=swap`
  const css = await fetch(cssUrl, { headers: { 'User-Agent': UA } }).then((r) => {
    if (!r.ok) throw new Error(`${slug}: css ${r.status}`)
    return r.text()
  })

  // Each @font-face block carries its own style/weight/src.
  const blocks = css.split('@font-face').slice(1)
  const faces = []
  for (const b of blocks) {
    const url = b.match(/src:\s*url\(([^)]+)\)/)?.[1]
    if (!url || !url.endsWith('.woff2')) continue
    // css2 ignores &subset and returns a block per unicode range. Keep only
    // the basic-latin block, which is exactly what subsets:['latin'] gave us
    // via next/font/google. U+0000-00FF only appears in that block.
    const range = b.match(/unicode-range:\s*([^;]+);/)?.[1] ?? ''
    if (!range.includes('U+0000-00FF')) continue
    const style = b.match(/font-style:\s*([a-z]+)/)?.[1] ?? 'normal'
    const weight = b.match(/font-weight:\s*([\d\s]+)/)?.[1]?.trim() ?? '400'
    const name = `${slug}-${weight.replace(/\s+/g, '-')}-${style}.woff2`
    const buf = Buffer.from(await fetch(url, { headers: { 'User-Agent': UA } }).then((r) => r.arrayBuffer()))
    fs.writeFileSync(path.join(OUT, name), buf)
    faces.push({ file: name, weight, style, bytes: buf.length })
  }
  manifest[slug] = faces
  const kb = faces.reduce((n, f) => n + f.bytes, 0) / 1024
  console.log(`${slug.padEnd(20)} ${String(faces.length).padStart(2)} file(s)  ${kb.toFixed(0)} KB`)
}

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
const total = Object.values(manifest).flat().reduce((n, f) => n + f.bytes, 0)
console.log(`\nTOTAL ${Object.values(manifest).flat().length} files, ${(total / 1024).toFixed(0)} KB`)
