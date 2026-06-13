# Tynnell Hollins Photography — Project Guide

## Absolute rules (never break these)

- **No `Co-Authored-By` in any commit message.** Ever.
- **No em dashes (`—`) anywhere** — in code, comments, strings, docs. Use a hyphen, comma, colon, or restructure the sentence.
- **PowerShell only.** No Git Bash. Bash syntax will error.
- **Never commit `.env.local`** or any file containing secrets.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.4.x (pinned), App Router, TypeScript |
| CMS | Payload v3 (embedded in Next.js at `/app/(payload)`) |
| Database | Neon serverless PostgreSQL (Postgres 17, AWS US East 1) |
| Media | Cloudflare R2 via `@payloadcms/storage-s3` |
| Hosting | Vercel (production + preview deployments) |
| Email | Resend |
| Payments | Stripe (live mode on Vercel, test mode locally) |
| Rate limiting | Upstash Redis |

---

## Project facts

- **Path:** `C:\Users\xande\dev\tynnell-hollins-photography`
- **Repo:** github.com/ArchaicScribe/tynnell-hollins-photography
- **Live domain:** tynnellhollinsphotography.com (live since 2026-06-05)
- **Client email:** Hello@TynnellHollinsPhotography.com
- **Node version:** v24
- **`.npmrc`:** `legacy-peer-deps=true`

---

## Local development

```powershell
# Standard — uses 1Password CLI to inject secrets
.\dev.ps1
# or
npm run dev:secure
```

Dev server runs on **port 3000**. Secrets come from `op://Personal/Tynnell_Hollins_Photography/<field>`.

### Worktree dev (isolated branches)

1. Check 1Password: `op whoami`
2. Create `.env.local` in the worktree (use the template in MEMORY.md)
3. Add localhost middleware bypass (see MEMORY.md)
4. Run `npm run dev` directly — do NOT use `op run` in worktrees
5. Server runs on **port 3001** (3000 is taken by the main project)
6. Kill all Node processes by PID before starting

---

## Branch strategy

- **Permanent branches:** `main`, `staging`, `qa`, `dev` — never delete
- **Feature flow:** cut from `main` → merge to `dev` → `qa` → `staging` → `main`
- **Hotfixes:** cut from `main` → back to `main` → backfill down
- **Naming format:** `feature/NNNNNNN-TYN-XX-short-slug` (7-digit zero-padded counter)
- **Current next branch number:** see MEMORY.md

After merging to main, **push main alone first**, wait for the production build to start (confirm via `list_deployments`), then sync:
```powershell
git checkout dev && git merge main && git push
git checkout qa && git merge main && git push
git checkout staging && git merge main && git push
git checkout main
```

See Vercel webhook rules below — simultaneous multi-branch pushes drop the production build.

---

## Vercel webhook rules

Two confirmed rules for reliable production deploys:

1. **Real file change required.** Empty commits to main get silently dropped (Vercel detects no deployable content changed). Always make a 1-line comment tweak (e.g. in `Dashboard.tsx`) rather than an empty commit.

2. **Push main alone.** Pushing main simultaneously with dev/qa/staging causes the main webhook to be dropped. Correct sequence: push main first, confirm the build starts in Vercel, THEN sync dev/qa/staging separately.

---

## Architecture decisions

### CMS (Payload v3)
- Payload is embedded inside Next.js — one Vercel deployment, no separate CMS server
- All SSR/RSC data fetching uses the **local API** (`payload.find()`, `payload.findGlobal()`) — zero HTTP overhead
- Admin at `/admin`
- Collections: Photos, Galleries, Testimonials, Services, Posts, Users, Pages (visual builder)
- Globals: HeroSlides, AboutPage, SiteConfig, BookingSettings, Availability

### Media (Cloudflare R2)
- Bucket: `tynnell-hollins-photos`
- Public URL via `r2.dev` (custom domain `media.tynnellhollinsphotography.com` pending — TYN-144)
- `generateFileURL` pattern in `payload.config.ts` (not `baseURL`)

