# Motion and details (Rising Roots step 5), short design

Date: 2026-11-18. Alex opted out of the questions ("Just propose a full list and
go"), so this list is my proposal, not an approved design. Nothing here has been
agreed beyond that instruction. Build in small PRs, each checked live in Chrome.

## Intent

Steps 1 to 4 made the site look like Rising Roots. Step 5 makes it feel like it
as you scroll, hover and move between pages. Tynnell edits the site herself, so
every effect is either automatic and quiet, or a control in the builder or
/design (the TYN-338 rule). Every effect also stops when the /design "Enable
animations" switch is off or the visitor prefers reduced motion.

## What exists today (found 2026-11-18)

- Text fade-up (`FadeUp`) is on for every builder section.
- Photo parallax (`ParallaxLayer`, `app/hooks/parallax.ts`) is wired into the
  Section background and the SplitImageText photo. Saved blocks have no
  `photoMovement`, so it is off everywhere live. The Rising Roots page layouts
  (`homeLayout`, `aboutLayout`, `weddingLayout`, `portraitsLayout`,
  `myWorkLayout`, `contactLayout`) do not set it.
- The Hero block, stacked SplitImageText photos, carousel and slideshow have no
  parallax.
- Hover and transition styling is scattered: nav links and the nav background
  have their own timings, album cards zoom on hover, taped frames tilt, and the
  builder buttons (`btnStyle()` in `app/builder/puck.config.tsx`) have no hover
  state at all. Timings and easing are different in each place.

## Proposed list

1. **Fix the transition Alex flagged ("the transition also isn't right").**
   Which transition is not yet known; see Open below. This comes first.
2. **One set of motion tokens** (`--motion-fast` 0.2s, `--motion-base` 0.35s,
   `--motion-slow` 0.9s, one `--ease`) in `app/(site)/styles/tokens.css`, used by
   everything below, so the site moves with one feel.
3. **Button hover** for builder buttons and the nav "Inquire" link: colour and a
   small lift, using the existing `--color-btn-hover`. Needs a class, because
   `btnStyle()` is inline and cannot express `:hover`.
4. **Photo hover**: a slow gentle zoom on album cards, Choice Cards and gallery
   tiles, matching what `AlbumGrid` already does, so every photo card behaves the
   same.
5. **Hero parallax**: a `photoMovement` choice on the Hero block, same levels as
   other blocks.
6. **Turn parallax on in the six page layouts** (Gentle on large photos, none on
   small ones), and on the stacked SplitImageText photo. New pages get it; the
   live pages need a separate, backed-up data update, done only on Alex's yes.
7. **Staggered fade-up** for repeated items (cards, steps, columns, FAQ rows):
   each item rises a little after the one before, instead of the whole block
   rising at once.
8. **Accordion** open and close eases open instead of snapping.
9. **Page-to-page fade** between routes: a short fade on the main content, with
   the nav and footer held still.
10. **Distances tuned by eye** on the live site after 6 is on, with Alex's
    comparison against Rising Roots (the reference cannot be measured by
    automation).

## Calls made (mine, not Alex's)

- Hover and stagger have no per-block control. The "Enable animations" switch is
  the control, which keeps the builder from growing another field per effect.
- Parallax distances stay at gentle 8, medium 15, strong 25 percent until tuned.
- No smooth or inertial scrolling (the reference has none).
- Item 9 uses a plain CSS fade, not the browser View Transitions API, because
  Safari and Firefox support is uneven and a missing effect would look like a
  bug.

## Non-goals

Inertial scrolling, GSAP, a loading screen, cursor effects, sound, anything that
moves text sideways, and changing words or layout on any page.

## Open

Which transition Alex means. Candidates: the nav bar changing from clear to
solid, the menu opening, the hero giving way to the first section, the fade-up of
text, or moving between pages.

## Done when

Each item is verified on the live site in Chrome, with `data-animations="off"`
and reduced motion both stopping it, and the full test suite green.
