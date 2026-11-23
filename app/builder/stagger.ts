import type { CSSProperties } from 'react'

// Step 5, item 7: staggered fade-up. A section with repeated items marks its
// heading (index 0) and each item (1, 2, 3 ...) with staggerItem(); FadeUp then
// publishes data-fade-phase on its wrapper and these rules do the rest. The delay
// is capped at the 7th step so a long list does not keep the last items waiting
// (FadeUp's settle timer allows for exactly that tail).
export const STAGGER_CSS = `
[data-fade-phase="hidden"] .pk-stagger{opacity:0;transform:translateY(48px)}
[data-fade-phase="revealed"] .pk-stagger{opacity:1;transform:translateY(0);transition:opacity var(--motion-slow,1s) var(--ease,ease-out),transform var(--motion-slow,1s) var(--ease,ease-out);transition-delay:calc(min(var(--i,0),7)*120ms)}
@media print{[data-fade-up],[data-fade-up] .pk-stagger{opacity:1 !important;transform:none !important;transition:none !important}}
`

export function staggerItem(i: number, style: CSSProperties = {}): { className: string; style: CSSProperties } {
  return { className: 'pk-stagger', style: { ...style, '--i': i } as CSSProperties }
}
