# Home page: match Rising Roots (step 3 of 5)

Date: 2026-11-16. Status: approved by Alex.
Part of the "match Rising Roots 100%" project (nav, menu and footer are done:
PRs #157 and #158). The reference is https://risingroots.showit.site/.

## Intent and why

Alex wants the live site to match the Rising Roots reference "100% all the way".
The Home page is the front door, so it is step 3, right after the site chrome.

The Home page today is already a builder page (pages row id 43, slug
`home-builder`, flagged `isHomepage`, published). It has six blocks: a freeform
hero, a freeform "A Few Favorites" heading, a portrait grid, a freeform About
split, live testimonials and a freeform call to action. The hard-coded home in
`app/(site)/page.tsx` is only a fallback for when no homepage page exists.

The goal is to rebuild that page so it follows the reference section by section
(order, type, spacing), made of blocks Tynnell can edit in `/builder/home-builder`.

The reference's copy, photos and numbers belong to another photographer (a Cape
Town template). We match structure, type, spacing and motion. Words and numbers
must come from Tynnell. Never invent a stat, a testimonial or a bio.

## Decision from Alex

**Sections that need Tynnell's words are hidden until she fills them in.** On the
public page a section with no real text renders nothing. In the editor the same
section shows a dashed "Add your words here" outline, so she can find it and fill
it in.

## Reference structure (top to bottom)

Read from the live reference on 2026-11-16. Layout, spacing and motion could not
be measured, only the structure and copy shape.

1. Hero: small corner labels ("Available worldwide", "Based in ..."), a button
   ("Let's capture your day"), a one-line tagline.
2. Emotional intro: a text-only block, a bold lead-in, a closing line, then a
   large heading.
3. Credibility: a heading, three stats (reviews, weddings photographed, years),
   a "Let's chat" button.
4. "That's where I come in": a short intro, a pull quote, a heading, a button.
5. "Kind words": a testimonial slider.
6. "What brings you here today?": two cards, one for weddings, one for portraits.
7. Pull quote ("To love and to hold, forever and always") and an about teaser
   with a "Get to know me" button.
8. Portfolio: "A collection of previous love stories", three gallery cards, a
   "View more galleries" button.
9. Freebie: a venue-guide offer with a newsletter sign-up.
10. Testimonial slider with numbered controls (01, 02, 03).
11. Closing call to action: a heading, a subhead, a "Get in touch" button.

## Goals

- The Home page follows the reference's section order, built from builder blocks.
- Every section whose words come from Tynnell is hidden on the public page until
  those words exist (see "Hidden until filled").
- Everything Tynnell might change (words, photos, buttons, alignment, spacing,
  background) is a block field, not hardcoded (CLAUDE.md style-exposure
  convention, TYN-338).
