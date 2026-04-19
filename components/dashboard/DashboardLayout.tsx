'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, BarChart2, Settings,
  ChevronDown, Plus, LogOut, BookOpen
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Blog = { id: string; name: string; slug: string }

type SidebarProps = {
  blogs: Blog[]
  userEmail: string
}

export function DashboardLayout({
  children,
  blogs,
  userEmail,
}: {
  children: React.ReactNode
  blogs: Blog[]
  userEmail: string
}) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar blogs={blogs} userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

function Sidebar({ blogs, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [blogsOpen, setBlogsOpen] = useState(true)

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/posts', label: 'All posts', icon: FileText },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 min-w-56 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-gray-800" />
          <span className="font-semibold text-gray-900 text-sm tracking-tight">BlogForge</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 ml-6">CMS Dashboard</p>
      </div>

      {/* Nav */}
      <nav className="px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === href
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Blogs */}
      <div className="flex-1 overflow-y-auto px-2 py-2 border-t border-gray-100">
        <button
          onClick={() => setBlogsOpen(!blogsOpen)}
          className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-gray-600"
        >
          My blogs
          <ChevronDown size={12} className={`transition-transform ${blogsOpen ? '' : '-rotate-90'}`} />
        </button>

        {blogsOpen && (
          <div className="mt-1 space-y-0.5">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/dashboard/blogs/${blog.id}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  pathname.startsWith(`/dashboard/blogs/${blog.id}`)
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="truncate">{blog.name}</span>
              </Link>
            ))}
            <Link
              href="/dashboard/blogs/new"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-dashed border-gray-200 mt-2"
            >
              <Plus size={12} />
              New blog
            </Link>
          </div>
        )}
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{userEmail}</p>
            <p className="text-xs text-gray-400">Free plan</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
