import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function GalleryEditorHome() {
  redirect('/builder?product=portfolio')
}
