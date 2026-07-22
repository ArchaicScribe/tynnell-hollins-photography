// Shared slugify for a Service's booking link (/book?package=<slug>). Was
// duplicated identically in services/page.tsx and book/BookClient.tsx; also
// used by the LiveServices builder block (app/builder/puck.config.tsx) so
// all three stay in sync without copy-pasting the regex a third time.
export function slugifyServiceTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
