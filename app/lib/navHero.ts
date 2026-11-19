import type { Data } from '@measured/puck'

// The nav is solid unless a page OPENS on a full-bleed photo (see Navbar.module.css,
// which keys on [data-nav-hero]). On a builder page only the first block can open
// the page, so only it is flagged here, and the Hero / Full Width Image blocks
// mark themselves only when flagged. A Full Width Image halfway down a page then
// never turns the nav transparent over the bone ground at the top.
//
// A block hidden on either device is not flagged: on the device where it is
// hidden there is no photo behind the nav, so the nav stays solid on both.

type Props = Record<string, unknown>

function opensPage(type: string, props: Props): boolean {
  if (!props.imageUrl) return false
  if (props.hideOnMobile || props.hideOnDesktop) return false
  if (type === 'FullWidthImage') return true
  // The split layout is half photo, half text on the page ground: not a hero
  // for the nav to float over.
  return type === 'Hero' && props.layout !== 'split'
}

export function markNavHero(data: Data): Data {
  const first = data.content?.[0]
  if (!first || !opensPage(first.type, first.props as Props)) return data
  return {
    ...data,
    content: [{ ...first, props: { ...first.props, navHero: true } }, ...data.content.slice(1)],
  } as Data
}
