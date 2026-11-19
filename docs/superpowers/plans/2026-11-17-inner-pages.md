# Rising Roots Inner Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Rising Roots inner pages (Wedding photography, Portraits, My work, About, Contact) as editable builder pages made from reusable blocks, with every section that needs Tynnell's words hidden until she fills it in.

**Architecture:** Four new Puck blocks (Packages, Steps, FeatureColumns, InquiryForm) plus small changes to Accordion and PathChoice. `POST /api/contact` gains an optional `kind` so the shorter wedding and portrait forms can post to it. Each page is a pure layout function in `app/builder/*Layout.ts` (like `homeLayout.ts`); a script writes unpublished pages or drafts. Nav links and redirects move last.

**Tech Stack:** Next.js 16, Payload v3, `@measured/puck` 0.20.2, Vitest + Testing Library (jsdom), `pg` for scripts run with `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-17-inner-pages-design.md`

## Global Constraints

- No em dashes anywhere (code, comments, strings, docs). Use a hyphen, comma or colon.
- No `Co-Authored-By` line in any commit message. Never commit `.env.local`.
- PowerShell only. Test command: `npx vitest run <path>`; whole suite: `npm test`; types: `npx tsc --noEmit`; lint: `npm run lint`.
- Strict TDD: write the test, run it, watch it FAIL for the right reason, then implement. Keep tests lean: behaviour tests yes, CSS-text tests only for past-bug contracts.
- Hide-until-filled: new blocks default `hideUntilFilled: true`; changed existing blocks default `false`. Empty rules live in `app/builder/emptyRules.ts` (pure). Wrap output in `GateEmpty` from `app/builder/hideUntilFilled.tsx`.
- New blocks ship with NO invented text, numbers or prices: every default string is `''`.
- Block test pattern: `block.render({ ...block.defaultProps, ...props, puck: {} })` (see `app/builder/Statement.test.tsx`). New block files go in `app/builder/`.
- New pages are inserted unpublished. Drafts are written to `draft_content` only, never `content`/`published`, and only after Alex approves each one. The builder Publish button publishes every page's draft and every unpublished page at once, so publishing is a separate step Alex approves.
- `pages` columns: `id, title, slug, content, published, display_order, show_in_nav, is_homepage, promoted_route, draft_content, created_at, updated_at`. `promoted_route` is a Postgres enum: do not set it for new pages (the `[...slug]` catch-all serves them).
- Ship order per PR: branch from fresh `main` (`feature/NNNNNNN-slug`, numbers 0000264 to 0000267), PR, Alex merges, then push main alone first, confirm the Vercel build with `list_deployments`, THEN sync dev/qa/staging.
- Copy and photos come from Tynnell only. Cormorant Garamond stays the Nyght Serif stand-in.

## Review Focus

Failure modes the spec implies; each has a test in the named task.

1. Whitespace-only words (`'   '`) must count as empty in every new rule. Task 1.
2. A `kind` submission with a bad email, a missing kind-specific required field, or an unknown `kind` value is rejected; the old general form (no `kind`) behaves exactly as before. Tasks 6 and 7.
3. Honeypot, Turnstile and rate limiting still apply to `kind` submissions. Task 7.
4. A `kind` submission with no date still sends; one WITH a date inside a blocked range is still refused. Task 7.
5. A blank layout shows visitors nothing from gated blocks, and the draft script never overwrites a saved draft or an existing page. Tasks 10 and 11.
6. Old gallery addresses redirect permanently and nested paths under them are not swallowed. Task 19.

---

# PR 1: new blocks, `kind` form route, Wedding page (branch `feature/0000264-inner-pages-blocks-wedding`)

### Task 1: Empty rules for the new blocks

**Files:**
- Modify: `app/builder/emptyRules.ts`
- Test: `app/builder/emptyRules.test.ts` (extend if it exists, else create)

**Interfaces:**
- Produces (all pure, all exported):
  - `packagesIsEmpty(p: { cards?: { name?: string; price?: string }[] }): boolean` - true unless some card has a non-blank name AND price.
  - `stepsIsEmpty(p: { steps?: { title?: string }[] }): boolean` - true unless some step has a non-blank title.
  - `columnsIsEmpty(p: { columns?: { title?: string; lines?: string }[] }): boolean` - true unless some column has a non-blank title AND at least one non-blank line (lines are newline-separated text).
  - `faqIsEmpty(p: { items?: { title?: string; body?: string }[] }): boolean` - true unless some item has non-blank title AND body.
  - `linesOf(text?: string): string[]` - splits on newlines, trims, drops blanks.

