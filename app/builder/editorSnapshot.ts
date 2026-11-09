import type { Data } from '@measured/puck'

// A comparable fingerprint of what the user has actually authored in the
// editor, used to decide whether there are unsaved changes.
//
// Comparing raw JSON flagged every page as "Unsaved changes" the moment it
// opened, because Puck changes the data on load without any edit:
// - each block's resolveData fetches live data (photos, testimonials,
//   services, posts, booking dates) into `resolved*` props. The public site
//   re-runs resolveAllData on every render, so these are never authored.
// - Puck rewrites a legacy root (`{}` or `{ title }`) into `{ props: {...} }`.
// Key order is also normalized, so a rebuilt object is not mistaken for an edit.

const isResolvedProp = (key: string) => key.startsWith('resolved')

function isBlock(value: Record<string, unknown>): boolean {
  return typeof value.type === 'string' && value.props !== null && typeof value.props === 'object'
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize)
  if (value === null || typeof value !== 'object') return value
  const obj = value as Record<string, unknown>
  const block = isBlock(obj)
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(obj).sort()) {
    if (key === 'props' && block) {
      const props = obj.props as Record<string, unknown>
      const kept: Record<string, unknown> = {}
      for (const k of Object.keys(props)) if (!isResolvedProp(k)) kept[k] = props[k]
      out.props = normalize(kept)
    } else {
      out[key] = normalize(obj[key])
    }
  }
  return out
}

function rootProps(root: Data['root'] | undefined): Record<string, unknown> {
  const { props, ...legacy } = (root ?? {}) as Record<string, unknown>
  return { ...legacy, ...((props as Record<string, unknown> | undefined) ?? {}) }
}

export function editorSnapshot(data: Data): string {
  return JSON.stringify(
    normalize({
      root: { props: rootProps(data.root) },
      content: data.content ?? [],
      zones: data.zones ?? {},
    }),
  )
}
