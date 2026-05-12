import type { DocumentBadgeProps } from 'sanity'

/**
 * Document list badge that shows publish state in plain English.
 *
 * Shown in the document list pane next to each document title.
 * A green Published state is the "clean" default and needs no badge,
 * so we only badge the two states that require Tynnell's attention:
 *   Draft    — never been published, invisible to visitors
 *   Changes  — has unpublished edits sitting on top of a live version
 */
export function publishStatusBadge({ draft, published }: DocumentBadgeProps) {
  if (draft && !published) {
    return {
      label: 'Draft',
      title: 'Not visible on your site yet',
      color: 'warning' as const,
    }
  }

  if (draft && published) {
    return {
      label: 'Changes pending',
      title: 'Your site still shows the previous version',
      color: 'warning' as const,
    }
  }

  return null
}
