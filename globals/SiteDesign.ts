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
  ],
}