- [ ] **Step 1: Write failing tests** for each function: empty/undefined input is empty; one complete entry is not empty; an entry with only half its fields is still empty; whitespace-only strings (`'   '`, `'\n \n'`) are empty (Review Focus 1); `linesOf('a\n\n b \n')` equals `['a','b']`.
- [ ] **Step 2: Run** `npx vitest run app/builder/emptyRules.test.ts`. Expected: FAIL, "is not a function" for the new names.
- [ ] **Step 3: Implement** the five functions in `emptyRules.ts`, reusing `isBlank`.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(builder): empty rules for packages, steps, columns and FAQ`.

### Task 2: Packages block

**Files:**
- Modify: `app/builder/puck.config.tsx` (add `Packages` to `components`, and to the `content` category list)
- Test: `app/builder/Packages.test.tsx`

**Interfaces:**
- Consumes: `packagesIsEmpty`, `linesOf` (Task 1); `GateEmpty`, `hideUntilFilledField`; the file's existing `Section`, `headingStyle`, `btnStyle`, `styleFields/Defaults`, `responsiveFields/Defaults`, `visClass`.
- Produces: block `Packages`, label "Packages". Fields: `heading` text; `cards` array (max 3) of `{ name, price, description (textarea), features (textarea, "one per line"), buttonText, buttonHref }`; `hideUntilFilled`; style and responsive fields. Defaults: `heading: ''`, three blank cards, `hideUntilFilled: true`.

- [ ] **Step 1: Write failing tests** (pattern as `Statement.test.tsx`): a card with name and price shows name, price, description; `features` renders one `<li>` per non-blank line; a card missing its price is not rendered while a complete one is; the card button shows only when both its text and link are set; renders nothing for a visitor while blank, dashed outline text `Add your words here: packages` in the editor; offered in the block drawer; has the hide switch and style/device controls; defaults contain no non-empty string except `buttonHref` if you give one.
- [ ] **Step 2: Run** `npx vitest run app/builder/Packages.test.tsx`. Expected: FAIL (`block` is undefined).
- [ ] **Step 3: Implement** the block, built from the same `Section`/`GateEmpty` shape as `PathChoice`. Cards in a responsive grid (`repeat(auto-fit, minmax(260px, 1fr))`), only complete cards rendered. Prices are Tynnell's text, never formatted.
- [ ] **Step 4: Run** the test, then `npx vitest run app/builder`. Expected: PASS (the whole builder directory, since `photoMovement.test.tsx` enumerates blocks and may need `hideUntilFilled: false` added to its draw props if it fails).
- [ ] **Step 5: Commit** `feat(builder): Packages block`.

### Task 3: Steps block

**Files:** Modify `app/builder/puck.config.tsx`; Test `app/builder/Steps.test.tsx`.

**Interfaces:**
- Consumes: `stepsIsEmpty`.
- Produces: block `Steps`, label "Booking Steps". Fields: `heading`; `steps` array (max 6) of `{ title, body (textarea) }`; hide switch; style/responsive. Defaults: `heading: ''`, five blank steps, `hideUntilFilled: true`.

- [ ] **Step 1: Write failing tests:** steps render in an ordered sequence numbered `01`, `02`, `03` generated from position (not typed); a blank step in the middle is skipped and the next one is numbered `02` (renumbered); body shows under its title; blank block hidden from visitors, outline `Add your words here: booking steps` in the editor; in drawer; hide switch present.
- [ ] **Step 2: Run** `npx vitest run app/builder/Steps.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the block (numbers in the display font, title and body to the right of each number).
- [ ] **Step 4: Run** `npx vitest run app/builder`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(builder): Steps block`.

### Task 4: FeatureColumns block

**Files:** Modify `app/builder/puck.config.tsx`; Test `app/builder/FeatureColumns.test.tsx`.

**Interfaces:**
- Consumes: `columnsIsEmpty`, `linesOf`.
- Produces: block `FeatureColumns`, label "Columns List". Fields: `heading`; `columns` array (max 4) of `{ title, lines (textarea, "one per line") }`; hide switch; style/responsive. Defaults: `heading: ''`, three blank columns, `hideUntilFilled: true`. One filled column renders as a single list (used for the benefits list).

- [ ] **Step 1: Write failing tests:** each column renders its title as a heading and one `<li>` per non-blank line; a column with a title but no lines is not rendered; with a single filled column exactly one list renders; blank block hidden, outline `Add your words here: columns`; in drawer; hide switch present.
- [ ] **Step 2: Run** `npx vitest run app/builder/FeatureColumns.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the block.
- [ ] **Step 4: Run** `npx vitest run app/builder`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(builder): Columns List block`.

### Task 5: Accordion hide switch

**Files:** Modify `app/builder/puck.config.tsx` (Accordion block, around line 1393); Test: add a case to `app/builder/hideSwitch.test.tsx`.

**Interfaces:**
- Consumes: `faqIsEmpty`.
- Produces: Accordion gains `hideUntilFilled: hideUntilFilledField`, default `false` (so saved pages do not change), gate label `questions`.

- [ ] **Step 1: Write failing test:** append to the `cases` table in `hideSwitch.test.tsx`: `{ type: 'Accordion', empty: { heading: '', items: [{ title: '', body: '' }] }, filled: { items: [{ title: 'Q', body: 'A' }] } }`. The table's five existing checks (off by default, empty-and-off still renders a section, empty-and-on renders nothing, editor outline `Add your words here:`, filled-and-on renders normally) cover the behaviour.
- [ ] **Step 2: Run** `npx vitest run app/builder/hideSwitch.test.tsx`. Expected: FAIL for the Accordion rows.
- [ ] **Step 3: Implement:** wrap Accordion's render in `GateEmpty`, add the field and default.
- [ ] **Step 4: Run** `npx vitest run app/builder`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(builder): hide-until-filled switch on Accordion`.

