export interface NavLink {
  label: string
  href: string
  children?: NavLink[]
}

export const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About me', href: '/about' },
  {
    label: 'Portfolio',
    href: '/portfolio',
    children: [
      { label: 'Portraits', href: '/portfolio/portraits' },
      { label: 'Family', href: '/portfolio/family' },
      { label: 'Weddings', href: '/portfolio/weddings' },
    ],
  },
  { label: 'Services', href: '/services' },
  { label: 'Testimonials', href: '/testimonials' },
  { label: 'Contact', href: '/contact' },
  { label: 'Blog', href: '/blog' },
]

// The desktop nav row. Its labels differ from the menu and footer (for example
// "Wedding photography" here, "Weddings" under Portfolio in the menu), so it is
// its own constant. Builder pages flagged show-in-menu never go in the row; they
// appear in the menu and footer only, which keeps the row at five links.
export const navRow: { left: NavLink[]; right: NavLink[]; cta: NavLink } = {
  left: [
    { label: 'Home', href: '/' },
    { label: 'About me', href: '/about' },
    { label: 'Wedding photography', href: '/portfolio/weddings' },
  ],
  right: [
    { label: 'Portraits', href: '/portfolio/portraits' },
    { label: 'My work', href: '/portfolio' },
  ],
  cta: { label: 'Inquire now', href: '/contact' },
}
