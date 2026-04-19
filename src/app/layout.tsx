import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'BlogForge', template: '%s — BlogForge' },
  description: 'Free multi-blog CMS dashboard. Write, manage, and publish blogs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