### Task 6: Inquiry validation module

**Files:**
- Create: `app/lib/inquiry.ts`
- Modify: `app/lib/validation.ts` (add `partnerName: 100` to `CONTACT_MAX_LENGTHS`)
- Test: `app/lib/inquiry.test.ts`

**Interfaces:**
- Produces:
  - `type InquiryKind = 'wedding' | 'portrait'`
  - `PORTRAIT_SESSIONS = ['Couple', 'Maternity', 'Newborn', 'Family'] as const`
  - `parseInquiryKind(v: unknown): InquiryKind | null | 'invalid'` - `undefined`/`''`/`null` give `null` (the old general form); `'wedding'`/`'portrait'` give themselves; anything else gives `'invalid'`.
  - `validateKindFields(kind: InquiryKind, body: Record<string, unknown>): string | null` - an error message, or `null` when valid. Required for both: non-blank `name`, `email`, `message`. Wedding also requires `partnerName`. Portrait also requires `sessionType` that is one of `PORTRAIT_SESSIONS`. `phone`, `contactPreference`, `date`, `location`, `howHeard` are never required.

- [ ] **Step 1: Write failing tests** for each behaviour above, including whitespace-only `name`, a portrait with `sessionType: 'Other'` rejected, a wedding with no partner rejected, a body with no phone accepted, `parseInquiryKind('admin')` is `'invalid'` (Review Focus 2).
- [ ] **Step 2: Run** `npx vitest run app/lib/inquiry.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `inquiry.ts` and the `partnerName` length cap.
- [ ] **Step 4: Run** `npx vitest run app/lib`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(contact): validation for wedding and portrait inquiry kinds`.

### Task 7: `POST /api/contact` accepts `kind`

**Files:**
- Modify: `app/api/contact/route.ts`, `app/lib/emails.ts` (`InquiryEmailFields`, `inquiryEmailHtml`, `ClientAcknowledgmentEmailFields`, `clientAcknowledgmentEmailHtml`)
- Test: `app/api/contact/route.test.ts` (add a `describe`; reuse its mocks and `validBody`/`makeRequest`), and an emails test next to `emails.ts` if one exists.

