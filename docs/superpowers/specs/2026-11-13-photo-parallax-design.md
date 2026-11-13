# Photo parallax and text fade-up (TYN-358), short design

Date: 2026-11-13. Approved in chat by Alex ("Yes, go with A and file it in Linear").
Linear: https://linear.app/tynnell-hollins-photography/issue/TYN-358

## Intent

Alex wants the scroll feel of Rising Roots on Tynnell's site. Measured on the
reference: no smooth or inertial scrolling (the scroll position stops with the
wheel). The feel is photo parallax (three speeds, tied to scroll position) plus
slow fade-ins. Photo colour-on-scroll already exists (TYN-353).

## Approach (chosen: A)

A small hook of our own using `requestAnimationFrame` and `IntersectionObserver`,
no new dependency. Rejected: CSS scroll-driven animations (weak Safari/Firefox
support, visitors would see still photos) and GSAP ScrollTrigger (extra weight on
every page, a second animation system).

## Design

- `app/hooks/parallax.ts`: pure helpers. `parallaxProgress(rect, viewportHeight)`
  returns 0 when the frame's top meets the viewport bottom and 1 when its bottom
  meets the viewport top (clamped). `parallaxTranslatePercent(progress, range)`
  returns the layer offset as a percent of the frame height, moving from
  `+range` to `-range` (the reference direction: the photo travels faster than
  the page). `PARALLAX_RANGE`: gentle 0.08, medium 0.15, strong 0.25 of the
  frame height. Values are tuned by eye on a preview, not the reference's raw
  numbers, because our layer is oversized to avoid gaps.
- `app/builder/ParallaxLayer.tsx`: `ParallaxLayer({ level, children })`. For
  `none` or no level it renders the children untouched (no wrapper, so every
  existing page is identical). Otherwise it renders a clipped frame holding an
  oversized layer (`top: -range`, `height: 100% + 2 * range`) that is translated
  on scroll while the frame is near the viewport. The children keep their own
  `position:absolute; inset:0` styling, so `ScrollFadeImage` still works inside.
- `app/builder/FadeUp.tsx`: `FadeUp({ enabled, children })` fades and lifts its
  content (opacity 0 to 1, 24px to 0, 0.9s) once when it enters the viewport.
- Motion is off whenever `prefers-reduced-motion: reduce` matches or
  `<html data-animations="off">` is set (the /design "Enable animations"
  switch). The check runs on every frame, so the live preview toggle works
  without a reload. When off, content shows immediately and nothing moves.
- Page builder: a shared `photoMovement` select (None, Gentle, Medium, Strong) in
  `styleFields`, passed to `Section` and `SplitImageText`. A shared `textFadeUp`
  radio (On/Off) wraps each section's content. Photos in the `stacked`
  SplitImageText layout and the carousel/slideshow blocks are left alone for now.

## Calls made (not yet Alex's)

- Existing saved blocks have no `photoMovement`, which means `none`: live pages do
  not change until a block is edited. New blocks default to `gentle`.
- Existing blocks have no `textFadeUp`, which means ON, so existing pages gain
  the fade-up. Turn off per block, or globally with the animations switch.
- The hero block and promoted static pages are not covered in this ticket.

## Non-goals

Inertial scrolling, GSAP, non-builder pages, the hero block.

## Done when

See TYN-358. Verified on a preview against the reference.