- Existing pages that use the changed blocks do not change (see "Safety for other
  pages").
- Keep the words already on the live Home page (they are Tynnell's, written
  earlier); do not replace them with reference copy.

## Non-goals

- Inner pages (About, Wedding photography, Portraits, My work, Contact): step 4.
- Motion beyond what the blocks already do: step 5.
- Buying or embedding the reference's commercial serif. Cormorant stays.
- Changing the nav or footer.
- Fixing the invented defaults of blocks other pages already use (for example
  Stats Row's "5 star / 150+ / 7+"). They only apply to a newly added block;
  noted as a follow-up.
- A second testimonials section. The reference repeats its slider; we show one.
  (My call.)

## Anti-goals (a failure even if it technically works)

- Any invented stat, quote, name or bio on a page a visitor can see.
- A section that shows an empty frame, a lone heading, or "Lorem" text on the
  public page.
- A tidy-looking page that Tynnell cannot edit.
- A change to About, Services, Portfolio, Blog or Contact as a side effect.
- The nav going solid over the hero (the first block must stay a Hero with a
  photo so `markNavHero` flags it).

## Constraints

- Next.js 16, Payload v3, Puck 0.20.2, CSS Modules for site code, inline styles
  inside `puck.config.tsx` as the existing blocks do. No Tailwind. No em dashes
  anywhere, including copy and comments.
- Fonts and colours only through the theme variables (`--font-heading`,
  `--font-body`, `--font-script-role`, `--color-*`). Never name a font family
  directly (the PR #155 bug).
- Puck's preview iframe stays disabled (`iframe={{ enabled: false }}`).
- Any new block needs: the component, its place in `categories`, tests, and, if
  it is a client component used in a custom field, nothing else (no importMap
  change; importMap is for Payload admin components only).
- No schema change expected. If one becomes necessary: block in
  `scripts/migrate-db.mjs`, a regex test in `scripts/migrate-db.test.ts`, then
  `npm run generate:types`.
- Tests first (TDD), kept lean: behaviour tests, CSS-text tests only as
  contracts tied to a past bug (Alex's feedback, 2026-11-16).
- The live Home page is database data. Writing it directly skips
  `revalidatePath`; the page revalidates every 120 seconds anyway, so this is
  acceptable. Back up the page first.

## Approaches considered

- **A. Rebuild the Home from existing blocks, plus a few small new ones
  (chosen by Alex).** Reuse Hero, Stats Row, Split Image + Text, Album Grid,
  Email Signup, Live Testimonials and Call to Action. Add only what has no
  equivalent. Hidden-until-filled is a small shared rule. Trade-off: type and
  spacing come from shared block styles, so they are tuned through each block's
  own options rather than by changing global styles.
- B. New Home-only blocks styled exactly like the reference. Most control, but
  duplicates stats, testimonials and gallery blocks Tynnell already knows and
  grows the code. Rejected.
- C. Hard-code the Home in code. Tynnell could not edit it, which breaks the
  style-exposure convention. Rejected.

## Design

### New blocks (small)

1. **Statement** (`Statement`, Content category). A centred or left block of
   large serif text with an optional bold lead-in line, a body, a closing line,
   and an optional pull-quote style (script font). Fields: lead-in, text, closing
   line, style (Text / Pull quote), alignment, plus the standard style and
   responsive fields. Used for the emotional intro (2) and the pull quote (7).
2. **Path Choice** (`PathChoice`, Content category). A heading and up to two
   cards, each with a photo, a label and a link. Fields: heading, cards
   (photo, label, link), plus standard style fields. Used for "What brings you
   here today?" (6).

### Changes to existing blocks (all additive, all optional fields)

- **Stats Row:** optional heading above and optional button below (reference
  section 3). Existing instances have neither, so they render as before.
- **Album Grid:** optional heading above and optional button below (reference
  section 8), so the heading hides together with the albums.
- **Live Testimonials:** a "Slider" layout option with numbered controls
  (reference sections 5 and 10), alongside the two existing layouts. Default
  stays the current layout.
- **Hero:** optional round badge is out of scope until Alex confirms what it
  looks like (see Questions). Corner labels, eyebrow, subheading and button
  already exist.

### Hidden until filled

**Opt-in per block, off for every existing block (my call).** Each block that can
hide gets a "Hide until filled in" switch. It is off by default, so every
existing page renders exactly as it does today (the live site has no
testimonials and almost no albums, so a global rule would blank the promoted
Testimonials page and others). The Home page and the new `home` template turn it
on. The two new blocks (Statement, Path Choice) default it on.

One shared helper in `app/builder/` decides "is this block empty" from the
fields that carry Tynnell's words (per block). With the switch on:

- empty and not editing: nothing at all (no section padding either);
- empty and editing (`puck.isEditing`, available on render props in Puck 0.20):
  a dashed outline reading "Add your words here: <what this section is>";
- filled: the block as today.

With the switch off the block renders as it does today, empty or not.

What counts as empty, per block. A lone heading with nothing under it is empty
(the anti-goal), except where the heading is the content:

| Block | Empty when |
|---|---|
| Statement | lead-in, text and closing are all blank |
| Path Choice | no card has both a label and a link |
| Stats Row | no stat has a number (heading and button alone do not count) |
| Split Image + Text | body and button text are both blank |
| Album Grid | the live category has no albums (heading and button hide with it) |
| Email Signup | heading and text are both blank; the Freebie type is also empty until a guide link is set in Site Settings, otherwise visitors would sign up and receive nothing (the builder picks the mechanism; the requirement is that the link is not exposed in page source) |
| Live Testimonials | there are no testimonials |
| Call to Action | heading is blank |

Hero is never hidden (it carries the first-block nav behaviour and the page
needs a front door).

### Safety for other pages

Because hiding is opt-in, no existing page changes. A test pins this: a block
saved without the switch renders when empty, for each block that gained it.

### The page itself

Rewrite the Home in the reference's order:

1. Hero. A real Hero block replaces the freeform hero, because only a first
   `Hero` or `FullWidthImage` block marks the nav transparent. The photo,
   heading and button are kept; the layout may differ visually from the freeform
   hero (that is the point). Corner labels left blank for Tynnell.
2. Statement: emotional intro (blank, hidden).
3. Stats Row with heading and button (numbers blank, hidden).
4. Split Image + Text, "That's where I come in" slot (blank, hidden).
5. Live Testimonials, Slider layout (hidden while there are none).
6. Path Choice (blank, hidden).
7. Statement (pull quote, blank, hidden) then Split Image + Text with the About
   copy already on the live page ("Hey, I'm Tynnell Hollins ...") and its
   "My Story" button.
8. Album Grid with the existing "A Few Favorites / Every frame tells a story"
   words as its heading (hidden until albums exist).
9. Email Signup, Freebie type (blank, hidden).
10. Call to Action with the existing "Your Story Deserves to Be Captured" copy.

The existing Hero, About and call-to-action words are carried over unchanged.

The `home` starter template in `app/builder/templates.ts` follows the same
section list but ships fully blank (no carried-over words, no invented stats or
"Stay in the loop" copy), with the hide switch on.

### Rollout (my call)

The database is shared between production and Vercel previews, so writing the
new page over page 43 before the new blocks are deployed would make production
render block types it does not know. Order:

1. Build and merge the blocks and the template (no data change).
2. Write the new Home as a separate, unpublished page (new slug) so it can be
   previewed through the builder's preview mode on the deployed site.
3. After Alex looks at it and says go, swap it into page 43 (backup of page 43
   saved first, through Payload's local API so hooks run) and confirm the
   production page. This step writes production data, so it waits for Alex's
   explicit yes.

The Testimonials slider shows its numbered controls only with two or more
testimonials; with exactly one it falls back to the plain layout (my call).

### Visual match

Type scale, heading colour and spacing are tuned against the reference on a
Vercel preview, side by side with Alex, using the measurements already taken
(headings 48px with 57.6px line height in the olive heading colour, script
subline 35px). The reference's own spacing could not be measured by automation
(the page hangs the automation tab), so spacing is matched by eye on the
preview and recorded in the PR.

## Verification

- Unit tests per new block and per changed block: filled renders, empty renders
  nothing, editing-and-empty renders the dashed outline.
- A test that a block saved without the hide switch still renders when empty (existing pages do not change).
- The unpublished new Home, in the builder preview: the nav is flagged over the hero; with no words
  entered the public page shows only Hero, the About split and the call to
  action; entering words in the editor makes each section appear.
- Checked on a Vercel preview in Claude in Chrome (never the in-app browser):
  desktop and a 420px phone, no horizontal scroll, no empty frames.

## Questions for Alex (answered 2026-11-16)

1. The reference hero has a round badge near the bottom (noted in the step 2
   design). I could not see it from text. Send a screenshot, or leave it out for
   now? Answer: leave it out. It is not part of this step.
2. The reference repeats its testimonial slider (sections 5 and 10). Default:
   one slider, placed at section 5. Alex approved.

## What is left to the builder

Block field names and defaults, exact copy of the dashed editor outline, where
the shared helper lives, the slider's markup and keyboard behaviour (arrows,
focus, reduced motion), card hover styling for Path Choice, and the script's
exact backup location.
