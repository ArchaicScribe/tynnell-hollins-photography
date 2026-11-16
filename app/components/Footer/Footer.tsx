import Link from 'next/link'
import Image from 'next/image'
import { getSiteConfig, instagramHandle } from '@/app/lib/siteConfig'
import { getFooterData } from '@/app/lib/footerData'
import { splitBrand } from '@/app/lib/constants'
import { navLinks, navRow, type NavLink } from '@/app/constants/nav'
import styles from './Footer.module.css'

// The Rising Roots footer: three columns (links, mark with bio, "Let's connect"),
// a strip of featured photos, then a bottom row. Everything the database supplies
// comes through getFooterData, which cannot throw, so a read error costs the page
// the strip and the extra links, never the page.

// Built from the shared nav constants so a route rename cannot leave the footer
// pointing at a dead link. The first five are the nav row, in its order; the rest
// are the pages that only the menu carries.
const MENU_ONLY = ['Services', 'Testimonials', 'Blog', 'Contact']
const FOOTER_LINKS: NavLink[] = [
  ...navRow.left,
  ...navRow.right,
  ...MENU_ONLY.flatMap((label) => navLinks.filter((l) => l.label === label)),
]

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <li>
      <a href={href} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label={label}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {children}
        </svg>
      </a>
    </li>
  )
}

export default async function Footer({ logoUrl }: { logoUrl?: string }) {
  const year = new Date().getFullYear()

  const [site, footer] = await Promise.all([getSiteConfig(), getFooterData()])
  const brand = splitBrand(site.title)
  const bio = site.footerBio.trim()
  const links = [...FOOTER_LINKS, ...footer.builderLinks]
  const hasSocials = Boolean(site.instagramUrl || site.tiktokUrl || site.pinterestUrl)

  return (
    <footer className={styles.footer}>
      <div className={styles.columns}>
        <nav className={styles.links} aria-label="Footer navigation">
          <h2 className={styles.script}>Where to next?</h2>
          <ul className={styles.linkList}>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.link}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.about}>
          <Link href="/" className={styles.brand} aria-label={`${site.title}, home`}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={site.title} className={styles.brandLogo} />
            ) : (
              <>
                <span className={styles.brandMark}>{brand.mark}</span>
                {brand.sub && <span className={styles.brandSub}>{brand.sub}</span>}
              </>
            )}
          </Link>
          {bio && <p className={styles.bio}>{bio}</p>}
          <Link href="/contact" className={styles.button}>
            Work with me
          </Link>
        </div>

        <div className={styles.connect}>
          <h2 className={styles.script}>Let&apos;s connect</h2>
          <p className={styles.label}>{site.footerLocation}</p>
          <a href={`mailto:${site.email}`} className={styles.link}>
            {site.email}
          </a>
          {site.instagramUrl && (
            <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
              {instagramHandle(site.instagramUrl)}
            </a>
          )}
          {hasSocials && (
            <ul className={styles.socials} aria-label="Social links">
              {site.instagramUrl && (
                <SocialIcon href={site.instagramUrl} label="Instagram">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </SocialIcon>
              )}
              {site.tiktokUrl && (
                <SocialIcon href={site.tiktokUrl} label="TikTok">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.22 8.22 0 0 0 4.82 1.55V6.79a4.85 4.85 0 0 1-1.05-.1z" />
                </SocialIcon>
              )}
              {site.pinterestUrl && (
                <SocialIcon href={site.pinterestUrl} label="Pinterest">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
                </SocialIcon>
              )}
            </ul>
          )}
        </div>
      </div>

      {footer.stripPhotos.length > 0 && (
        <div className={styles.strip} aria-hidden="true">
          {footer.stripPhotos.map((photo) => (
            <div key={photo.id} className={styles.stripPhoto}>
              <Image src={photo.src} alt="" fill sizes="(max-width: 768px) 34vw, 17vw" className={styles.stripImg} />
            </div>
          ))}
        </div>
      )}

      <div className={styles.bottom}>
        <p className={styles.copy}>&copy; {year} {site.title}</p>
        {(footer.hasTerms || footer.hasPrivacy) && (
          <ul className={styles.legal}>
            {footer.hasTerms && (
              <li>
                <Link href="/terms-and-conditions" className={styles.legalLink}>
                  Terms and conditions
                </Link>
              </li>
            )}
            {footer.hasPrivacy && (
              <li>
                <Link href="/privacy-statement" className={styles.legalLink}>
                  Privacy statement
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>
    </footer>
  )
}
