# Rising Roots section map

The design reference is Tynnell's own Showit project, "My Rising Roots by Wonderlik Webdesign" (preview: https://tynnell-hollins-photography-2.showitpreview.com/home). The decision (2026-11-05) is to rebuild its look in this site, not to move to Showit. This file maps every section of the template to what the page builder already has, so only real gaps get built.

The template's copy and photos are placeholders (Cape Town, "Josie", "A review goes here"). Nothing here should copy them. Tynnell's own content goes in through the builder.

## Template pages and sections

| Page | Sections, in order |
|---|---|
| Home | hero, pain-points, approach (stats + intro), gallery slider, sticky reviews (3 panels over a pinned photo), offerings, about-personal, portfolio (horizontal album strip), freebie, reviews-2, call-to-action |
| About me | hero, intro, my-why, my-story, approach, "things that make my heart full" (3 sticky panels), personal quiz, review + CTA |
| My work | hero, intro, weddings albums, review, portraits albums, about, reviews, call-to-action |
| Portraits | hero, social proof (stats + review), session types 01-03, collections, couple / maternity / newborn price cards, next steps, review, FAQ, contact form |
| Wedding photography | hero, intro, review, pain-points, solution checklist, gallery, collections + pricing, "what's included" (4 sticky panels), next steps, reviews, portfolio strip, contact form, FAQ |
| Contact | hero, get in touch, intro, contact form, contact details, FAQ, review |
| Blog | hero, featured post, post grid, freebie, pagination, about, newsletter |

Every page shares: a transparent menu that turns solid on scroll, a full-screen numbered menu (01 Home to 07 Contact) with two "Work with me" cards, and the footer.

## Already covered by existing blocks

| Template section | Builder block |
|---|---|
| Hero with wordmark, tagline, CTA, corner labels | `Hero` (has `cornerLeft` / `cornerRight`) |
| Gallery slider with next / previous | `PhotoCarousel` |
| Offerings, session types, price cards, wedding collections | `Services`, `LiveServices` |
| About, intro, my story, next steps | `SplitImageText`, `RichText` |
| Reviews, including a pinned photo beside the quotes | `Testimonials`, `LiveTestimonials` (`stickyPhotoScroll`) |
| FAQ | `Accordion` |
| Contact form | `ContactFormBlock` (template adds partner's name and location fields) |
| Call to action | `CTA` |
| Blog listing and featured post | `LiveBlog` |
| Contact details, socials | `SocialLinks`, `RichText` |
| Personal quiz | `RichText` or `Accordion` |
| Sections sliding over the one before | `scrollOverlap` on every block |
| Menu that changes on scroll | `Navbar` (`scrolled` state) |

## Gaps, in build order

1. **Stats row.** DONE: `Stats Row` block (PR #138).
2. **Horizontal album strip.** DONE: `Album Grid` block, Layout: Scrolling strip.
3. **Sticky panels over a pinned photo, for any content.** DONE: `Sticky Panels` block (shares its scroll tracking with `LiveTestimonials`).
4. **Numbered full-screen menu with "Work with me" cards.** DONE for phones and tablets; cards are edited in Site Settings > Menu cards. Open: Rising Roots also shows the menu button on desktop, where this site shows the full link row instead.
5. **Email capture (freebie and newsletter).** DONE: `Email Signup` block (Newsletter or Freebie). Subscribers go to Resend contacts (into a segment if `RESEND_SEGMENT_ID` is set); a Freebie signup is emailed the guide set in Site Settings > Freebie. Open: the guide PDF itself, to be written with Tynnell. Site Settings > Freebie has an Upload a PDF button that stores it in the R2 media bucket and fills in the link; press Save Changes to start sending it.
6. **Fonts.** Nyght Serif Light + Light Italic for headings, "Nostalgia" script. Needs a license check before self-hosting, then a Postgres enum migration (see CLAUDE.md, "Payload selects are backed by real Postgres enums").
7. **Palette.** Adds `#ECE9E0`, `#2E2A19`, `#D4D1C4`, `#8C8569`, `#8B6548` to the live `#E4E2D8` / `#6F6950` / `#242424`. Settable in `/design` today, no code.

Every new style option follows the style-exposure convention in CLAUDE.md (TYN-338): an adjustable control, never a hardcoded value.
