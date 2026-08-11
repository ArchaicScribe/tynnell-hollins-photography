import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/app/lib/access'

// Site-wide theme (TYN-314): logo, fonts, colors, spacing, button style, and
// animations, editable from the custom /design Studio page (Pixieset-style
// live-preview editor) rather than Payload's own admin UI - hidden from the
// Payload nav entirely, same pattern as the `pages` collection (managed via
// /builder instead of /admin/collections/pages).
export const SiteDesign: GlobalConfig = {
  slug: 'site-design',
  label: 'Site Design',
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    hidden: true,
  },
  fields: [
    {
      name: 'logoUrl',
      type: 'text',
      label: 'Logo image URL',
    },
    {
      name: 'faviconUrl',
      type: 'text',
      label: 'Favicon image URL',
    },
    {
      name: 'watermarkEnabled',
      type: 'checkbox',
      label: 'Apply watermark to gallery previews',
      defaultValue: false,
    },
    {
      name: 'watermarkUrl',
      type: 'text',
      label: 'Watermark image URL',
    },
    {
      name: 'headingFont',
      type: 'select',
      label: 'Heading font',
      defaultValue: 'poppins',
      options: [
        { label: 'Poppins', value: 'poppins' },
        { label: 'Tangerine', value: 'tangerine' },
        { label: 'Abril Fatface', value: 'abril' },
        { label: 'Cormorant Garamond', value: 'cormorant' },
        { label: 'Barlow', value: 'barlow' },
        { label: 'Jost', value: 'jost' },
      ],
    },
    {
      name: 'bodyFont',
      type: 'select',
      label: 'Body font',
      defaultValue: 'poppins',
      options: [
        { label: 'Poppins', value: 'poppins' },
        { label: 'Tangerine', value: 'tangerine' },
        { label: 'Abril Fatface', value: 'abril' },
        { label: 'Cormorant Garamond', value: 'cormorant' },
        { label: 'Barlow', value: 'barlow' },
        { label: 'Jost', value: 'jost' },
      ],
    },
    {
      name: 'colorBg',
      type: 'text',
      label: 'Background color',
      defaultValue: '#0C0C0C',
    },
    {
      name: 'colorBgAccent',
      type: 'text',
      label: 'Accent background color',
      defaultValue: '#131313',
    },
    {
      name: 'colorHeading',
      type: 'text',
      label: 'Heading text color',
      defaultValue: '#D6D1CE',
    },
    {
      name: 'colorBody',
      type: 'text',
      label: 'Body text color',
      defaultValue: '#E6E1DE',
    },
    {
      name: 'colorDetail',
      type: 'text',
      label: 'Detail/muted text color',
      defaultValue: '#9B9A9A',
    },
    {
      name: 'colorBtnBg',
      type: 'text',
      label: 'Button color',
      defaultValue: '#9B9A9A',
    },
    // Rising Roots works in four type roles rather than two: a display serif,
    // an italic serif for accent lines, a body sans, and a script reserved for
    // single-word moments like the Inquire CTA. headingFont/bodyFont above
    // cover the first and third; these two add the rest.
    {
      name: 'accentFont',
      type: 'select',
      label: 'Accent font (italic serif)',
      defaultValue: 'cormorant',
      options: [
        { label: 'Cormorant Garamond', value: 'cormorant' },
        { label: 'Poppins', value: 'poppins' },
        { label: 'Tangerine', value: 'tangerine' },
        { label: 'Abril Fatface', value: 'abril' },
        { label: 'Barlow', value: 'barlow' },
        { label: 'Jost', value: 'jost' },
      ],
    },
    {
      name: 'scriptFont',
      type: 'select',
      label: 'Script font (accents and CTAs)',
      defaultValue: 'parisienne',
      options: [
        { label: 'Parisienne', value: 'parisienne' },
        { label: 'Tangerine', value: 'tangerine' },
      ],
    },
    // The six colors above cover text and the two page grounds, but a real
    // light/dark inversion also needs the card, hover, button-text, and border
    // tokens, which used to be hardcoded dark in tokens.css. Without these,
    // switching to a light ground leaves dark cards and invisible borders
    // behind. Defaults deliberately match the previous hardcoded values, so
    // adding them changes nothing until someone edits them in /design.
    {
      name: 'colorBgCard',
      type: 'text',
      label: 'Card background color',
      defaultValue: '#1a1a1a',
    },
    {
      name: 'colorBgHover',
      type: 'text',
      label: 'Hover background color',
      defaultValue: '#222222',
    },
    {
      name: 'colorBgOverlay',
      type: 'text',
      label: 'Overlay box color (sits on photos)',
      defaultValue: 'rgba(12, 12, 12, 0.76)',
    },
    {
      name: 'colorBtnText',
      type: 'text',
      label: 'Button text color',
      defaultValue: '#E6E1DE',
    },
    {
      name: 'colorBtnHover',
      type: 'text',
      label: 'Button hover color',
      defaultValue: '#807F7F',
    },
    {
      name: 'colorBorder',
      type: 'text',
      label: 'Border color',
      defaultValue: 'rgba(214, 209, 206, 0.08)',
    },
    {
      name: 'colorBorderSubtle',
      type: 'text',
      label: 'Subtle border color',
      defaultValue: 'rgba(214, 209, 206, 0.06)',
    },
    {
      name: 'colorBorderSolid',
      type: 'text',
      label: 'Solid border color',
      defaultValue: '#1e1e1e',
    },
    {
      name: 'tapeMatColor',
      type: 'text',
      label: 'Photo mat color (tape/polaroid frames)',
      defaultValue: '#f4efe8',
    },
    {
      name: 'tapeColor',
      type: 'text',
      label: 'Tape strip color',
      defaultValue: 'rgba(214, 209, 206, 0.42)',
    },
    // The frame shadow was the last hardcoded piece of the taped treatment,
    // and it was tuned for the old charcoal ground: a heavy near-black drop
    // that reads as dirt on a light paper ground. A select of presets rather
    // than a raw CSS string, because "0 10px 26px rgba(0,0,0,0.45)" is not a
    // control Tynnell can reason about.
    {
      name: 'tapeShadow',
      type: 'select',
      label: 'Photo frame shadow',
      defaultValue: 'soft',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Soft', value: 'soft' },
        { label: 'Medium', value: 'medium' },
        { label: 'Strong', value: 'strong' },
      ],
    },
    // Two shell-level finishes (Rising Roots). Both are applied BY the shell
    // rather than baked into any individual photo, so they work on whatever
    // Tynnell uploads later. Both default to off, so this is inert until set.
    {
      name: 'paperGrain',
      type: 'select',
      label: 'Paper grain texture',
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Subtle', value: 'subtle' },
        { label: 'Medium', value: 'medium' },
        { label: 'Strong', value: 'strong' },
      ],
    },
    {
      name: 'photoTreatment',
      type: 'select',
      label: 'Photo color treatment',
      defaultValue: 'color',
      options: [
        { label: 'Full color', value: 'color' },
        { label: 'Muted', value: 'muted' },
        { label: 'Nearly black & white', value: 'faded' },
        { label: 'Black & white', value: 'bw' },
      ],
    },
    {
      name: 'spacingScale',
      type: 'select',
      label: 'Overall spacing',
      defaultValue: 'normal',
      options: [
        { label: 'Compact', value: 'compact' },
        { label: 'Normal', value: 'normal' },
        { label: 'Spacious', value: 'spacious' },
      ],
    },
    {
      name: 'buttonStyle',
      type: 'select',
      label: 'Button shape',
      defaultValue: 'sharp',
      options: [
        { label: 'Sharp', value: 'sharp' },
        { label: 'Rounded', value: 'rounded' },
        { label: 'Pill', value: 'pill' },
      ],
    },
    {
      name: 'animationsEnabled',
      type: 'checkbox',
      label: 'Enable animations',
      defaultValue: true,
    },
    {
      // TYN-325: applied to new uploads' web display sizes only, never the
      // full original (see app/lib/sharpening.ts).
      name: 'sharpeningLevel',
      type: 'select',
      label: 'Photo sharpening',
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Subtle', value: 'subtle' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Strong', value: 'strong' },
      ],
    },
  ],
}
