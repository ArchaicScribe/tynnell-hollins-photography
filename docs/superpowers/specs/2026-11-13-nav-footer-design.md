# Nav, menu and footer: match Rising Roots (step 2 of 5)

Date: 2026-11-13. Status: draft for review.
Part of the "match Rising Roots 100%" project (see the project order below).

## Intent and why

Alex wants the live site to match the Rising Roots Showit reference
(https://risingroots.showit.site/) "100% all the way". The site chrome (the nav,
the full-screen menu and the footer) is on every page, so it is step 2, right
after the heading font bug (PR #155) that made the serif render at all.

The code is already shaped like the reference: a centred mark with link rows on
either side, a script "Inquire now" button, a numbered full-screen menu with
"Work with me" photo cards, and a multi-part footer. What remains is the look
(type, spacing, colour, hairline), one structural change (which links sit in the
row, and the menu button on desktop) and a footer re-layout.

Everything is built for Tynnell's real content. The reference's copy, photos and
stats belong to another photographer (a Cape Town template). We match structure,
type, spacing and motion; words and pictures come from Tynnell.

## Project order (for context, each step gets its own design)

1. Heading font bug. DONE (PR #155).
2. **This document:** nav, menu, footer, chrome type scale.
3. Home page: hero, story sections, stats, photo strip, testimonials.
4. Inner pages: About, Wedding photography, Portraits, My work, Contact.
5. Motion and details.

## Goals

- The nav row matches the reference: five links either side of a centred mark,
  title-case serif, no tracking, a script "Inquire now", and a menu button that
  is visible on desktop as well as mobile.
- The full-screen menu matches the reference: photo cards left, olive panel with
  a numbered list right, a "Work with me" button, and a script "close menu".
- The footer matches the reference: three columns (link list, centred mark with
  bio and button, "Let's connect" with email and socials), then a photo strip,
  then a bottom row.
- Every word Tynnell might want to change is editable in Site Settings or
  `/design`, not hardcoded (CLAUDE.md style-exposure convention, TYN-338).
- Chrome type sizes are re-checked against Cormorant Garamond, which is the
  stand-in for the reference's commercial Nyght Serif.

## Non-goals

- Home hero content (corner labels "Based in ...", "Available worldwide", the
  round badge at the bottom of the hero) belongs to step 3.
- Page body copy and page-level type belong to steps 3 and 4.
- Buying or embedding Nyght Serif Light. Cormorant stays; swapping later is one
  font entry.
- Rebuilding the nav or footer as page-builder blocks. Rejected: much larger,
  risks every page, and nothing in the reference needs it.
- New `/design` fields. The footer and nav share the existing navbar colour
  variables (see Decisions).

## Anti-goals (a failure even if it technically works)

- Nav text unreadable on any page (white text on the bone ground).
- Any loss of the menu's keyboard behaviour: focus trap, Escape to close,
  focus returns to the opener, scroll lock.
- A page that errors because the footer's database read failed.
- A link in the nav or footer that points nowhere.

## Constraints

- Next.js 16, Payload v3, CSS Modules. No Tailwind. No em dashes anywhere.
- Fonts come from next/font and are referenced through the CSS variables
  (`--font-serif`, `--font-sans`, `--font-label`, `--font-script`). Never name a
  family directly (that was the PR #155 bug).
- Colours come from the theme variables. The nav already reads
  `--color-nav-bg` / `--color-nav-text`, falling back to the button colours
  (TYN-352). Keep that fallback.
- Schema changes need a block in `scripts/migrate-db.mjs` plus a regex test in
  `scripts/migrate-db.test.ts`, and a `payload-types.ts` regeneration. Never
  hand-edit the types.
- Tests first (TDD). Existing tests to update: `Navbar.test.tsx`,
  `Navbar.module.css.test.ts`, `MobileMenu.test.tsx`. The footer has none, so
  add them.
- Never route a user into the raw Payload admin.

## Approaches considered

- **A. Restyle the existing components in place (chosen by Alex).** Edit
  `Navbar`, `MobileMenu` and `Footer`. Layout is fixed in code; words and photos
  are Tynnell's, edited in Site Settings.
- B. Rebuild nav and footer as Puck blocks. Tynnell could rearrange everything,
  but it is far larger and adds risk to every page. Rejected.

Alex also picked, for the nav row, **option B of two**: mirror the reference's
labels and put the remaining pages in the menu (the alternative was keeping our
own links, restyled).

## Decisions

### Nav row (desktop)

Left to right: `Home`, `About me`, `Wedding photography`, centred mark,
`Portraits`, `My work`, script `Inquire now`, menu button.

| Label | Goes to |
|---|---|
| Home | `/` |
| About me | `/about` |
| Wedding photography | `/portfolio/weddings` |
| Portraits | `/portfolio/portraits` |
| My work | `/portfolio` |
| Inquire now | `/contact` |

- This row is its own constant, separate from `navLinks`, because its labels
  differ from the menu and footer (for example "Wedding photography" in the row,
  "Weddings" under Portfolio in the menu). Builder-page links flagged
  show-in-menu (`getBuilderNavLinks`) do NOT go in the row; they appear in the
  menu and footer only, so the row stays at five.
- Row link type: title-case, serif role (`--font-serif`), about 18px at the
  reference, weight 400, no letter-spacing, colour the nav text colour.
  Cormorant has a smaller x-height than Nyght Serif, so the builder must compare
  on a preview and may need about 19 to 20px to match the optical size. That
  number is the builder's call after a side-by-side.
- Centre mark: the logo from `/design` (`theme.logoUrl`) when set, about 34 by
  42px as in the reference. When no logo is set, the existing two-line text
  wordmark stays as the fallback. Tynnell uploads the logo; it is not a
  blocker.
- Menu button: visible at every width (today it is hidden above 1024px). Opens
  the same full-screen menu. The label "menu" in script beside the icon is a
  builder call after measuring the reference.
- Below the existing collapse breakpoint (1024px) the link rows hide and the
  nav shows mark, "Inquire now" and the menu button, as today.
- A thin hairline runs along the bottom of the nav while it is transparent over
  a hero, as in the reference.

### Nav background

- Transparent over a hero, olive (`--color-nav-bg`, falling back to the button
  colour) once scrolled. This already exists.
- NEW: on pages that do not start with a full-bleed photo the nav is solid from
  the first paint, so white text never lands on the bone ground. The mechanism
  (for example the hero block marking the page, or a route list) is left to the
  builder, but the builder must first confirm how inner pages look today and
  record it. Default is solid; transparent is opt-in by the hero.

### Full-screen menu

- Desktop and mobile share the one `MobileMenu` component. Rename is optional
  and out of scope.
- Layout at desktop: two photo cards on the left (from `site.menuCards`, already
  editable in Site Settings, max two), an olive panel on the right with the
  numbered list (`01.` ...) and a "Work with me" button below it. When there are
  no cards the panel simply takes the width (existing behaviour, keep).
- Links: all of `navLinks` plus builder-flagged pages, numbered in order. The
  label `About` becomes `About me` in `navLinks` so the menu and footer match
  the reference. Portfolio keeps its expandable children (Portraits, Family,
  Weddings), which is where Family stays reachable.
- The header of the open menu shows a script "close menu" and an X.
- Keep all existing accessibility behaviour (see anti-goals).

### Footer

Three parts on the olive ground, in this order:

1. **Three columns.** Left: a script heading "Where to next?" over a single
   vertical list. Centre: the logo (or wordmark fallback), a short bio, and a
   "Work with me" button to `/contact`. Right: a script heading "Let's connect",
   the email, the Instagram handle, and social icons (Instagram, TikTok,
   Pinterest when a URL is set).
2. **Photo strip.** Up to six photos, edge to edge in a row. Source: photos
   marked featured, newest first. The strip is hidden entirely when there are no
   featured photos. (There are none today; Tynnell marks them.)
3. **Bottom row.** Copyright, then "Terms and conditions" and "Privacy
   statement" links, then no designer credit.

- Link list: Home, About me, Wedding photography, Portraits, My work, Services,
  Testimonials, Blog, Contact, then any builder-flagged pages. One column. Built
  from the same constants as the nav so a rename cannot leave a dead link.
- Terms and Privacy links appear only when a published builder page exists at
  `/terms-and-conditions` and `/privacy-statement`. We do not invent legal text.
  Tynnell supplies it, then publishes those two pages in the builder.
- Colours: the footer uses the nav colour variables (`--color-nav-bg`,
  `--color-nav-text`, each falling back to the button colours), so `/design`
  controls the nav and footer together and no new design field is needed.
- Hardening: the featured-photos query must not be able to take the page down.
  Wrap it so a database error renders the footer without the strip.

### Editable text (Site Settings, TYN-338)

Two new fields on the SiteConfig global, replacing a hardcoded constant and a new
string:

- `footerBio` (text, shown in the footer centre column).
- `footerLocation` (text, replaces the hardcoded `STUDIO_LOCATION` string, shown
  with the email under "Let's connect"). Default stays the current value.

Each needs: global field, `getSiteConfig` mapping with a default, the Site
Settings page and its save route allowlist, a `migrate-db.mjs` block
(`site_config.footer_bio`, `site_config.footer_location`, nullable varchar), and
a migration test. The bio default is empty and the bio paragraph is omitted
when empty, so nothing is invented.

"Work with me" and "Where to next?" / "Let's connect" are fixed labels, not
settings (the reference uses them as design, and nothing suggests Tynnell wants
to reword them). Revisit if she asks.

### Type scale (chrome only)

Re-check every font size, weight and tracking in `Navbar`, `MobileMenu` and
`Footer` against the reference with Cormorant in place, on a preview deploy, and
adjust. Sizes in the existing CSS were set while the serif was falling back to
Times and must not be trusted. Reference measurements already taken: nav links
18px, colour #ECE9E0; small caps labels Barlow 12px, weight 300, letter-spacing
1.8px, uppercase; footer list and labels follow the same small-caps style.

## Delivery

Two PRs, in this order, each reviewed and verified on production:

1. Nav and menu (including `About me` rename, always-visible menu button,
   hairline, solid-on-no-hero behaviour, type retune).
2. Footer (layout, strip, bottom row, the two Site Settings fields and their
   migration, hardening).

## Calls made while writing this (not yet Alex's, marked so they can be checked)

- The menu's "Work with me" button goes to `/contact`, the same as the footer's.
- The nav row has no Portfolio dropdown any more. The old desktop dropdown code
  is removed; Portfolio's children (Portraits, Family, Weddings) stay reachable
  only as the expandable entry in the menu.
- The Footer does not receive builder links today, so it reads them itself, in
  the same guarded read as the featured-photos query (a failure drops those
  entries, never the page). That read also decides whether the Terms and Privacy
  links show. Duplicates are dropped if those two pages are also flagged
  show-in-menu.

## Left to the builder

- The exact hero-detection mechanism for the transparent nav.
- Pixel values (spacing, hairline weight and opacity, transitions, breakpoints
  other than the existing 1024px), measured against the reference.
- Whether the "menu" word shows next to the button.
- Whether to rename `MobileMenu`.

## Needs Tynnell (does not block building)

- Her logo, uploaded in `/design` (the mark falls back to text until then).
- The footer bio and her location line.
- Photos and titles for the two menu cards.
- Terms and conditions and Privacy statement text, then published as builder
  pages.
- Featured photos, so the footer strip has something to show.