### Database migrations
- `npx payload migrate` **fails on Node v24** due to ESM issues
- Use `scripts/migrate-db.mjs` instead — runs DDL directly via `pg`
- This script runs as a Vercel pre-build step (`vercel.json` buildCommand)
- Every schema change (new table, new column, new index) must have a migration block in this file

### Gallery photos field
- `Gallery.photos` is `type: 'array'` with a `photo` relationship sub-field, **not** `hasMany relationship`
- Data stored in `galleries_photos` table (`_order`, `_parent_id`, `photo_id`)
- `galleries_rels` table also exists (from an earlier revert), Payload no longer writes to it
- Site reads `gallery.photos[].photo`, the Photo object is nested one level deep
- The array's default vertical-row UI is replaced by a custom `admin.components.Field` -> `GalleryPhotoArranger`: a visual thumbnail grid with drag-to-reorder, remove, set-cover, and drag-and-drop file upload. Adds also flow through `GalleryBulkPhotoPicker`. The `photo` sub-field (required relationship) still validates on save (TYN-228)
- `Gallery.tapedStyle` (boolean, `taped_style` column) renders the public `/portfolio/[slug]` album with the taped-photo treatment instead of the clean grid (TYN-235)

### Visual page builder (Puck)
- Lets Tynnell build custom pages on a drag-and-drop canvas, on brand and self-hosted. Library: `@measured/puck` (MIT). NO recurring SaaS cost (a core reason for leaving Pixieset). Currently on branch `feature/0000124-TYN-217-section-library`, NOT yet merged to main.
- Storage: the `pages` collection. Each row is one page: `title`, `slug` (unique), `content` (Puck document JSON), `published`, `displayOrder`, `showInNav`, `isHomepage`. Hidden from the admin nav; managed via `/builder`.
- Editor: `/builder` (page list, create/rename/delete/duplicate/reorder, plus In-menu / Homepage toggles) and `/builder/[slug]` (the Puck editor, auth-gated). The editor lazy-loads Puck (`next/dynamic`, `ssr:false`).
- Public render: `app/(site)/[...slug]/page.tsx` catch-all renders published pages via `@measured/puck/rsc`. It only fills slugs not owned by an explicit route; unknown or unpublished slugs `notFound()`. `app/(site)/page.tsx` renders an `isHomepage` page at `/`; `app/lib/nav.ts` merges `showInNav` pages into the site menu (Navbar + MobileMenu, fed from the `(site)` layout).
- Block library + config: `app/builder/puck.config.tsx` (Hero, SectionHeading, Text, SplitImageText, Services, Testimonials, CTA, PhotoGallery, FullWidthImage, Spacer). Per-section Background/Spacing, per-device visibility (`.pk-hide-mobile` / `.pk-hide-desktop` injected at root), and a Photo Gallery "Taped" style. Image fields use `ImagePickerField` (pick from library or upload). Starter templates in `app/builder/templates.ts`.
- Save vs publish: `POST /api/builder/save` honors a `publish` flag. Default false saves a DRAFT (leaves `published` untouched); true publishes. Other routes: `/api/builder/{delete,rename,duplicate,reorder,settings}`.
- KEY GOTCHAS: Puck's preview iframe drops the session cookie on the save fetch (401), so MUST keep `iframe={{ enabled: false }}`. Render props are typed `any` with a file-level eslint-disable (Puck's generic Config carries no per-block prop types). Cross-root-layout links (`/builder` <-> `/admin`) cannot soft-navigate, use plain `<a>` with an eslint-disable.

### Payload admin components
Any time a custom component is added to a collection or global config (Cell, Field, custom view, RowLabel, etc.):
1. Add the component path to the collection/global config
2. Regenerate `app/(payload)/admin/importMap.js`:
   ```powershell
   $env:DATABASE_URI = (Get-Content .env.local | Select-String "^DATABASE_URI=" | ForEach-Object { ($_ -replace "^DATABASE_URI=","").Trim() })
   $env:PAYLOAD_SECRET = "placeholder"
   node node_modules/tsx/dist/cli.mjs node_modules/payload/bin.js generate:importmap
   ```
