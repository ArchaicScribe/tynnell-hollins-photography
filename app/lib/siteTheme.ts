// Client-safe theme utilities (TYN-314): the SiteTheme shape, its defaults,
// and pure CSS-var mapping. Deliberately has NO imports from 'payload' or
// '@payload-config' - those pull in server-only code (next/cache's
// revalidatePath, used by several collection hooks) transitively through
// payload.config.ts, which breaks the client bundle for /design's
// 'use client' editor if it's imported from the same module as
// getSiteDesign() (see app/lib/siteDesign.ts, the server-only counterpart).
// Rising Roots adds a display serif, a body sans, a letterspaced label sans and
// a script to the original Poppins/Tangerine/Abril set. NyghtSerif and Nostalgia
// (what the reference template actually uses) are commercially licensed and are
// deliberately not embedded - Cormorant Garamond and Parisienne stand in.
export type FontChoice = 'poppins' | 'tangerine' | 'abril' | 'cormorant' | 'barlow' | 'jost'
export type ScriptChoice = 'parisienne' | 'tangerine'

// Shell-level finishes: applied by the shell over whatever photos exist,
// rather than baked into the files themselves.
export type PaperGrain = 'none' | 'subtle' | 'medium' | 'strong'
export type PhotoTreatment = 'color' | 'muted' | 'faded' | 'bw'

export interface SiteTheme {
  logoUrl: string
  faviconUrl: string
  watermarkEnabled: boolean
  watermarkUrl: string
  headingFont: FontChoice
  bodyFont: FontChoice
  accentFont: FontChoice
  scriptFont: ScriptChoice
  colorBg: string
  colorBgAccent: string
  colorHeading: string
  colorBody: string
  colorDetail: string
  colorBtnBg: string
  colorBgCard: string
  colorBgHover: string
  colorBgOverlay: string
  colorBtnText: string
  colorBtnHover: string
  colorBorder: string
  colorBorderSubtle: string
  colorBorderSolid: string
  tapeMatColor: string
  tapeColor: string
  paperGrain: PaperGrain
  photoTreatment: PhotoTreatment
  spacingScale: 'compact' | 'normal' | 'spacious'
  buttonStyle: 'sharp' | 'rounded' | 'pill'
  animationsEnabled: boolean
  sharpeningLevel: 'none' | 'subtle' | 'moderate' | 'strong'
}

export const DEFAULT_THEME: SiteTheme = {
  logoUrl: '',
  faviconUrl: '',
  watermarkEnabled: false,
  watermarkUrl: '',
  headingFont: 'poppins',
  bodyFont: 'poppins',
  accentFont: 'cormorant',
  scriptFont: 'parisienne',
  colorBg: '#0C0C0C',
  colorBgAccent: '#131313',
  colorHeading: '#D6D1CE',
  colorBody: '#E6E1DE',
  colorDetail: '#9B9A9A',
  colorBtnBg: '#9B9A9A',
  colorBgCard: '#1a1a1a',
  colorBgHover: '#222222',
  colorBgOverlay: 'rgba(12, 12, 12, 0.76)',
  colorBtnText: '#E6E1DE',
  colorBtnHover: '#807F7F',
  colorBorder: 'rgba(214, 209, 206, 0.08)',
  colorBorderSubtle: 'rgba(214, 209, 206, 0.06)',
  colorBorderSolid: '#1e1e1e',
  tapeMatColor: '#f4efe8',
  tapeColor: 'rgba(214, 209, 206, 0.42)',
  paperGrain: 'none',
  photoTreatment: 'color',
  spacingScale: 'normal',
  buttonStyle: 'sharp',
  animationsEnabled: true,
  sharpeningLevel: 'none',
}

// Every face except poppins maps to its own next/font variable. poppins is the
// historic default for heading/body, so those two roles skip the override
// entirely and fall through to tokens.css rather than emitting a redundant var.
const FONT_ROLE_VAR: Record<Exclude<FontChoice, 'poppins'> | 'parisienne', string> = {
  tangerine: 'var(--font-display)',
  abril: 'var(--font-display-bold)',
  cormorant: 'var(--font-serif)',
  barlow: 'var(--font-sans)',
  jost: 'var(--font-label)',
  parisienne: 'var(--font-script)',
}

const POPPINS_VAR = "'Poppins', sans-serif"

// Unlike heading/body, the accent and script roles have no historic default to
// fall through to, so they always emit a concrete value.
function fontVar(choice: FontChoice | ScriptChoice): string {
  return choice === 'poppins' ? POPPINS_VAR : FONT_ROLE_VAR[choice]
}

const SPACE_SCALE: Record<SiteTheme['spacingScale'], number> = {
  compact: 0.75,
  normal: 1,
  spacious: 1.35,
}

// Grain opacity is kept low on purpose. Above ~0.09 the texture starts
// competing with the photography instead of sitting under it.
const GRAIN_OPACITY: Record<PaperGrain, string> = {
  none: '0',
  subtle: '0.035',
  medium: '0.06',
  strong: '0.09',
}

// saturate() rather than grayscale() so "muted" and "faded" are real points on
// the same axis; bw is the 0 end of it.
const PHOTO_SATURATION: Record<PhotoTreatment, string> = {
  color: '1',
  muted: '0.65',
  faded: '0.3',
  bw: '0',
}

const BTN_RADIUS: Record<SiteTheme['buttonStyle'], string> = {
  sharp: '2px',
  rounded: '8px',
  pill: '999px',
}

// Maps theme values to concrete CSS custom-property values. Shared by the
// server-rendered <style> override (themeToCssVars) and the client-side live
// preview bridge (DesignClient/DesignPreviewBridge), so both stay in sync.
export function themeToCssVarMap(theme: SiteTheme): Record<string, string> {
  const map: Record<string, string> = {
    '--color-bg': theme.colorBg,
    '--color-bg-accent': theme.colorBgAccent,
    '--color-heading': theme.colorHeading,
    '--color-body': theme.colorBody,
    '--color-detail': theme.colorDetail,
    '--color-btn-bg': theme.colorBtnBg,
    '--color-bg-card': theme.colorBgCard,
    '--color-bg-hover': theme.colorBgHover,
    '--color-bg-overlay': theme.colorBgOverlay,
    '--color-btn-text': theme.colorBtnText,
    '--color-btn-hover': theme.colorBtnHover,
    '--color-border': theme.colorBorder,
    '--color-border-subtle': theme.colorBorderSubtle,
    '--color-border-solid': theme.colorBorderSolid,
    '--tape-mat': theme.tapeMatColor,
    '--tape-color': theme.tapeColor,
    '--paper-grain-opacity': GRAIN_OPACITY[theme.paperGrain],
    '--photo-saturation': PHOTO_SATURATION[theme.photoTreatment],
    '--space-scale': String(SPACE_SCALE[theme.spacingScale]),
    '--btn-radius': BTN_RADIUS[theme.buttonStyle],
  }
  if (theme.headingFont !== 'poppins') map['--font-heading'] = FONT_ROLE_VAR[theme.headingFont]
  if (theme.bodyFont !== 'poppins') map['--font-body'] = FONT_ROLE_VAR[theme.bodyFont]
  map['--font-accent'] = fontVar(theme.accentFont)
  map['--font-script-role'] = fontVar(theme.scriptFont)
  return map
}

// Builds the `:root{...}` declaration body (no selector wrapper) for the
// server-rendered <style> tag in the (site) root layout.
export function themeToCssVars(theme: SiteTheme): string {
  return Object.entries(themeToCssVarMap(theme))
    .map(([k, v]) => `${k}: ${v};`)
    .join('\n  ')
}
