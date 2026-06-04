/**
 * Renders a <script type="application/ld+json"> block for structured data.
 * Pass any valid Schema.org object as `data`.
 *
 * Usage:
 *   <JsonLd data={{ '@context': 'https://schema.org', '@type': 'LocalBusiness', ... }} />
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // dangerouslySetInnerHTML is safe here — data comes from our own
      // server-side Payload queries, never from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