3. Commit `importMap.js` alongside the config change
4. **Never skip this.** A stale importMap causes `getFromImportMap` failures that blank the entire admin.

### Payload types
After changing collection/global field types, regenerate:
```powershell
$env:DATABASE_URI = (op read "op://Personal/Tynnell_Hollins_Photography_Payload/DATABASE_URI")
node node_modules/tsx/dist/cli.mjs node_modules/payload/bin.js generate:types
```

---

## Key files

| File | Purpose |
|---|---|
| `payload.config.ts` | Payload config (collections, globals, plugins, admin) |
| `payload-types.ts` | Auto-generated TypeScript types from Payload schema |
| `app/(payload)/admin/importMap.js` | Auto-generated component registry — must be committed |
| `app/(payload)/admin/layout.tsx` | Admin layout — imports `custom.css` and `PayloadCssGuard` |
| `app/(payload)/custom.css` | Admin brand theme overrides |
| `components/admin/AdminLogo.tsx` | "Tynnell Hollins Photography" brand mark (login + nav) |
| `components/admin/AdminIcon.tsx` | "TH" monogram icon (nav collapsed state) |
| `components/admin/Dashboard.tsx` | Custom admin dashboard (client component) |
| `components/admin/PhotoGridView.tsx` | Visual photo grid, drag-to-upload, category filters |
| `components/admin/GalleryGridView.tsx` | Visual gallery card grid with category filter |
| `components/admin/GalleryPhotoRowLabel.tsx` | Row label for gallery photo array (superseded by GalleryPhotoArranger; file retained) |
| `components/admin/GalleryPhotoArranger.tsx` | Visual gallery grid: drag-arrange, drag-and-drop upload, remove, set cover (replaces the photos array UI) |
| `components/admin/PhotoEditHeader.tsx` | Custom photo edit header: large preview, metadata, Featured toggle, gallery membership |
| `components/admin/PostGridView.tsx` | Visual blog post grid with status filter |
| `components/admin/PostViewOnSiteButton.tsx` | "View on Site" link in post edit sidebar (dimmed when draft) |
| `components/admin/PayloadCssGuard.tsx` | Forces Payload CSS into static link tag |
| `scripts/migrate-db.mjs` | DB migration runner (used by Vercel pre-build) |
| `app/builder/puck.config.tsx` | Puck block library + per-section style and visibility controls |
| `app/builder/templates.ts` | Starter templates for new builder pages (blank / landing / about / gallery) |
| `app/builder/ImagePickerField.tsx` | Puck image field: pick from library or upload (presign -> R2 -> ingest) |
| `app/builder/[slug]/EditorClient.tsx` | Puck editor: save draft / publish, status pill, help panel, unsaved-changes guard |
| `app/(site)/[...slug]/page.tsx` | Public render of published builder pages (Puck RSC) |
| `app/lib/nav.ts` | Builder pages flagged show-in-menu, merged into the site nav |
| `app/lib/constants.ts` | `CONTACT_EMAIL`, `EMAIL_FROM` (single source of truth) |
| `app/lib/validation.ts` | Form validation helpers |
| `app/lib/emails.ts` | Email HTML templates |
| `app/lib/ratelimit.ts` | Rate limiting via Upstash |
| `app/(site)/styles/tokens.css` | Public site design tokens |

---

## Design tokens (public site)

```css
--color-bg: #0C0C0C
--color-bg-accent: #131313
--color-heading: #D6D1CE
--color-body: #E6E1DE
--color-detail: #9B9A9A
--color-btn-bg: #9B9A9A
--font-display: Tangerine
--font-heading: Archivo
--font-body: Roboto Mono
--padding-x: max(1.25rem, 2.5vw)
```

---

## Pages (public site)