**Interfaces:**
- Consumes: `parseInquiryKind`, `validateKindFields` (Task 6).
- Produces: unchanged request shape when `kind` is absent. With `kind`, body fields are `name, email, partnerName?, sessionType?, date?, location?, howHeard?, message, website, turnstileToken`. `phone`, `contactPreference` and `date` become optional in `InquiryEmailFields`; add optional `partnerName`. Rows appear in the email only when present. The acknowledgment email omits the " on <date>" phrase when no date was sent. A wedding submission uses `sessionType` `'Wedding'`; subject is `New Wedding Inquiry - <name>` or `New Portrait Inquiry - <name>`.

- [ ] **Step 1: Write failing tests** (existing tests must stay green and are not edited): a wedding body with no phone, no preference and no date returns 200 and sends two emails; the inquiry email contains the partner's name; a portrait body returns 200 and its email shows the chosen session; wedding with a bad email returns 400; wedding without `partnerName` returns 400; `kind: 'admin'` returns 400 and sends nothing; the honeypot still returns a silent 200 and sends nothing for a `kind` body; a rate-limited `kind` body returns 429; a failed Turnstile returns 400; a `kind` body whose `date` falls in a blocked range returns 400 with the blocked message; a `kind` body with `date: ''` is not date-checked (Review Focus 2, 3, 4). Add an emails test that `clientAcknowledgmentEmailHtml` without `date` has no "on" phrase and no "undefined".
- [ ] **Step 2: Run** `npx vitest run app/api/contact`. Expected: new tests FAIL (400 "Missing required fields"), old tests PASS.
- [ ] **Step 3: Implement:** after the honeypot and rate-limit checks, parse `kind`; `'invalid'` returns 400; with a kind run `validateKindFields`, otherwise run today's checks untouched. Length and email checks run for both. Run date validation and the blocked-range check only when `date` is a non-blank string. Both paths share the Turnstile check and the send tail.
- [ ] **Step 4: Run** `npx vitest run app/api/contact app/lib`. Expected: all PASS.
- [ ] **Step 5: Commit** `feat(contact): wedding and portrait inquiry kinds on /api/contact`.

### Task 8: `InquiryForm` component

**Files:**
- Create: `app/(site)/contact/InquiryForm.tsx` (reuse `ContactForm.module.css` and the shared `Turnstile`)
- Test: `app/(site)/contact/InquiryForm.test.tsx`

**Interfaces:**
- Consumes: `PORTRAIT_SESSIONS` (Task 6); the request shape from Task 7.
- Produces: `export default function InquiryForm(props: { kind: 'wedding' | 'portrait' | 'choice'; minDate?: string; maxDate?: string })`. `wedding` fields: name, email, partner's name, wedding location (plain text input), wedding date, how did you find me (text), message. `portrait` fields: name, email, "Which session?" select of `PORTRAIT_SESSIONS`, preferred date, location, how did you find me, message. No phone or contact-preference field. `choice` renders two buttons (`role="tab"`, labels "Wedding inquiry" and "Portrait inquiry", wedding selected first) that swap the field set. Honeypot field `website` and Turnstile exactly as in `ContactForm.tsx`.

