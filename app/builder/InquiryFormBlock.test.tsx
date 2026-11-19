// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'

vi.mock('@/app/(site)/contact/InquiryForm', () => ({
  default: (p: { kind: string; minDate?: string; maxDate?: string }) => (
    <div data-testid="inquiry-form" data-kind={p.kind} data-min={p.minDate} data-max={p.maxDate} />
  ),
}))

const { config } = await import('./puck.config')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components = config.components as Record<string, any>
const block = components.InquiryForm

function renderBlock(props: Record<string, unknown>) {
  return render(block.render({ ...block.defaultProps, ...props, puck: {} }) as ReactElement)
}

afterEach(() => vi.unstubAllGlobals())

describe('Inquiry Form block', () => {
  it('passes its kind and the resolved booking dates to the form', () => {
    renderBlock({ kind: 'portrait', resolvedMinDate: '2027-01-01', resolvedMaxDate: '2028-01-01' })

    const form = screen.getByTestId('inquiry-form')
    expect(form).toHaveAttribute('data-kind', 'portrait')
    expect(form).toHaveAttribute('data-min', '2027-01-01')
    expect(form).toHaveAttribute('data-max', '2028-01-01')
  })

  it('defaults to the wedding form with no invented words', () => {
    renderBlock({})

    expect(screen.getByTestId('inquiry-form')).toHaveAttribute('data-kind', 'wedding')
    expect(block.defaultProps.eyebrow).toBe('')
    expect(block.defaultProps.heading).toBe('')
    expect(block.defaultProps.subtext).toBe('')
  })

  it('shows its heading and subtext only when set', () => {
    const { rerender } = renderBlock({})
    expect(screen.queryByRole('heading')).toBeNull()

    rerender(block.render({ ...block.defaultProps, heading: 'Let us talk', subtext: 'Tell me about it.', puck: {} }) as ReactElement)
    expect(screen.getByRole('heading', { name: 'Let us talk' })).toBeInTheDocument()
    expect(screen.getByText('Tell me about it.')).toBeInTheDocument()
  })

  it('offers wedding, portrait and visitor-chooses', () => {
    expect(block.fields.kind.options.map((o: { value: string }) => o.value)).toEqual(['wedding', 'portrait', 'choice'])
  })

  it('looks up the booking date bounds, and gives nothing when the lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ minDate: '2027-01-01', maxDate: '2028-01-01' }) }))
    expect(await block.resolveData()).toEqual({ props: { resolvedMinDate: '2027-01-01', resolvedMaxDate: '2028-01-01' } })

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await block.resolveData()).toEqual({ props: {} })
  })

  it('is offered in the block drawer', () => {
    const offered = Object.values(config.categories ?? {}).flatMap((c) => c.components ?? [])

    expect(offered).toContain('InquiryForm')
  })
})
