// The freebie guide PDF uploaded from Site Settings (Rising Roots gap 5).
// Shared by the signing route and the upload button, so both refuse the same
// files. 25 MB is far more than a designed guide needs, and small enough that
// a slow connection still finishes inside the signed link's 10 minutes.
export const MAX_FREEBIE_PDF_BYTES = 25 * 1024 * 1024

export function isPdfFileName(name: string): boolean {
  return /\.pdf$/i.test(name.trim())
}