- [ ] **Step 1: Write failing tests** (jsdom, `vi.stubGlobal('fetch', ...)`): wedding shows a "Partner's name" field and no phone field; portrait shows the session select with the four sessions; submit posts JSON containing `kind: 'wedding'` and the typed values to `/api/contact`; a 400 response shows the server's message; success shows the thank-you text; `choice` switches from wedding to portrait fields when the second tab is clicked and then posts `kind: 'portrait'`; the honeypot input is present and `aria-hidden`.
- [ ] **Step 2: Run** `npx vitest run "app/(site)/contact/InquiryForm.test.tsx"`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** the component, following `ContactForm.tsx`'s state, error and success handling.
- [ ] **Step 4: Run** the test, then `npx vitest run "app/(site)/contact"`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(contact): InquiryForm for wedding and portrait inquiries`.

### Task 9: `InquiryForm` builder block

**Files:** Modify `app/builder/puck.config.tsx`; Test `app/builder/InquiryFormBlock.test.tsx`.

**Interfaces:**
- Consumes: `InquiryForm` (Task 8). The booking-dates `resolveData` body currently inline in `ContactFormBlock` (around line 1447).
- Produces: block `InquiryForm`, label "Inquiry Form". Fields: `kind` radio (Wedding / Portrait / Visitor chooses, values `wedding`, `portrait`, `choice`), `eyebrow`, `heading`, `subtext`, style/responsive. Defaults `kind: 'wedding'`, all strings `''`. Not gated (a form is always useful). A module-level `resolveBookingDates()` is shared by `ContactFormBlock` and `InquiryForm` (refactor after green).

- [ ] **Step 1: Write failing tests:** the block passes `kind` and the resolved min/max dates to the form (mock `@/app/(site)/contact/InquiryForm` and assert props); heading and subtext render when set and not when blank; `resolveData` returns `resolvedMinDate`/`resolvedMaxDate` from a mocked `fetch` and `{ props: {} }` on failure; in drawer.
- [ ] **Step 2: Run** `npx vitest run app/builder/InquiryFormBlock.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the block, then extract `resolveBookingDates` and make `ContactFormBlock` use it.
- [ ] **Step 4: Run** `npx vitest run app/builder`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(builder): Inquiry Form block`.

### Task 10: Wedding layout, layout registry, `wedding` template

**Files:**
- Create: `app/builder/weddingLayout.ts`, `app/builder/pageLayouts.ts`
- Modify: `app/builder/templates.ts` (add `'wedding'` to `TemplateKey`, `templateOptions`, `TEMPLATES`)
- Test: `app/builder/pageLayouts.test.tsx`

**Interfaces:**
- Produces:
  - `buildWedding(): Data` (no arguments; blank). Blocks in order, with ids: `Hero` (`wedding-hero`, layout `bottom`, height `70vh`, no gate, as on the Home), `SplitImageText` (`wedding-booking`, button blank), `Statement` style `quote` (`wedding-location`), `FeatureColumns` (`wedding-benefits`), `SplitImageText` (`wedding-approach`), `Packages` (`wedding-packages`), `FeatureColumns` (`wedding-included`), `Steps` (`wedding-steps`), `LiveTestimonials` with `stickyPhotoScroll: 'slider'` (`wedding-kind-words`), `AlbumGrid` category `weddings` layout `grid` (`wedding-albums`), `InquiryForm` kind `wedding` (`wedding-inquiry`), `CTA` (`wedding-cta`), `Accordion` (`wedding-faq`). Every block except Hero and InquiryForm has `hideUntilFilled: true`; all text props `''`.
  - `LAYOUTS: Record<string, (current?: unknown) => Data>` in `pageLayouts.ts`, initially `{ 'wedding-photography': () => buildWedding() }`; `layoutForSlug(slug: string, current?: unknown): Data | null`.

- [ ] **Step 1: Write failing tests in `pageLayouts.test.tsx`:** (a) a table over every entry of `LAYOUTS`: block `props.id` values are unique; every gated block type has `hideUntilFilled: true`; (b) "a blank layout shows a visitor no text from gated blocks": render each block of the blank layout with `puck: {}` except `InquiryForm`, `LiveTestimonials`, `AlbumGrid` (which render empty without data) and assert the combined `textContent` is `''` (Review Focus 5); (c) `buildWedding()` block types equal the order above; (d) `getTemplateContent('wedding')` equals `buildWedding()`; (e) `layoutForSlug('nope')` is `null`.
- [ ] **Step 2: Run** `npx vitest run app/builder/pageLayouts.test.tsx`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `weddingLayout.ts`, `pageLayouts.ts` and the template entry (description: "The wedding page: intro, packages, steps, albums and an inquiry form. Each section stays hidden until you fill in your words.").
- [ ] **Step 4: Run** `npx vitest run app/builder`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(builder): wedding page layout and template`.

### Task 11: Page script, PR 1 gate, ship, create the Wedding page

**Files:**
- Create: `scripts/write-page-drafts.ts`
- Modify: `app/builder/pageLayouts.ts` (add the two guards), `app/builder/pageLayouts.test.tsx`

**Interfaces:**
- Produces in `pageLayouts.ts`: `assertCanCreate(existingSlugs: string[], slug: string): void` (throws if `slug` is already a page or has no layout); `assertCanDraft(row: { id: number; slug: string; draft_content: unknown }, dryRun: boolean): void` (throws when a draft exists and not a dry run).
- Script usage: `node node_modules/tsx/dist/cli.mjs scripts/write-page-drafts.ts create <slug> <backupDir>` inserts `{ title, slug, content: layout, published: false, show_in_nav: false }` (title "Wedding photography" / "Portraits"); `... draft <pageId> <backupDir> [--dry-run]` backs the row up to JSON, then writes only `draft_content` from `layoutForSlug(row.slug, row.content)`. Strict TLS (`rejectUnauthorized: true`).

