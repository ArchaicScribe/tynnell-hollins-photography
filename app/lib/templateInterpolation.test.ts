import { describe, it, expect } from 'vitest'
import { interpolateHtml, interpolateText } from './templateInterpolation'

describe('interpolateHtml', () => {
  it('substitutes known tokens', () => {
    expect(interpolateHtml('Hi {{clientName}}!', { clientName: 'Jane' })).toBe('Hi Jane!')
  })

  it('substitutes multiple occurrences of the same token', () => {
    expect(interpolateHtml('{{name}} and {{name}}', { name: 'A' })).toBe('A and A')
  })

  it('leaves unknown tokens untouched', () => {
    expect(interpolateHtml('Hi {{clientName}}, {{unknownToken}}', { clientName: 'Jane' }))
      .toBe('Hi Jane, {{unknownToken}}')
  })

  it('escapes HTML in a substituted value', () => {
    const result = interpolateHtml('Hi {{clientName}}', { clientName: '<script>alert(1)</script>' })
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('converts newlines in the result to <br />', () => {
    expect(interpolateHtml('Line one\nLine two', {})).toBe('Line one<br />Line two')
  })

  it('handles CRLF newlines', () => {
    expect(interpolateHtml('Line one\r\nLine two', {})).toBe('Line one<br />Line two')
  })
})

describe('interpolateText', () => {
  it('substitutes known tokens without HTML-escaping', () => {
    expect(interpolateText('Hi {{clientName}}', { clientName: "O'Brien" })).toBe("Hi O'Brien")
  })

  it('strips line breaks from substituted values to prevent header injection', () => {
    const result = interpolateText('Subject: {{clientName}}', { clientName: 'Jane\r\nBcc: evil@example.com' })
    expect(result).not.toContain('\r')
    expect(result).not.toContain('\n')
  })

  it('leaves unknown tokens untouched', () => {
    expect(interpolateText('{{missing}}', {})).toBe('{{missing}}')
  })
})
