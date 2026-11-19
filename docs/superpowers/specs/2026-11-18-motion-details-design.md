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
   Built (PR #174): `--motion-fast` 0.2s, `--motion-base` 0.35s, `--motion-slow` 1s,
   `--ease` ease-out, in tokens.css. Two changes from the plan above: slow is 1s
   (not 0.9s) to match the Rising Roots reveals and the text rise, and the easing
   is ease-out everywhere (the reference uses ease-out; the old CSS mixed `ease`).
   All 0.2s, 0.3s and 0.35s transitions in the public CSS now use the tokens (91
   declarations, 25 files; 0.3s moved to 0.35s) and `motionTokens.test.ts` fails
   if a stylesheet adds a raw one. Left as they were: sub-0.2s feedback (0.1 to
   0.15s), the 0.4 to 0.7s photo zooms and fades, keyframe animations, and the
   admin and editor screens.
3. **Button hover** for builder buttons and the nav "Inquire" link: colour and a
   small lift, using the existing `--color-btn-hover`. Needs a class, because
   `btnStyle()` is inline and cannot express `:hover`.
   Built (PR #173): every builder button wears `pk-btn` (via `btnProps()`) and a
   rule injected once at the root changes the colour on hover and keyboard focus
   (beats the inline background with `!important`); the 2px lift and 0.2s ease only
   run with hover available, no reduced-motion, and animations on. The nav Inquire
   link already had its own hover (fade to 75%), so it is left as is.
4. **Photo cross-fade inside a frame** (the Rising Roots signature effect, found
   in the 2026-11-18 side-by-side; it replaces the earlier "photo zoom on hover"
   idea): Split Image + Text gets an Extra photos list, and the frame fades each
   photo in over the one beneath as it scrolls through the screen. PR #168.
   Photo hover zoom stays as it is on album cards.
5. **Hero parallax**: a `photoMovement` choice on the Hero block, same levels as
   other blocks. Built in PR #169: applies to the Bottom-aligned, Centered and
   Split layouts; ignored when "Stays fixed" is chosen (already a parallax); new
   heroes default to Gentle, saved heroes have no value and stay still until the
   layouts are updated (item 6).
   Item 6 (PR #170): all six layouts set Gentle on every hero and side-by-side
   photo; the live pages were updated the same day (14 blocks, backed up first).
   The stacked Split photo stays still (no layout uses that layout).
6. **Turn parallax on in the six page layouts** (Gentle on large photos, none on
   small ones), and on the stacked SplitImageText photo. New pages get it; the
   live pages need a separate, backed-up data update, done only on Alex's yes.
7. **Staggered fade-up** for repeated items (cards, steps, columns, FAQ rows):
   each item rises a little after the one before, instead of the whole block
   rising at once.
   Built (PR #176): heading first (index 0), then each item 120ms after the one
   before (capped at the 7th step), on Stats Row, Services, Testimonials, Choice
   Cards, Packages, Booking Steps, Columns List and Accordion rows. `FadeUp` takes a
   `stagger` prop: the wrapper stops fading and publishes `data-fade-phase`, and
   rules in `app/builder/stagger.ts` animate the items marked `pk-stagger`. Stops
   with reduced motion and "Enable animations" off, like the rest (the phase is
   never set). Not staggered: the live Services and Testimonials blocks and album
   grids (their items are separate components).
8. **Accordion** open and close eases open instead of snapping.
   Built (PR #177): each answer is a one-row grid that grows from 0fr to 1fr on
   `--motion-base` / `--ease` (no height is measured) while its text fades; a shut
   answer is also `visibility:hidden` once collapsed, so keyboard and screen readers
   skip it, and the button now has `aria-controls`. Answers now stay in the page
   when shut. Reduced motion and the /design animations switch already cut every
   transition globally (`globals.css`), so there is no extra switch.
9. **Page-to-page fade** between routes: a short fade on the main content, with
   the nav and footer held still.
   Built (PR #178): `PageFade` (client component inside `#main-content` in the
   site layout) is keyed on the full pathname, so every client-side navigation
   remounts the page area and it fades in (opacity only, `--motion-base`, `--ease`,
   `backwards` fill). Not a `template.tsx`: that only remounts when the first path
   segment changes, so /blog to /blog/a-post would not fade. The first page load
   never fades (module flag set after first hydration), so nothing is hidden before
   paint. Fade-in only, no fade-out of the old page (no exit animation without the
   View Transitions API). Reduced motion and animations off collapse it globally.
10. **Distances tuned by eye** on the live site after 6 is on, with Alex's
    comparison against Rising Roots (the reference cannot be measured by
    automation).

## Calls made (mine, not Alex's)

- Text rise (2026-11-18, at Alex's request): measured on risingroots.showit.site, the
  reference has no scroll-triggered text rise at all (its text is static; motion is
  photos, the hero fade and the nav). Alex asked for a stronger rise and to follow
  the reference "if not better", so ours is deliberately a notch past it: 48px (was
  24px) over 1s with ease-out (the reference's easing), starting once the block is
  12% inside the screen, plus a fallback watcher so a short last block still shows.

- Palette match (2026-11-18, Tynnell said the colours looked off): measured on
  risingroots.showit.site and on ours. The theme values already match exactly
  (bone #E4E2D8, olive #6F6950, deep olive #2E2A19, cream #ECE9E0, body #242424,
  hover #2E2A19, card #D4D1C4, footer olive with cream words). The differences were
  usage: hero text was pure white (now cream), the hero scrim and section photo
  scrims were neutral black rgba(12,12,12) (now the palette overlay colour, deep
  olive), the transparent nav was pure white (now cream), and sections could not
  be an olive or deep-olive band with cream words, which the reference alternates
  (About story band olive, closing call to action deep olive). Added "Olive band"
  and "Deep olive band" to every section Background control. Not changed: the
  /design photo muting (0.65), which is a chosen setting.

- Hover and stagger have no per-block control. The "Enable animations" switch is
  the control, which keeps the builder from growing another field per effect.
- Parallax (retuned 2026-11-19, PR #181): measured on Rising Roots, its large photos
  drift about 0.5px per px scrolled and move SLOWER than the page; ours moved faster
  (inverted) at about 0.07. Direction flipped, levels raised to gentle 12, medium 22,
  strong 35 percent of frame height (strong is about 0.4 on a 1025px frame; a larger
  range would crop and zoom every photo further). Their hero photo does not move at
  all. Decided 2026-11-19 (Alex): heroes stand still (`none`) and the side-by-side
  photos use Medium, in the six layouts and, by backed-up SQL, on the six live pages
  (8 photos moved Gentle to Medium, 6 heroes to still). Large photos on Strong is
  still open.
- No smooth or inertial scrolling (the reference has none).
- Cross-fade (item 4): the fade window (the middle half of the frame's trip across
  the screen, `CROSSFADE_START` 0.25 to `CROSSFADE_END` 0.75 in
  `app/hooks/crossfade.ts`) is a fixed code constant, not an owner control. This is
  the recorded exception to the TYN-338 style-exposure rule: Tynnell's controls
  are the Extra photos list (empty is the off switch) and the /design "Enable
  animations" switch, and a timing slider would be a control nobody can judge
  without watching. It is off while "Scroll overlap" pins the section (a pinned
  frame stops moving, which would freeze it half-blended), and it replaces the
  single-photo "Scroll fade-in" colour effect.
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