- [ ] **Step 1: Write failing tests** for both guards (existing slug throws; unknown slug throws; draft present throws unless dry run; clean case passes).
- [ ] **Step 2: Run** `npx vitest run app/builder/pageLayouts.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the guards and the script (model it on `scripts/write-home-draft.ts`).
- [ ] **Step 4: Run** the full gate: `npm test`, `npx tsc --noEmit`, `npm run lint`. Expected: all clean; report any failure by name.
- [ ] **Step 5: Commit** `feat(scripts): create and draft inner pages`; push the branch; open the PR; ask Alex to merge. After the merge: `git pull`, confirm the production build with `list_deployments`, sync dev/qa/staging, delete the branch.
- [ ] **Step 6 (needs Alex's yes):** run `create wedding-photography <backupDir>`; check the page opens in the builder via Chrome (Alex signs in); do not publish.

---

# PR 2: Portraits (branch `feature/0000265-inner-pages-portraits`)

### Task 12: PathChoice takes up to four cards

**Files:** Modify `app/builder/puck.config.tsx` (`PathChoice.fields.cards.max`); Test: extend `app/builder/PathChoice.test.tsx`.

**Interfaces:** `cards` `max` goes from 2 to 4. `pathChoiceIsEmpty` is unchanged. Saved two-card blocks render identically.

- [ ] **Step 1: Write failing test:** four complete cards render four links; and the field config reports `max: 4`.
- [ ] **Step 2: Run** `npx vitest run app/builder/PathChoice.test.tsx`. Expected: FAIL on the `max` assertion.
- [ ] **Step 3: Implement** the one-line change (the grid is already `auto-fit`).
- [ ] **Step 4: Run** `npx vitest run app/builder`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(builder): choice cards up to four`.

### Task 13: Portraits layout

**Files:** Create `app/builder/portraitsLayout.ts`; Modify `app/builder/pageLayouts.ts` (`'portraits'`), `app/builder/templates.ts` (`'portraits'`); extend `app/builder/pageLayouts.test.tsx`.

**Interfaces:** `buildPortraits(): Data`, blocks in order with ids: `Hero` (`portraits-hero`), `Statement` (`portraits-intro`), `StatsRow` (`portraits-reviews`, three blank items), `Statement` quote (`portraits-quote`), `PathChoice` with four blank cards (`portraits-sessions`), `SplitImageText` (`portraits-philosophy`), `Packages` (`portraits-packages`), `Steps` (`portraits-steps`), `CTA` (`portraits-sounds-good`), `LiveTestimonials` slider (`portraits-kind-words`), `Accordion` (`portraits-faq`), `InquiryForm` kind `portrait` (`portraits-inquiry`), `CTA` (`portraits-cta`). Same gating rules as the wedding layout.

- [ ] **Step 1: Write failing tests:** the shared table tests (unique ids, gating, blank renders nothing) pick up `portraits` once it is in `LAYOUTS`; add the exact type order for `buildPortraits()`, `layoutForSlug('portraits')` is non-null, and `getTemplateContent('portraits')` equals it.
- [ ] **Step 2: Run** `npx vitest run app/builder/pageLayouts.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the layout, registry entry and template entry.
- [ ] **Step 4: Run** `npx vitest run app/builder`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(builder): portraits page layout and template`.

### Task 14: PR 2 gate, ship, create the Portraits page

