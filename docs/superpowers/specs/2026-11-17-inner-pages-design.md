# Rising Roots inner pages (step 4): design

Date: 2026-11-17. Status: approved by Alex 2026-11-17; being built (see the plan beside this file).

## Intent and the why

Make the inner pages of the Tynnell Hollins site follow the Rising Roots
reference (https://risingroots.showit.site/) the way the Home now does. Alex
chose "match 100%" on 2026-11-13 and said to follow Rising Roots' own page
pattern. The reference is a small site where every inner page is the same few
sections in a different order, so the work is a handful of reusable blocks and
five composed pages, not five bespoke pages.

Cormorant Garamond stays the stand-in for the paid Nyght Serif. Real copy,
prices, packages, steps, answers and photos come from Tynnell, never from us.

## The pages

Addresses (Alex confirmed 2026-11-17):

| Page | Address | How it exists |
|---|---|---|
| Wedding photography | `/wedding-photography` | New builder page, served by the existing catch-all route |
| Portraits | `/portraits` | New builder page, same way |
| My work | `/portfolio` | Existing promoted builder page, reworked |
| About | `/about` | Existing promoted builder page (id 33), reworked |
| Contact | `/contact` | Existing promoted builder page (id 39), reworked |
| Albums | `/portfolio/[slug]` | Unchanged |

The nav points "Wedding photography" at `/wedding-photography` and "Portraits"
at `/portraits`. The old `/portfolio/weddings` and `/portfolio/portraits`
redirect to them (permanent redirects in `next.config.mjs`).

Section order, from the reference. Every section marked (T) needs Tynnell's
words and stays hidden from visitors until filled.

**Wedding photography:** hero and intro; tagline lines plus a "Now booking"
button (T); location line and a testimonial (T); benefits list (T); approach
(T); priced packages, up to three (T); what's included, three columns (T);
booking steps, numbered (T); testimonial slider; wedding album cards; wedding
inquiry form; closing call to action (T); FAQ (T).

**Portraits:** hero and intro; reviews stat (T); testimonial; "choose your
session" cards (Couple, Maternity, Newborn, Family) linking down the page or to
albums (T); philosophy (T); packages per session (T); booking steps (T);
"Sounds good?" call to action; testimonial; FAQ (T); portrait inquiry form;
closing call to action (T). No album cards.

**My work:** two category tiles (Weddings, Portraits); intro; wedding albums;
portrait albums; About teaser; testimonial slider; closing call to action.

**About:** intro; origin story; testimonial; philosophy; "things that make my
heart full" list; closing testimonial. The reference's quiz is out (see
non-goals).

**Contact:** hero; wedding inquiry form and portrait inquiry form (a visitor
picks which); contact details; FAQ; testimonial.

## Goals

- Each page reads like its Rising Roots counterpart: same sections, same order,
  our fonts, colors and photos.
- Everything stays editable by Tynnell in the builder. She changes words,
  prices and order herself.
- No invented content ever reaches a visitor. Sections awaiting her words are
  hidden, exactly as on the Home.
- The inquiry forms collect what the reference collects, so Tynnell gets the
  same information a Rising Roots photographer would.

## Non-goals

- The reference's "find your session" quiz on About. It needs logic and copy
  Tynnell has not supplied; revisit in step 5 or later.
- Terms and Privacy pages. They need her real legal text; tracked separately.
- Booking and Stripe checkout (`/book`). Stays as it is.
- Motion polish beyond what blocks already do. That is step 5.
- Phone-width perfection in this step. We check phone width this time, but
  fine-tuning waits for step 5.

## Anti-goals (would be a failure even if it technically works)

- A page that goes live half-empty or with placeholder numbers, prices or
  quotes. New blocks must default to no invented content (the Stats Row
  default numbers on newly added blocks are a known miss to avoid repeating).
- Tynnell needing a developer to change a price or a step.
- Breaking existing links or search results: old gallery addresses must
  redirect, not 404.
- Weakening the contact form's spam protection (honeypot and Turnstile) or its
  rate limit.

## Constraints

- Puck page builder (`app/builder/puck.config.tsx`); blocks are data, pages are
  rows in the `pages` table with a draft.
- Hide-until-filled pattern: per-block switch, `GateEmpty`, pure rules in
  `app/builder/emptyRules.ts`; new blocks default it on, old blocks off.
