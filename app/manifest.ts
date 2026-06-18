import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tynnell Hollins Photography',
    short_name: 'TH Photography',
    description:
      'Albuquerque, New Mexico wedding and portrait photographer capturing authentic, timeless moments.',
    start_url: '/',
    display: 'browser',
    background_color: '#0C0C0C',
    theme_color: '#0C0C0C',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
