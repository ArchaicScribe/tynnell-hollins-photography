// TYN-311: the request body for creating a collection from the Create New
// Collection page. Pure, so it can be tested without rendering the form.
//
// It never includes a status (or taped style, featured, downloads): the
// Galleries create hook fills those from Gallery Presets (TYN-323) only for
// values the request leaves out, so sending one here would override them.
export function buildCreateCollectionBody(input: {
  title: string
  category: string
  eventDate: string
}): { title: string; category: string; eventDate?: string } {
  const body: { title: string; category: string; eventDate?: string } = {
    title: input.title.trim(),
    category: input.category,
  }
  // The date input gives a plain YYYY-MM-DD, sent as-is like "Expires on".
  if (input.eventDate) body.eventDate = input.eventDate
  return body
}
