# Rising Roots Nav, Menu and Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site chrome (nav row, full-screen menu, footer) match the Rising Roots reference, with Tynnell's own words editable in Site Settings.

**Architecture:** Restyle the existing `Navbar`, `MobileMenu` and `Footer` in place (no page-builder blocks). The nav row becomes its own constant (`navRow`) separate from `navLinks`. The solid-versus-transparent nav is decided in CSS from a `data-nav-hero` marker on hero sections, so there is no flash and no JS state. The footer reads its data through one guarded server helper.

**Tech Stack:** Next.js 16 App Router, React, CSS Modules, Payload v3 (`globals/SiteConfig.ts`), vitest + Testing Library, `scripts/migrate-db.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-13-nav-footer-design.md` (read it first; this plan only records decisions the spec leaves open).

## Global Constraints

- No em dashes anywhere (code, comments, strings, docs, commit messages).
- CSS Modules only, no Tailwind. Fonts only through variables `--font-serif`, `--font-sans`, `--font-label`, `--font-script-role`; never write a family name (the PR #155 bug).
- Nav and footer colours: `var(--color-nav-bg, var(--color-btn-bg))` and `var(--color-nav-text, var(--color-btn-text))` exactly; never read `--color-btn-*` any other way in a solid state.
- Collapse breakpoint stays 1024px.
- Schema change = block in `scripts/migrate-db.mjs` (`ADD COLUMN IF NOT EXISTS`) + regex test in `scripts/migrate-db.test.ts` + `npm run generate:types` (never hand-edit `payload-types.ts`).
- Tests first, watch each fail. Commit messages carry NO `Co-Authored-By` (project rule). PR bodies end with the Claude Code line.
- Never link or redirect into the raw Payload admin.
- PR 1 uses the existing branch `feature/0000259-rising-roots-nav-footer` (the spec is already committed there). PR 2 uses `feature/0000260-rising-roots-footer`, cut from `main` after PR 1 merges.
- Deploy flow after each merge: push main alone, confirm the Vercel production build, then merge main into dev, qa, staging.

## Review Focus

1. The database read fails inside the footer: the footer must still render, without the strip and builder links (tested in Task 8 and Task 9).
2. No logo set in `/design`: the nav mark and footer mark fall back to the text wordmark (Task 2 and Task 9).
3. Empty social URLs (Pinterest, TikTok, Facebook blank): no empty icon, no broken link (Task 9).
4. A builder page flagged show-in-menu with a very long title: wraps in the menu and footer, never overflows the viewport (Task 5 and Task 10).
5. A page with no hero, or a hero that is not first: nav is solid and readable from first paint (Task 4; a hero lower down is a known limit, noted in the PR).

---

# PART 1: Nav and menu (PR 1)

### Task 1: Nav constants and the "About me" rename

**Files:**
- Modify: `app/constants/nav.ts`, `app/components/Footer/Footer.tsx` (the `'About'` label filter on line 19)
- Create: `app/constants/nav.test.ts`

**Interfaces:**
- Produces: `export const navRow: { left: NavLink[]; right: NavLink[]; cta: NavLink }`; `navLinks[1].label` becomes `'About me'`.

- [ ] **Step 1: Write failing tests in `nav.test.ts`.** `navRow.left` labels `['Home','About me','Wedding photography']` with hrefs `['/','/about','/portfolio/weddings']`; `navRow.right` labels `['Portraits','My work']` hrefs `['/portfolio/portraits','/portfolio']`; `navRow.cta` is `{label:'Inquire now', href:'/contact'}`; `navLinks` contains a link labelled `About me` and none labelled `About`; every `navRow` href (left, right and cta) exists among the hrefs of `navLinks` and their `children`, so no row link can point at a page the menu does not know.
- [ ] **Step 2: Run** `npx vitest run app/constants/nav.test.ts`. Expected: FAIL (navRow undefined).
- [ ] **Step 3: Add `navRow`, rename `About` to `About me` in `navLinks`.** In `Footer.tsx` change the filter label from `'About'` to `'About me'` so the footer keeps its link (Footer is rewritten in Part 2).
- [ ] **Step 4: Run** `npx vitest run app/constants/nav.test.ts app/components` and `npx tsc --noEmit`. Expected: PASS, clean.
- [ ] **Step 5: Commit** `feat(nav): add the Rising Roots nav row and rename About to About me`.

### Task 2: Navbar renders the new row

**Files:**
- Modify: `app/components/Navbar/Navbar.tsx`, `app/components/Navbar/Navbar.test.tsx`

**Interfaces:**
- Consumes: `navRow` from Task 1; `splitBrand` (`@/app/lib/constants`).
- Produces: `Navbar` props unchanged (`builderLinks`, `logoUrl`, `siteTitle`, `menuCards`). The menu still receives `[...navLinks, ...builderLinks]`; the row receives only `navRow`.

- [ ] **Step 1: Write failing tests** in `Navbar.test.tsx`:
  - `renders the five row links in order with their hrefs` (query within `getByRole('navigation', {name: /main navigation/i})`; order Home, About me, Wedding photography, Portraits, My work).
  - `renders "Inquire now" linking to /contact`.
  - `has no Portfolio dropdown button` (no element with `aria-haspopup`).
  - `keeps builder-page links out of the row but passes them to the menu` (render with `builderLinks=[{label:'Pricing',href:'/pricing'}]`; row lacks it; after opening the menu it is present).
  - `shows the logo image when logoUrl is set and the text wordmark when not`.
  - `shows "close menu" next to the button only while the menu is open` (text `close menu`, absent when closed).
- [ ] **Step 2: Run** `npx vitest run app/components/Navbar/Navbar.test.tsx`. Expected: FAIL on the new tests.
- [ ] **Step 3: Rewrite the markup in `Navbar.tsx`:** left `ul` from `navRow.left`, centre brand unchanged, right `ul` from `navRow.right`, then the CTA (`navRow.cta.href`, text `navRow.cta.label`), then a `span` (class `menuLabel`, `aria-hidden`) with `close menu` when open, then the existing button. Delete `LEFT_LINKS`, `CTA_LABEL`, the dropdown state, timers, outside-click effect and `renderLink`'s dropdown branch; the row renders plain links only. Keep scroll, route-close, focus and `aria-current` behaviour.
- [ ] **Step 4: Run** the Navbar tests and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(nav): five-link Rising Roots row, no dropdown, close-menu label`.

### Task 3: Navbar look (type, always-visible menu button, hairline)

**Files:**
- Modify: `app/components/Navbar/Navbar.module.css`, `app/components/Navbar/Navbar.module.css.test.ts`

**Interfaces:**
- Consumes: class names from Task 2 (`link`, `hamburger`, `menuLabel`, `navbar`, `scrolled`).

- [ ] **Step 1: Write failing CSS-text tests** (same helper style as the existing file):
  - `.link` uses `font-family: var(--font-serif)`, declares no `text-transform: uppercase`, no `letter-spacing` other than `normal`/`0`, and `font-size: 18px` (or the rem equivalent `1.125rem`) at desktop width.
  - Base `.hamburger` rule does not contain `display: none` (visible on desktop); the `max-width: 1024px` block still hides `.row` and keeps the hamburger.
  - `.navbar::after` exists with a 1px bottom hairline and is switched off (`opacity: 0`) under `.scrolled`/`.menuOpen`.
  - `.menuLabel` uses `var(--font-script-role, var(--font-display))`.
  - Delete the dropdown rules and their now-wrong test expectations; the existing solid-state tests stay and must keep passing.
- [ ] **Step 2: Run** `npx vitest run app/components/Navbar/Navbar.module.css.test.ts`. Expected: FAIL.
- [ ] **Step 3: Edit the CSS** to satisfy the tests. Remove `.hasDropdown`, `.arrow*`, `.dropdown*` rules and the 1025-1240 `.link` uppercase overrides. Text colour is `var(--color-nav-text, var(--color-btn-text))` in the solid state and `#ECE9E0` while transparent (reference value).
- [ ] **Step 4: Run** the Navbar css tests, then `npm test`. Expected: PASS, whole suite green.
- [ ] **Step 5: Commit** `style(nav): serif title-case links, desktop menu button, hairline`.

### Task 4: Solid nav on pages with no hero

**Files:**
- Modify: `app/components/Navbar/Navbar.module.css` and its test; the hero components found in Step 1.
- Test: new `app/components/Navbar/navHeroMarker.test.tsx`

**Interfaces:**
- Produces: the marker attribute `data-nav-hero` (value ignored) on the root element of every full-bleed first-section hero. The nav is solid unless `#main-content` contains a `[data-nav-hero]`.

- [ ] **Step 1 (investigate, read only):** use Grep to list which components render a full-bleed photo as the first section: the home `Hero`, the Puck `Hero` and `FullWidthImage` blocks (`app/builder/puck.config.tsx`), the `/portfolio/[slug]` gallery hero, and the blog post hero. Record the list in the PR description. Open each route's page once on a preview to confirm how the nav reads today.
- [ ] **Step 2: Write failing tests.** A CSS-text test: a rule with selector containing `:global(body):not(:has(` ... `[data-nav-hero]` sets the same solid background/text variables as `.scrolled`. For each hero component found, a render test that `container.querySelector('[data-nav-hero]')` is non-null.
- [ ] **Step 3: Run** both tests. Expected: FAIL.
- [ ] **Step 4: Implement.** Express the solid state once as two custom properties on `.navbar` (`--nav-bg`, `--nav-fg`) set by `.scrolled`, `.menuOpen` and the no-hero rule, and have the element rules read them. Keep the two fallback strings verbatim so the existing invariants test still passes (update that test to look at where the fallbacks now live). Add `data-nav-hero` to each hero from Step 1. Browsers without `:has()` keep the transparent nav; accepted.
- [ ] **Step 5: Run** `npm test`. Expected: PASS. **Commit** `feat(nav): solid navbar from first paint on pages without a hero`.

### Task 5: Full-screen menu (desktop layout, button, close label)

**Files:**
- Modify: `app/components/MobileMenu/MobileMenu.tsx`, `app/components/MobileMenu/MobileMenu.module.css`, `app/components/MobileMenu/MobileMenu.test.tsx`

**Interfaces:**
- Consumes: unchanged props `{ isOpen, onClose, links?, cards? }`.

- [ ] **Step 1: Write failing tests:**
  - `has a "Work with me" button linking to /contact` (a link named `Work with me` whose href is `/contact`, inside the numbered panel, separate from the cards region).
  - `closes when the Work with me button is clicked` (calls `onClose`).
  - `wraps a long builder-page title rather than clipping it` (CSS-text: `.link` has `overflow-wrap: anywhere` or `word-break` set).
  - Existing numbering, card, closed-tab-order and unsafe-link tests stay.
- [ ] **Step 2: Run** `npx vitest run app/components/MobileMenu`. Expected: FAIL.
- [ ] **Step 3: Implement.** Add the `Work with me` button (`Link`, `onClick={onClose}`, `tabIndex` follows `isOpen`) after the list. In the CSS, at min-width 1025px lay the overlay out as cards left / olive panel right (grid), the panel using `var(--color-nav-bg, var(--color-btn-bg))`; below that keep the current single column. Type in the list uses `--font-serif`.
- [ ] **Step 4: Run** the MobileMenu and Navbar tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat(menu): Rising Roots desktop layout and Work with me button`.

### Task 6: Verify Part 1 against the reference, then ship

**Files:** CSS values only, in `Navbar.module.css` and `MobileMenu.module.css`.

- [ ] **Step 1:** Run `npm test`, `npx tsc --noEmit`, `npm run lint`. Expected: all pass.
- [ ] **Step 2:** Push the branch, open the PR, wait for the Vercel preview. In Claude in Chrome (never the in-app browser), signed in, measure on the preview vs `https://risingroots.showit.site/`: nav link font-size, colour, y offset, and the open menu's list and card positions. Cormorant likely needs about 19 to 20px to match Nyght's optical size; set the value by side-by-side screenshot and record before/after numbers in the PR.
- [ ] **Step 3:** Dispatch a fresh reviewer on the diff (requesting-code-review). Fix Critical/Important findings.
- [ ] **Step 4:** After Alex approves the preview: merge, push main alone, confirm the production build, sync dev/qa/staging, delete the branch, update memory (`MEMORY.md` branch number, `rising-roots-match-2026-11-13.md`).

---

# PART 2: Footer (PR 2)

### Task 7: Footer text fields in Site Settings

**Files:**
- Modify: `globals/SiteConfig.ts`, `app/lib/siteConfig.ts`, `app/api/site-settings/save/route.ts` (the `FIELDS` list), `app/site-settings/page.tsx`, `app/site-settings/SiteSettingsClient.tsx`, `scripts/migrate-db.mjs`, `payload-types.ts` (regenerate)
- Test: `app/lib/siteConfig.test.ts`, `app/api/site-settings/save/route.test.ts`, `app/site-settings/SiteSettingsClient.test.tsx`, `scripts/migrate-db.test.ts`

**Interfaces:**
- Produces: `SiteConfigData.footerBio: string` (default `''`) and `SiteConfigData.footerLocation: string` (default `'Based in New Mexico | Travel Worldwide'`). Global fields `footerBio` (textarea) and `footerLocation` (text).

- [ ] **Step 1: Write failing tests.** siteConfig: defaults when the read throws and when the doc has neither field; mapped values when set. Route: `POST` with `{footerBio:'Hi', footerLocation:'Albuquerque'}` calls `updateGlobal` with exactly those two keys; unknown keys still dropped. Client: both inputs render with their initial values and their edits appear in the saved payload. Migration: regex `ALTER TABLE "site_config" ADD COLUMN IF NOT EXISTS "footer_bio" varchar` and the same for `"footer_location"`.
- [ ] **Step 2: Run** the four test files. Expected: FAIL.
- [ ] **Step 3: Implement** in each file listed, copying the exact pattern `freebieTitle` uses in each (route allowlist, `page.tsx` mapping with `?? ''`, client type and input, global field with a description, `getSiteConfig` mapping with `||` default, `migrate-db.mjs` block near line 1078).
- [ ] **Step 4:** Regenerate types: `$env:DATABASE_URI=...; $env:PAYLOAD_SECRET='placeholder'; npm run generate:types`. Run the four test files and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(site-settings): footer bio and location fields`.

### Task 8: Footer data helper

**Files:**
- Create: `app/lib/footerData.ts`, `app/lib/footerData.test.ts`

**Interfaces:**
- Consumes: `getBuilderNavLinks` (`@/app/lib/nav`), `navRow`/`navLinks` (`@/app/constants/nav`).
- Produces: `export async function getFooterData(): Promise<{ stripPhotos: { id: number; src: string }[]; builderLinks: NavLink[]; hasTerms: boolean; hasPrivacy: boolean }>`; also exports `STRIP_MAX = 6`, `TERMS_SLUG = 'terms-and-conditions'`, `PRIVACY_SLUG = 'privacy-statement'`.

- [ ] **Step 1: Write failing tests** (mock `payload`): featured photos map to `{id, src}` using `sizes.card.url` falling back to `url`, capped at 6, newest first (`sort: '-updatedAt'`); a photo with no url is skipped; `hasTerms`/`hasPrivacy` true only when a published page with that slug exists; builder links whose href equals the terms or privacy path or any `navLinks`/`navRow` href are dropped; and when `payload.find` throws, the result is `{stripPhotos:[], builderLinks:[], hasTerms:false, hasPrivacy:false}`.
- [ ] **Step 2: Run** `npx vitest run app/lib/footerData.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** with one `try/catch` around the whole read; use `Promise.all` for the photo and page lookups.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit** `feat(footer): guarded data helper for strip, builder links and legal pages`.

### Task 9: Footer markup

**Files:**
- Modify: `app/components/Footer/Footer.tsx`
- Create: `app/components/Footer/Footer.test.tsx`

**Interfaces:**
- Consumes: `getSiteConfig` (now with `footerBio`, `footerLocation`), `getFooterData` (Task 8), `navRow`, `navLinks`, `splitBrand`, `theme.logoUrl` via a new optional prop `logoUrl?: string` on `Footer` (the `(site)` layout passes it, as it does for `Navbar`).
- Produces: `export default async function Footer({ logoUrl }: { logoUrl?: string })`.

- [ ] **Step 1: Write failing tests** (mock `@/app/lib/siteConfig` and `@/app/lib/footerData`; render with `render(await Footer({}))`):
  - the link list, in order: Home, About me, Wedding photography, Portraits, My work, Services, Testimonials, Blog, Contact, then builder links.
  - `Where to next?` and `Let's connect` headings; email link `mailto:`; location text from `footerLocation`.
  - bio paragraph present when set, absent (no empty element) when `footerBio` is `''`.
  - `Work with me` link to `/contact`.
  - strip renders N images for N photos and nothing at all when `stripPhotos` is empty.
  - Terms link (`/terms-and-conditions`) only when `hasTerms`; Privacy link only when `hasPrivacy`; neither otherwise.
  - Instagram, TikTok and Pinterest icons appear only for non-empty URLs; with all empty there is no socials list.
  - logo `img` when `logoUrl` set, text wordmark otherwise.
  - copyright line `© <year> <title>`; no designer credit.
- [ ] **Step 2: Run** `npx vitest run app/components/Footer/Footer.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Rewrite `Footer.tsx`** to the three parts of the spec (columns, strip, bottom row). Remove the CTA row and the Instagram-strip label. Remove the `payload.find` photos query (now in `getFooterData`). Update `app/(site)/layout.tsx` to pass `logoUrl={theme.logoUrl}` and fix `app/(site)/layout.test.tsx` if it asserts Footer props.
- [ ] **Step 4: Run** the Footer tests, `app/(site)/layout.test.tsx` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(footer): three-column Rising Roots footer`.

### Task 10: Footer look

**Files:**
- Modify: `app/components/Footer/Footer.module.css`
- Create: `app/components/Footer/Footer.module.css.test.ts`

- [ ] **Step 1: Write failing CSS-text tests:** `.footer` background is exactly `var(--color-nav-bg, var(--color-btn-bg))`; text colour rules use `var(--color-nav-text, var(--color-btn-text))`; no rule reads `--color-btn-bg`/`--color-btn-text` except as those fallbacks; labels use `var(--font-sans)` uppercase 12px weight 300 `letter-spacing: 1.8px`; the two script headings use `var(--font-script-role, var(--font-display))`; list links set `overflow-wrap: anywhere`; the strip is a six-column grid at desktop and wraps to three below 768px.
- [ ] **Step 2: Run** the test. Expected: FAIL.
- [ ] **Step 3: Rewrite the CSS** for the new markup (grid of three columns, strip, bottom row), delete the rules for the removed CTA row and Instagram strip.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `style(footer): olive ground and Rising Roots type`.

### Task 11: Verify Part 2 against the reference, then ship

- [ ] **Step 1:** `npm test`, `npx tsc --noEmit`, `npm run lint`. Expected: all pass.
- [ ] **Step 2:** Push, open the PR, wait for the preview. In Claude in Chrome (signed in) compare the footer to the reference footer: column positions, label type, strip height. Check it with the Site Settings fields empty (nothing invented) and filled. Check a builder page flagged show-in-menu with a long title.
- [ ] **Step 3:** Fresh reviewer on the diff; fix Critical/Important findings. Confirm the production build ran the migration (the new columns exist: read `/api/globals/site-config` while signed in and see `footerBio`/`footerLocation` keys).
- [ ] **Step 4:** After Alex approves: merge, push main alone, confirm production, sync dev/qa/staging, delete the branch, update memory.

---

## Self-review notes

- Spec coverage: nav row (T1-T3), menu button and hairline (T3), solid-without-hero (T4), full-screen menu and Work-with-me button (T5), type retune (T6, T11), footer parts (T9-T10), strip and legal rules and hardening (T8-T9), Site Settings fields and migration (T7), delivery in two PRs (Parts 1 and 2). "Needs Tynnell" items are content, not tasks.
- Naming consistent: `navRow`, `getFooterData`, `STRIP_MAX`, `data-nav-hero`, `menuLabel`, `footerBio`, `footerLocation`.
