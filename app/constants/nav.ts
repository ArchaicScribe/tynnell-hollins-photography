export interface NavLink {
  label: string
  href: string
  children?: NavLink[]
}

export const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
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
