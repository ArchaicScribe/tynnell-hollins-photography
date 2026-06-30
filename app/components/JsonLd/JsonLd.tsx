/**
 * Renders a <script type="application/ld+json"> block for structured data.
 * Pass any valid Schema.org object as `data`.
 *
 * Usage:
 *   <JsonLd data={{ '@context': 'https://schema.org', '@type': 'LocalBusiness', ... }} />
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape < so a title like "</script><script>..." can't break out of the tag.
  const safe = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