- Strict TDD for every block, form variant and redirect (test first, watch it
  fail). The project's convention: behaviour tests yes, CSS-text tests only for
  past-bug contracts (Alex's "keep tests lean" feedback).
- New pages are written as unpublished drafts. The builder's Publish button
  publishes every page's draft and every unpublished page at once, so we never
  leave stray drafts around when Alex publishes; publishing the new pages is a
  separate, explicit step he approves.
- `COMING_SOON=true` is still on in production, so visitors do not see any of
  this until launch; admins do.
- No em dashes anywhere, and no `Co-Authored-By` line in any commit message
  (project rules in CLAUDE.md).
- Production deploy rule: push main alone, confirm the build, then sync
  dev/qa/staging.

## Approaches considered

- **A. Pages as data from blocks.** Add the missing blocks and two form
  variants (all hide-until-filled), then write each page's draft with a script,
  as the Home was done. Fully editable by Tynnell; most new block work, but the
  blocks are reusable. **Chosen by Alex on 2026-11-17.**
- **B. Hand-coded pages.** Fastest exact match, but Tynnell could not edit
  anything. Rejected: it defeats the reason she left Pixieset.
- **C. One large "service page" block.** Simple to fill in, but cannot be
  rearranged and every layout change needs code. Rejected.

## How it is built (approach A)

### New blocks

All new blocks: `hideUntilFilled` defaults on, blank defaults (no invented
text, numbers or prices), an empty rule in `emptyRules.ts`, a test file next to
the block, and registration in the "content" category.

- **Packages.** Heading, up to three cards: name, price line, short
  description, bullet list, optional button (text and link). A card counts as
  filled when it has a name and a price line. Prices are Tynnell's text, never
  computed. Block is empty when no card is filled.
- **Steps.** Heading, up to six numbered steps (title and sentence). Numbers
  are generated (01, 02, ...), not typed. Empty when no step has a title.
- **FeatureColumns.** Heading and up to four columns, each a title and a list
  of lines. Serves both "what's included" and the benefits list (one column
  renders as a list). Empty when no column has a title and a line.
- **InquiryForm.** Replaces the Contact Form block for the new pages. A `kind`
  switch (`wedding` or `portrait`) picks the field set. Reuses the shared
  Turnstile, honeypot, date bounds from `/api/public-booking-dates`, and the
  existing success handling. Wedding fields: name, email, partner's name,
  wedding location, wedding date, how did you find me, message. Portrait
  fields: name, email, which session, preferred date, location, how did you
  find me, message. (Field lists are from the reference; the builder may trim
  to fit our send route, see below.)

### Changed existing blocks

- **Accordion** gets the hide-until-filled switch (off by default on saved
  blocks), with an empty rule: empty when no item has both a title and a body.
- **PathChoice** is reused for the Portraits session menu; its cap of two cards
  rises to four (a change to the block's field only, existing pages unchanged).
- **LiveTestimonials** (slider), **AlbumGrid**, **CTA**, **Statement**,
  **StatsRow**, **SplitImageText**, **SpecialtiesReveal** are reused as they
  are.

### The inquiry send route

`POST /api/contact` today requires name, email, phone, contact preference,
session type, date and message, so the shorter reference forms cannot post to
it. Decision: accept an optional `kind` (`wedding`, `portrait`; absent means
the current general form, unchanged). For a `kind`, phone and contact
preference are not required; the kind's own required fields are validated;
length limits, Turnstile, honeypot and rate limiting apply as today. The email
to Tynnell lists the fields that were sent, with the partner's name or session
shown where present. Existing general form behaviour and its tests stay green.

### Pages as data

Each page gets a layout builder (`app/builder/<page>Layout.ts`, pure, like
`homeLayout.ts`) and a template in `templates.ts`; a script
`scripts/write-page-drafts.ts` backs up rows, refuses to overwrite a saved
draft, uses strict TLS, and writes only `draft_content`. New pages
(`wedding-photography`, `portraits`) are inserted unpublished with the blank
layout; existing pages (About, My work, Contact) get a draft that carries over
their current words by position, as the Home script does.

### Nav and redirects

`app/constants/nav.ts` points the two links at the new addresses.
`next.config.mjs` redirects `/portfolio/weddings` to `/wedding-photography` and
`/portfolio/portraits` to `/portraits` (permanent). The currently promoted
builder pages at those two old routes are left in the database, unused.

## Delivery in four PRs

1. New blocks and the `kind` form route, with tests, plus the Wedding page.
2. Portraits.
3. My work, About, Contact.
4. Nav links and redirects.

Each is TDD, reviewed, merged to main, synced, then verified in Chrome. Drafts
are written only after Alex approves each, and published only on his explicit
yes.

## My calls (Alex can reverse any of these)

- `/portfolio/family` also redirects to `/portraits`, since Family is a session
  type on the Portraits page in the reference. If Alex prefers to keep a Family
  gallery page, drop that redirect.
- Inquiry forms post to the existing contact route with a `kind`, rather than a
  new route, to keep one place for spam protection and email sending.
- The quiz is deferred.
- Instead of the reference's Google-reviews stat, Portraits uses our existing
  Stats Row hidden until Tynnell supplies a real number.

## What Tynnell needs to supply

Wedding and portrait intro lines, taglines, benefits, approach text, packages
(names, prices, what each includes), booking steps, FAQ answers (about six each),
the Portraits session menu copy and photos, origin story and philosophy for
About, contact details to show, testimonials, and album covers. Until each is
filled, its section stays hidden.

## Left to the builder

Exact visual styling of each new block against the reference (spacing, number
styling, card borders), the precise field lists on the inquiry forms within the
limits above, empty-rule edge cases (whitespace-only text), and test file
layout.

## Saving this work

Alex asked for the work to be saved for reuse (2026-11-17). Settled: it is kept in the repo, as this spec and the implementation plan beside it, both committed. It is not packaged as a Claude plugin.
