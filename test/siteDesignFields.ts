import { SiteDesign } from '@/globals/SiteDesign'

// The SiteDesign global's own field list, read from its config. Tests that
// guard the theme chain (CLAUDE.md "The theme chain has six links") iterate
// this instead of a hand-written list, so adding a field to the global
// without wiring it through every link fails a test instead of shipping.
export interface DesignField {
  name: string
  type: 'text' | 'checkbox' | 'select'
  options: string[]
}

export const SITE_DESIGN_FIELDS: DesignField[] = SiteDesign.fields.map((field) => {
  if (!('name' in field) || !['text', 'checkbox', 'select'].includes(field.type)) {
    throw new Error(`SiteDesign has a ${field.type} field; extend test/siteDesignFields.ts to cover it`)
  }
  const options =
    field.type === 'select'
      ? field.options.map((o) => (typeof o === 'string' ? o : o.value))
      : []
  return { name: field.name, type: field.type as DesignField['type'], options }
})
