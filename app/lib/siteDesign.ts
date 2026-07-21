import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { SiteDesign } from '@/payload-types'
import { DEFAULT_THEME, type SiteTheme } from './siteTheme'

export type { SiteTheme } from './siteTheme'
export { DEFAULT_THEME, themeToCssVarMap, themeToCssVars } from './siteTheme'

// Server-only: reads the SiteDesign global (TYN-314) for the (site) root
// layout's per-request <style> override. Falls back to tokens.css's hardcoded
// defaults on any DB hiccup or before the global is ever saved, so a
// missing/broken SiteDesign doc never takes down the public site. Kept in
// its own module (not app/lib/siteTheme.ts) because getPayload/@payload-config
// pull in server-only code that breaks the /design editor's client bundle if
// imported from a 'use client' component - see siteTheme.ts's header comment.
//
// Wrapped in React's cache() (TYN-321) so generateMetadata's favicon lookup
// and the layout body's <style> lookup share one DB read per request instead
// of two - both call this same function independently within one request.
export const getSiteDesign = cache(async (): Promise<SiteTheme> => {
  try {
    const payload = await getPayload({ config })
    const doc = (await payload.findGlobal({ slug: 'site-design' })) as SiteDesign
    return {
      logoUrl: doc.logoUrl || DEFAULT_THEME.logoUrl,
      faviconUrl: doc.faviconUrl || DEFAULT_THEME.faviconUrl,
      watermarkEnabled: doc.watermarkEnabled ?? false,
      watermarkUrl: doc.watermarkUrl || DEFAULT_THEME.watermarkUrl,
      headingFont: doc.headingFont || DEFAULT_THEME.headingFont,
      bodyFont: doc.bodyFont || DEFAULT_THEME.bodyFont,
      colorBg: doc.colorBg || DEFAULT_THEME.colorBg,
      colorBgAccent: doc.colorBgAccent || DEFAULT_THEME.colorBgAccent,
      colorHeading: doc.colorHeading || DEFAULT_THEME.colorHeading,
      colorBody: doc.colorBody || DEFAULT_THEME.colorBody,
      colorDetail: doc.colorDetail || DEFAULT_THEME.colorDetail,
      colorBtnBg: doc.colorBtnBg || DEFAULT_THEME.colorBtnBg,
      tapeMatColor: doc.tapeMatColor || DEFAULT_THEME.tapeMatColor,
      tapeColor: doc.tapeColor || DEFAULT_THEME.tapeColor,
      spacingScale: doc.spacingScale || DEFAULT_THEME.spacingScale,
      buttonStyle: doc.buttonStyle || DEFAULT_THEME.buttonStyle,
      animationsEnabled: doc.animationsEnabled ?? true,
      sharpeningLevel: doc.sharpeningLevel || DEFAULT_THEME.sharpeningLevel,
    }
  } catch {
    return DEFAULT_THEME
  }
})
