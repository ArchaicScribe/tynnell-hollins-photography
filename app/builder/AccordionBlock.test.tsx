// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AccordionBlock } from './AccordionBlock'

// Step 5, item 8: the answers ease open and shut instead of snapping. The panel
// stays in the page (so it can animate) as a grid whose single row grows from 0fr
// to 1fr; while shut it is also hidden from the keyboard and screen readers once
// the collapse has finished. The global "reduced motion" and "Enable animations
// off" rules in globals.css already cut every transition to nothing, so this
// needs no switch of its own.

const items = [
  { title: 'First question', body: 'First answer' },
  { title: 'Second question', body: 'Second answer' },
  { title: 'Third question', body: 'Third answer' },
]

const panelOf = (title: string) => {
  const button = screen.getByRole('button', { name: new RegExp(title) })
  return document.getElementById(button.getAttribute('aria-controls')!) as HTMLElement
}
const rows = (el: HTMLElement) => el.style.getPropertyValue('grid-template-rows')

describe('Accordion easing', () => {
  it('keeps every answer in the page, so a shut one can animate open', () => {
    render(<AccordionBlock items={items} />)

    expect(screen.getByText('Second answer')).toBeInTheDocument()
    expect(screen.getByText('Third answer')).toBeInTheDocument()
  })

  it('opens the first row and leaves the others shut', () => {
    render(<AccordionBlock items={items} />)

    expect(rows(panelOf('First question'))).toBe('1fr')
    expect(rows(panelOf('Second question'))).toBe('0fr')
  })

  it('shuts the open row and opens the clicked one, still one at a time', () => {
    render(<AccordionBlock items={items} />)

    fireEvent.click(screen.getByRole('button', { name: /Second question/ }))

    expect(rows(panelOf('Second question'))).toBe('1fr')
    expect(rows(panelOf('First question'))).toBe('0fr')
  })

  it('shuts a row when its own button is clicked again', () => {
    render(<AccordionBlock items={items} />)

    fireEvent.click(screen.getByRole('button', { name: /First question/ }))

    expect(rows(panelOf('First question'))).toBe('0fr')
  })

  it('eases the row height on the base motion token', () => {
    render(<AccordionBlock items={items} />)

    expect(panelOf('First question').style.transition).toContain('grid-template-rows var(--motion-base, 0.35s) var(--ease, ease-out)')
  })

  it('hides a shut panel from the keyboard and screen readers, but only after it has collapsed', () => {
    render(<AccordionBlock items={items} />)
    const shut = panelOf('Second question')
    const open = panelOf('First question')

    expect(shut.style.visibility).toBe('hidden')
    expect(shut.style.transition).toContain('visibility 0s linear var(--motion-base, 0.35s)')
    expect(open.style.visibility).toBe('visible')
    expect(open.style.transition).toContain('visibility 0s linear 0s')
  })

  it('fades the answer with the height', () => {
    render(<AccordionBlock items={items} />)

    const shutAnswer = screen.getByText('Second answer')
    const openAnswer = screen.getByText('First answer')

    expect(shutAnswer.closest('[data-accordion-inner]')).toHaveStyle({ opacity: '0' })
    expect(openAnswer.closest('[data-accordion-inner]')).toHaveStyle({ opacity: '1' })
  })

  it('turns the arrow on the quick token', () => {
    render(<AccordionBlock items={items} />)

    const arrow = screen.getByRole('button', { name: /First question/ }).querySelector('[aria-hidden="true"]') as HTMLElement

    expect(arrow.style.transition).toContain('var(--motion-fast, 0.2s)')
  })

  it('tells assistive tech which row is expanded', () => {
    render(<AccordionBlock items={items} />)

    expect(screen.getByRole('button', { name: /First question/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /Second question/ })).toHaveAttribute('aria-expanded', 'false')
  })
})
