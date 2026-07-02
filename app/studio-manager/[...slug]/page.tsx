import { redirect } from 'next/navigation'

type Props = { params: Promise<{ slug: string[] }> }

export default async function StudioManagerSubPage({ params }: Props) {
  const { slug } = await params

  // Projects already has a real, working admin view (ProjectsKanbanView) -
  // it's a Payload admin component (uses Payload's field hooks/context), so
  // it can't run standalone as a Next.js page. Route straight to the real
  // (de-chromed) admin URL instead of silently bouncing back to the Studio
  // Manager home, which made these links look broken.
  if (slug[0] === 'projects') {
    if (slug[1] === 'new') {
      redirect('/admin/collections/projects/create')
      return
    }
    if (slug[1]) {
      // Nothing links here today (project cards in ProjectsKanbanView open
      // /admin/collections/projects/:id directly via Payload's own
      // click-through, bypassing this route entirely) - kept as a defensive
      // catch-all in case a future Studio Manager link points here instead.
      redirect(`/admin/collections/projects/${slug[1]}`)
      return
    }
    redirect('/admin/collections/projects')
    return
  }

  // Contacts, Payments, Inbox, Documents, Templates have no backing
  // collection yet - genuinely unbuilt, not a broken link. Fall back to home.
  redirect('/studio-manager')
}
