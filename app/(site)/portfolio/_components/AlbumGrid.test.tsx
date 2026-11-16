// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import AlbumGrid, { type AlbumItem } from './AlbumGrid'
import { config } from '@/app/builder/puck.config'

const albums: AlbumItem[] = [
  { id: 1, slug: 'june-wedding', title: 'June Wedding', coverUrl: null, coverAlt: '', previewUrls: [], photoCount: 40 },
  { id: 2, slug: 'fall-elopement', title: 'Fall Elopement', coverUrl: null, coverAlt: '', previewUrls: [], photoCount: 25 },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = (config.components as Record<string, any>).AlbumGrid

describe('AlbumGrid strip layout (Rising Roots "portfolio-scrolling")', () => {
  it('puts the albums in a scrolling strip a keyboard user can reach and scroll', () => {
    render(<AlbumGrid albums={albums} layout="strip" />)

    // A horizontally scrolling box must be focusable, or keyboard users can
    // never scroll to the albums past the edge of the screen.
    const strip = screen.getByRole('region', { name: 'Albums' })
    expect(strip).toHaveAttribute('tabindex', '0')
    expect(strip).toContainElement(screen.getByRole('link', { name: /June Wedding/ }))
    expect(strip).toContainElement(screen.getByRole('link', { name: /Fall Elopement/ }))
  })

  it('still links every album in the strip to its own album page', () => {
    render(<AlbumGrid albums={albums} layout="strip" />)

    expect(screen.getByRole('link', { name: /June Wedding/ })).toHaveAttribute('href', '/portfolio/june-wedding')
    expect(screen.getByRole('link', { name: /Fall Elopement/ })).toHaveAttribute('href', '/portfolio/fall-elopement')
  })

  it('keeps the existing grid when no layout is given, so live pages do not change', () => {
    render(<AlbumGrid albums={albums} />)

    expect(screen.queryByRole('region', { name: 'Albums' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /June Wedding/ })).toBeInTheDocument()
  })
})

describe('AlbumGrid builder block', () => {
  it('lets Tynnell choose between the grid and the scrolling strip, defaulting to the grid', () => {
    const values = block.fields.layout.options.map((o: { value: string }) => o.value)

    expect(values).toEqual(['grid', 'strip'])
    expect(block.defaultProps.layout).toBe('grid')
  })

  it('renders the strip when the strip layout is chosen', () => {
    render(block.render({ ...block.defaultProps, layout: 'strip', resolvedAlbums: albums, puck: {} }) as ReactElement)

    expect(screen.getByRole('region', { name: 'Albums' })).toBeInTheDocument()
  })
})

describe('AlbumGrid own heading', () => {
  it('omits its own Albums heading when told the page supplies one', () => {
    render(<AlbumGrid albums={albums} hideHeading />)

    expect(screen.queryByRole('heading', { name: 'Albums' })).not.toBeInTheDocument()
  })
})

describe('AlbumGrid block heading and button', () => {
  const draw = (props: Record<string, unknown>) =>
    render(block.render({ ...block.defaultProps, ...props, puck: {} }) as ReactElement)

  it('shows the heading, subtext and button around the albums, with no second Albums heading', () => {
    draw({ heading: 'A Few Favorites', subtext: 'Every frame tells a story', buttonText: 'View more galleries', buttonHref: '/portfolio', resolvedAlbums: albums })

    expect(screen.getByRole('heading', { name: 'A Few Favorites' })).toBeInTheDocument()
    expect(screen.getByText('Every frame tells a story')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View more galleries' })).toHaveAttribute('href', '/portfolio')
    expect(screen.queryByRole('heading', { name: 'Albums' })).not.toBeInTheDocument()
  })

  it('leaves the heading and button out when there are no albums, even with the switch off', () => {
    draw({ heading: 'A Few Favorites', buttonText: 'View more galleries', resolvedAlbums: [] })

    expect(screen.queryByRole('heading', { name: 'A Few Favorites' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'View more galleries' })).not.toBeInTheDocument()
  })

  it('keeps showing its own Albums heading when the page sets none, so live pages do not change', () => {
    draw({ resolvedAlbums: albums })

    expect(screen.getByRole('heading', { name: 'Albums' })).toBeInTheDocument()
  })
})
