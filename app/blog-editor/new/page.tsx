'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// "+ New Post" target for external quick-links (Studio dashboard, builder
// nav, etc). Creates via the API route client-side rather than payload.create
// in a server component render - Posts.ts's afterChange hook calls
// revalidatePath, which Next.js disallows during render.
export default function NewBlogPostPage() {
  const router = useRouter()

  useEffect(() => {
    fetch('/api/blog-editor/create', { method: 'POST', credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('create failed')
        return res.json()
      })
      .then(({ slug }) => router.replace(`/blog-editor/${slug}`))
      .catch(() => router.replace('/blog-editor'))
  }, [router])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <p style={{ color: 'var(--color-detail)' }}>Creating your post...</p>
    </div>
  )
}
