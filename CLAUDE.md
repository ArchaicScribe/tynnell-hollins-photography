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

After merging to main, always sync down:
```powershell
git checkout dev && git merge main && git push
git checkout qa && git merge main && git push
git checkout staging && git merge main && git push
git checkout main
```

---

## Architecture decisions

### CMS (Payload v3)
- Payload is embedded inside Next.js — one Vercel deployment, no separate CMS server
- All SSR/RSC data fetching uses the **local API** (`payload.find()`, `payload.findGlobal()`) — zero HTTP overhead
- Admin at `/admin`
- Collections: Photos, Galleries, Testimonials, Services, Posts, Users
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

### Payload admin components
Any time a custom component is added to a collection or global config (Cell, Field, custom view, etc.):
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
| `components/admin/PayloadCssGuard.tsx` | Forces Payload CSS into static link tag |
| `scripts/migrate-db.mjs` | DB migration runner (used by Vercel pre-build) |
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
| `/portfolio/[slug]` | Gallery hero + photo grid |
| `/about` | Headshot, bio, tagline, values |
| `/services` | Service cards with features and CTA |
| `/blog` | Post cards with cover image, date, excerpt |
| `/blog/[slug]` | Full post with BlogPosting JSON-LD |
| `/contact` | 9-field form wired to `/api/contact` |
| `/book` | Stripe Checkout integration |
| `/book/success`, `/book/cancel` | Post-payment pages |
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
- `PhotoGridView`: registered on `Photos` collection under `admin.components.views.list.Component`
- `GalleryGridView`: registered on `Galleries` collection under `admin.components.views.list.Component`
- `PayloadCssGuard`: imported in `app/(payload)/admin/layout.tsx` to force CSS into client bundle
- All custom components are `'use client'` with inline styles so they survive hydration failures

**After adding any new admin component**, always regenerate importMap (see above) and commit the result.

---

## Known issues / watch-outs

- **React hydration error #418** — text node mismatch (`args[]=text&args[]=`) in the admin, source not yet identified. The `PayloadCssGuard` component prevents CSS loss when it fires. Root cause is still open (TYN-179).
- **Resend domain verification** — DKIM/SPF for `tynnellhollinsphotography.com` needed before forgot-password emails deliver. Check Resend dashboard.
- **R2 custom domain (TYN-144)** — media URLs still use `r2.dev`. Add CNAME `media` in Cloudflare, then update `R2_PUBLIC_URL` in Vercel env vars.
- **`feature/page-sections`** exists at commit `eca87f8` — leave it alone.
