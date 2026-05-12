import type { DocumentActionProps } from 'sanity'
import {
  CheckmarkCircleIcon,
  InfoOutlineIcon,
  WarningOutlineIcon,
} from '@sanity/icons'

/**
 * Document toolbar action that surfaces the current publish state in plain English.
 *
 * Appears alongside the existing Publish / Discard buttons so Tynnell always
 * has a clear answer to "is this live?" without needing to know Sanity internals.
 *
 * Three states:
 *   Live on your site    — published, no pending draft. Green, disabled (no action needed).
 *   Not live yet         — draft only, never published. Amber, hovering explains what to do.
 *   Unpublished changes  — draft sitting on top of a published version. Amber, explains the gap.
 *
 * The button is intentionally non-destructive: clicking it does nothing. Its value
 * is purely informational — the label, icon, tone, and tooltip tell the whole story.
 */
export function publishStatusAction(props: DocumentActionProps) {
  const { draft, published, liveEdit } = props

  // liveEdit schemas publish immediately — no draft state to explain
  if (liveEdit) return null
  // New document not yet saved at all
  if (!draft && !published) return null

  if (!draft && published) {
    return {
      label: 'Live on your site',
      icon: CheckmarkCircleIcon,
      tone: 'positive' as const,
      disabled: true,
      title: 'This content is published and visible to your visitors.',
      onHandle: () => {},
    }
  }

  if (draft && !published) {
    return {
      label: 'Not live yet',
      icon: InfoOutlineIcon,
      tone: 'caution' as const,
      disabled: false,
      title:
        'This is a draft. Nothing is visible on your site yet. Click Publish when you are ready to go live.',
      onHandle: () => {},
    }
  }

  // draft && published — has unsaved changes on top of a live version
  return {
    label: 'Unpublished changes',
    icon: WarningOutlineIcon,
    tone: 'caution' as const,
    disabled: false,
    title:
      'You have unpublished changes. Your site still shows the previous version. Click Publish to update it.',
    onHandle: () => {},
  }
}