- [ ] **Step 1:** run `npm test`, `npx tsc --noEmit`, `npm run lint`; all clean.
- [ ] **Step 2:** push, open the PR, ask Alex to merge; then the same post-merge sync as Task 11 Step 5.
- [ ] **Step 3 (needs Alex's yes):** `create portraits <backupDir>`; check in Chrome; do not publish.

---

# PR 3: My work, About, Contact (branch `feature/0000266-inner-pages-rest`)

### Task 15: About layout with carried-over words

**Files:** Create `app/builder/aboutLayout.ts`; Modify `app/builder/pageLayouts.ts` (`'about'`); extend `app/builder/pageLayouts.test.tsx`.

**Interfaces:**
- Produces: `type AboutWords = { heroImage, heroEyebrow, heroHeading, heroSubheading, storyImage, storyEyebrow, storyHeading, storyBody, beliefLead, beliefBody, ctaHeading, ctaSubtext, ctaButtonText, ctaButtonHref: string }` (all strings), `BLANK_ABOUT_WORDS`, `aboutWordsFromCurrent(current: unknown): AboutWords & { specialties: Record<string, unknown> | null }`, `buildAbout(words?: AboutWords, specialties?: Record<string, unknown> | null): Data`.
- Carry-over map from the live About page (id 33, FreeformSection blocks): block 0 holds the hero image and its three texts (eyebrow, name, tagline); block 2 holds the story image and its eyebrow, heading and body; block 3 holds the belief texts (eyebrow "What I Believe", then the lead line); block 4 holds the belief body; block 7 holds the closing heading, subtext and button text/link; `specialties` is the props of the block whose type is `SpecialtiesReveal`, found by type.
- Block order: `Hero` (carries image and words), `SplitImageText` (story), `Statement` (belief: lead then body), `Statement` quote (closing testimonial, blank), `FeatureColumns` ("things that make my heart full", blank), `SpecialtiesReveal` (carried verbatim, else omitted), `LiveTestimonials` slider, `CTA` (carried words).

- [ ] **Step 1: Write failing tests:** `aboutWordsFromCurrent` on a fixture shaped like the live page (copy its structure, with short sample strings) returns the right strings and keeps the SpecialtiesReveal props; on `{}`, `null` and a page with missing blocks it returns blanks without throwing; `buildAbout` puts the hero image on the `Hero`, keeps unique ids, and includes `SpecialtiesReveal` only when supplied; the shared layout table tests pass for `about`'s blank build.
- [ ] **Step 2: Run** `npx vitest run app/builder/pageLayouts.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** `aboutLayout.ts` and register `about: (current) => { const w = aboutWordsFromCurrent(current); return buildAbout(w, w.specialties) }`.
- [ ] **Step 4: Run** `npx vitest run app/builder`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(builder): About page layout with carried-over words`.

### Task 16: My work layout

**Files:** Create `app/builder/myWorkLayout.ts`; Modify `app/builder/pageLayouts.ts` (`'portfolio-builder'`, the live slug of the page behind `/portfolio`); extend `app/builder/pageLayouts.test.tsx`.

**Interfaces:**
- Produces: `type MyWorkWords = { heroEyebrow: string; heroHeading: string }`, `myWorkWordsFromCurrent(current: unknown): MyWorkWords` (block 0's first and second text elements: "Portfolio", "Selected Work"), `buildMyWork(words?: MyWorkWords): Data`.
- Block order with ids: `Hero` (`mywork-hero`), `PathChoice` with two blank tiles (`mywork-tiles`), `Statement` (`mywork-intro`), `AlbumGrid` weddings strip (`mywork-weddings`), `AlbumGrid` portraits grid (`mywork-portraits`; category `portraits`), `SplitImageText` About teaser (`mywork-about`), `LiveTestimonials` slider (`mywork-kind-words`), `CTA` (`mywork-cta`).

- [ ] **Step 1: Write failing tests:** words extraction (fixture, blanks on odd input); `buildMyWork` carries the two words onto the Hero; shared layout table passes for the blank build.
- [ ] **Step 2: Run** `npx vitest run app/builder/pageLayouts.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** and register `'portfolio-builder': (current) => buildMyWork(myWorkWordsFromCurrent(current))`.
- [ ] **Step 4: Run** `npx vitest run app/builder`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(builder): My work page layout`.

### Task 17: Contact layout

**Files:** Create `app/builder/contactLayout.ts`; Modify `app/builder/pageLayouts.ts` (`'contact'`); extend `app/builder/pageLayouts.test.tsx`.

**Interfaces:** `buildContact(): Data`; the live Contact page holds only a form, so there are no words to carry. Blocks: `Hero` (`contact-hero`), `InquiryForm` kind `choice` (`contact-inquiry`), `Statement` (`contact-details`, for the contact details Tynnell supplies), `Accordion` (`contact-faq`), `LiveTestimonials` slider (`contact-kind-words`).

- [ ] **Step 1: Write failing tests:** exact type order; the `InquiryForm` has `kind: 'choice'`; shared table tests pass for `contact`.
- [ ] **Step 2: Run** `npx vitest run app/builder/pageLayouts.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** and register `contact: () => buildContact()`.
- [ ] **Step 4: Run** `npx vitest run app/builder`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(builder): Contact page layout`.

### Task 18: PR 3 gate, ship, write the three drafts

- [ ] **Step 1:** run `npm test`, `npx tsc --noEmit`, `npm run lint`; all clean.
- [ ] **Step 2:** push, open the PR, ask Alex to merge; then the post-merge sync.
- [ ] **Step 3 (needs Alex's yes for each page):** `draft 33 <backupDir> --dry-run`, review the carried words with Alex, then the real run for About; the same for `draft 44` (My work) and `draft 39` (Contact). Each writes only `draft_content`. Check each preview in Chrome (`/api/builder-preview?slug=...`, then `/api/exit-preview`). Report that the builder's Publish button now publishes every draft and every unpublished page at once, and do not publish.

---

# PR 4: nav links and redirects (branch `feature/0000267-inner-pages-nav`)

### Task 19: Redirect list and nav links

**Files:**
- Create: `app/constants/redirects.ts`
- Modify: `next.config.mjs` (spread the list into `redirects()`), `app/constants/nav.ts`, `app/constants/nav.test.ts`, `app/components/Navbar/Navbar.test.tsx`
- Test: `app/constants/redirects.test.ts`

**Interfaces:**
- Produces: `legacyRedirects: { source: string; destination: string; permanent: true }[]` with `/portfolio/weddings` to `/wedding-photography`, `/portfolio/portraits` to `/portraits`, `/portfolio/family` to `/portraits`. `navRow.left[2]` becomes `{ label: 'Wedding photography', href: '/wedding-photography' }`, `navRow.right[0]` becomes `{ label: 'Portraits', href: '/portraits' }`. In `navLinks`, the Portfolio children become Portraits `/portraits` and Weddings `/wedding-photography`; the Family child is removed (Family is a session on the Portraits page).

- [ ] **Step 1: Write failing tests:** `legacyRedirects` contains exactly those three entries, all `permanent: true`, and every source is an exact path with no wildcard so `/portfolio/some-album` is untouched (Review Focus 6); update `nav.test.ts` and `Navbar.test.tsx` expectations to the new hrefs; the menu no longer lists a Family link.
- [ ] **Step 2: Run** `npx vitest run app/constants app/components/Navbar`. Expected: FAIL.
- [ ] **Step 3: Implement** the list, import it in `next.config.mjs` (`import { legacyRedirects } from './app/constants/redirects.ts'` only if the config can import `.ts`; otherwise write the file as `redirects.mjs` and import that, adjusting the test import), and the nav edits.
- [ ] **Step 4: Run** `npm test`. Expected: all PASS; report any failure by name (`footerData.test.ts` and `MobileMenu.test.tsx` use `/portfolio/weddings` as sample data only and should not change).
- [ ] **Step 5: Commit** `feat(nav): point Wedding photography and Portraits at the new pages, redirect the old ones`.

### Task 20: PR 4 gate, ship, record

- [ ] **Step 1:** `npm test`, `npx tsc --noEmit`, `npm run lint`; all clean.
- [ ] **Step 2:** push, open the PR, ask Alex to merge; post-merge sync. Alex must have published the Wedding and Portraits pages BEFORE this merges, or the nav links 404; confirm that with him first.
- [ ] **Step 3:** after production builds, confirm in Chrome that `/portfolio/weddings` lands on `/wedding-photography` with a 308 (check with `javascript_tool`: `fetch('/portfolio/weddings', { redirect: 'manual' })` reports `opaqueredirect`, then load it and read `location.pathname`).
- [ ] **Step 4:** update `CLAUDE.md` (block list line in the Puck section: add Packages, Steps, FeatureColumns, InquiryForm; mention `kind` on `/api/contact` in the API table) and the memory notes (`rising-roots-match-2026-11-13.md`, `MEMORY.md`: step 4 status, next branch number 0000268). Commit `docs: inner pages blocks and routes`.