| Route | Description |
|---|---|
| `/` | Home: Hero, PortfolioTeaser, AboutPreview, Testimonials, Contact |
| `/portfolio` | Masonry grid with category filter |
| `/portfolio/[slug]` | Gallery hero + photo grid (photos in Tynnell's sorted order) |
| `/about` | Headshot, bio, tagline, values |
| `/services` | Service cards with features and CTA |
| `/blog` | Featured post hero (most recent, full-width) + remaining posts grid |
| `/blog/[slug]` | Full post with BlogPosting JSON-LD + "More from the Journal" related posts |
| `/contact` | 9-field form wired to `/api/contact` |
| `/book` | Stripe Checkout integration |
| `/book/success`, `/book/cancel` | Post-payment pages |
| `/[...slug]` | Published builder pages (Puck), when the slug is not an explicit route |
| `/builder`, `/builder/[slug]` | Visual page builder (auth-gated, admin only) |
| `/sitemap.xml` | Auto-generated from Payload |

---

## API routes

| Route | Purpose |
|---|---|
| `POST /api/contact` | Contact form, Resend email, rate-limited |
| `POST /api/checkout` | Stripe Checkout session |
| `POST /api/webhooks/stripe` | Handles `checkout.session.completed` |
| `GET /api/robots` | robots.txt (disallows `/admin`, `/api/`) |
| `GET /api/cron/ooo-return-notify` | Daily OOO return notification cron |
| `POST /api/builder/save` | Save (draft) or publish a builder page (`publish` flag) |
| `POST /api/builder/{delete,rename,duplicate,reorder,settings}` | Builder page management + In-menu/Homepage flags |
| `POST /api/upload-presign` | Presigned R2 PUT URL (step 1 of the photo upload pipeline) |
| `POST /api/photos/ingest` | Create the Photo record after the R2 PUT (sharp resize) |

---

## Admin nav groups

The Payload admin sidebar is organized into four groups:

| Group | Items |
|---|---|
| My Portfolio | Photos, Galleries |
| Content | Blog Posts, Testimonials |
| Services & Booking | Services, Booking Settings, Availability |
| Site Settings | Site Config, Hero Slides, About Page |

---

## Admin custom components summary

- `AdminLogo` / `AdminIcon`: registered in `payload.config.ts` under `admin.components.graphics`
- `Dashboard`: registered under `admin.components.views.dashboard`
  - Shows count cards for all collections including Users
  - Posts card shows published vs. draft split beneath total count
  - OOO status card fetches `/api/globals/availability` and shows: Out of Office (amber, with internal label + return date), Next Unavailable (grey, upcoming range), or Available (green). All states link to `/admin/globals/availability`.
  - Recent Activity section (TYN-200): 8 most recently updated photos as a thumbnail strip + 5 most recently updated posts as a list with status + date. Only renders when data exists.
  - Featured sub-counts (TYN-206): Photos shows "X featured", Galleries shows "X featured", Testimonials shows "X on homepage", in addition to Posts' "published / drafts" split.
- `PhotoGridView`: registered on `Photos` collection under `admin.components.views.list.Component`
  - Shows gallery membership badges on each photo card: fetches all galleries once on mount (`/api/galleries?limit=300&depth=0`), builds a `Record<number, string[]>` map, renders up to 2 gallery name pills (+N overflow) below the category text (TYN-194)
  - Featured star toggle button (top-right of each photo): gold filled star = featured, translucent dark = unfeatured. Clicks PATCH `/api/photos/:id` inline without navigating away (TYN-202)
- `GalleryBulkPhotoPicker`: registered on `Galleries` as a `ui` field immediately before the `photos` array
  - "Add Multiple Photos" button opens a fixed-position modal with the full photo library
  - Category filter pills, multi-select via click (checkmark overlay), "Added" overlay for photos already in the gallery
  - Confirm appends selected rows to the array via `useField({ path: 'photos' }).setValue` with `crypto.randomUUID()` IDs
- `CoverPhotoPicker`: registered on `Galleries.coverPhoto` relationship field as `admin.components.Field` (TYN-201)
  - Replaces the default text-search relationship input with a thumbnail preview (96x72) + filename + "Choose/Change Cover Photo" button
  - Opens the same photo grid modal (single-select): category filter, click to select, checkmark on current cover
  - Uses `useField({ path: 'coverPhoto' }).setValue` with the full photo object
- `GalleryGridView`: registered on `Galleries` collection under `admin.components.views.list.Component`
  - Featured quick-toggle on each card: gold "Featured" badge = on homepage, translucent dark = unfeatured. Clicks PATCH `/api/galleries/:id` inline (TYN-204)
- `GalleryPhotoRowLabel`: legacy row label for the photos array, superseded by `GalleryPhotoArranger` (file retained, no longer wired)
- `GalleryPhotoArranger`: registered on `Galleries.photos` array field as `admin.components.Field` (TYN-228 / TYN-235)
  - Replaces the default vertical array rows with a visual thumbnail grid. Reads/writes the `photos` path via `useField`
  - Drag a tile to reorder (grid order = order on the public album), remove a photo, or set the cover photo from the grid (writes `coverPhoto`)
  - Drag image files onto the grid (or Browse) to upload via presign -> R2 -> ingest, auto-tagged with the gallery's category; file-drop vs tile-reorder is disambiguated by the drag payload
- `PhotoEditHeader`: registered on `Photos` as a top `ui` field, `admin.components.Field` (photo edit revamp)
  - Large preview (with onError fallback), filename + dimensions/size/type, category badge, interactive Feature-on-homepage toggle (bound to the form via `useField`), and gallery membership pills. Payload still owns Save, validation, and the upload field
- Testimonials collection: `featured` checkbox (sidebar, default false) -- when checked, testimonial appears on the homepage; the dedicated `/testimonials` page shows all regardless
- `TestimonialsGridView`: registered on `Testimonials` collection under `admin.components.views.list.Component` (TYN-198)
  - Card grid: client name (heading), italic quote excerpt (3-line clamp), session type badge, display order number
  - Filters: session type pills (Wedding/Engagement/Portrait/Family/Maternity/Event) + "Homepage only" toggle + client name search
  - Homepage quick-toggle pill on each card: solid badge = on homepage, dashed border = off. Clicks PATCH `/api/testimonials/:id` inline (TYN-203)
- `ServicesGridView`: registered on `Services` collection under `admin.components.views.list.Component` (TYN-199)
  - Card: eyebrow category, service name, description excerpt (2-line clamp), price badge, bookable deposit badge (green), included item count, display order
- `PostGridView`: registered on `Posts` collection under `admin.components.views.list.Component`
  - Publish/draft quick-toggle: status badge is interactive -- click PATCHes `/api/posts/:id` inline. Draft-to-publish also sets `publishedAt` to now if not yet set (TYN-205)
- `PostViewOnSiteButton`: registered on `Posts.viewOnSite` ui field as `admin.components.Field` (sidebar position)
  - Uses `useFormFields` to read the current `slug` and `status` values
  - Renders a "View on Site" link to `tynnellhollinsphotography.com/blog/[slug]`
  - Dimmed with "Draft - not visible to visitors yet" note when status is draft
  - Hides entirely on a new unsaved post (no slug yet)
- `PayloadCssGuard`: imported in `app/(payload)/admin/layout.tsx` to force CSS into client bundle
- All custom components are `'use client'` with inline styles so they survive hydration failures

**After adding any new admin component**, always regenerate importMap (see above) and commit the result.

---

## Known issues / watch-outs

- **Photo upload 413 + 500 errors (fix deployed, branch 0000115)** - HEIC/HEIF (iPhone default) crashed sharp on Vercel and the error was swallowed, producing an opaque 500. Branch 0000115 rejects HEIC/HEIF/AVIF/TIFF/BMP at presign time (HTTP 415, plain-English message), pre-flights the same check client-side in `PhotoGridView`, wraps the ingest route in catch-all logging so every failure now appears in Vercel runtime logs, corrects `maxDuration` to 60 (Vercel Hobby cap), and adds a 200 MB guard. Any lingering 413 is browser cache (hard refresh: Ctrl+Shift+R). If uploads still fail, check Vercel runtime logs for `/api/photos/ingest` - they now show the exact error.
- **Site preview pane does not exist (TYN-200)** - Tynnell expects a "preview" button/pane in the admin and reported it as broken. It is not broken, it was never built: there is no `livePreview` config in `payload.config.ts`. The only preview affordance today is the blog "View on Site" link (`PostViewOnSiteButton`), which just opens `/blog/[slug]` in a new tab. A real preview needs Payload `admin.livePreview` wired per document type. Note: photos are NOT document-backed pages, so they need a different approach than gallery/post/about live preview (see next entry).
- **How a photo reaches the public site (important mental model)** - Uploading a photo to the library does NOT automatically publish it to a gallery. A Photo doc has no dedicated page. Its appearance is distributed: (1) `/portfolio` masonry shows individual photos filtered by `category` on the All/Portraits/Families/Couples/Brands tabs; (2) the Weddings tab shows ONLY gallery album cards, so a `weddings`-category photo that is not in a gallery is invisible on the Weddings tab (it still appears under All); (3) `/portfolio/[slug]` shows only photos added to that gallery, in gallery order; (4) the homepage portfolio teaser shows up to 6 `featured` photos. So "preview this photo" has no single target URL - the right UX is a contextual "View in Portfolio" link, not a per-document live-preview pane.
- **React hydration error #418** — text node mismatch (`args[]=text&args[]=`) in the admin, source not yet identified. The `PayloadCssGuard` component prevents CSS loss when it fires. Root cause is still open (TYN-179).
- **R2 custom domain (TYN-144)** — media URLs still use `r2.dev`. CNAME `media` is Active in Cloudflare. Remaining step: update `R2_PUBLIC_URL` in Vercel env vars to `https://media.tynnellhollinsphotography.com`. No code change needed.
- **Stripe webhook secret (TYN-182)** — Vercel flags "Needs Attention." Rotate secret in Stripe dashboard and update `STRIPE_WEBHOOK_SECRET` in Vercel env vars.
- **Gallery bulk photo adding** — resolved (TYN-197). `GalleryBulkPhotoPicker` modal lets Tynnell multi-select photos. Single-row "Add Row" still works for one-off additions.
- **Local admin photos 500 + uploads fail on this machine (DEV ONLY, not a code bug)** - Payload's `/api/photos/file/...` thumbnail proxy and the browser R2 upload PUT fail in LOCAL dev with a TLS handshake error (`write EPROTO ... SSL alert number 40`). This is a machine/network issue (almost certainly antivirus or a proxy doing SSL inspection on the R2 endpoint), NOT the code. Photo previews do not render and uploads may fail locally. Everything works on Vercel. Verify anything photo-related on a preview deploy.
- **Local dev secrets:** 1Password is often NOT signed in locally. `npm run dev:secure` / `.\dev.ps1` need `op signin` first. To run plain `next dev`, override the 9 `op://` keys in `.env.local` with dummies (only those are `op://` refs; `DATABASE_URI`, `PAYLOAD_SECRET`, and the R2 keys are literal). Minimum set: `UPSTASH_REDIS_REST_URL/TOKEN` (Redis client validates the URL at import). Middleware only gates when `COMING_SOON=true`, so localhost is not auth-walled. See MEMORY.md for the full dummy set.
- **Visual page builder** lives on `feature/0000124-TYN-217-section-library` (Puck), NOT merged to main. See the "Visual page builder (Puck)" architecture section. Branch also carries a book-page `<a>` -> `<Link>` lint fix that main still needs before its next prod deploy.
- **`feature/page-sections`** exists at commit `eca87f8` — leave it alone.
