'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Search, Plus, ArrowUpDown, Eye, Edit, Trash2 } from 'lucide-react'
import { Post } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type PostsTableProps = {
  posts: Post[]
  blogId?: string
}

export function PostsTable({ posts: initialPosts, blogId }: PostsTableProps) {
  const router = useRouter()
  const supabase = createClient()
  const [posts, setPosts] = useState(initialPosts)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'updated_at' | 'views' | 'title'>('updated_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    return posts
      .filter(p => {
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || p.status === statusFilter
        return matchSearch && matchStatus
      })
      .sort((a, b) => {
        let aVal: any = a[sortBy]
        let bVal: any = b[sortBy]
        if (sortBy === 'views') { aVal = a.views; bVal = b.views }
        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
        return 0
      })
  }, [posts, search, statusFilter, sortBy, sortDir])

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const statusColors = {
    published: 'bg-green-50 text-green-700',
    draft: 'bg-gray-100 text-gray-500',
    archived: 'bg-orange-50 text-orange-600',
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 focus:outline-none bg-white"
        >
          <option value="all">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <Link
          href={blogId ? `/dashboard/blogs/${blogId}/posts/new` : '/dashboard/posts/new'}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700"
        >
          <Plus size={13} /> New post
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                <button onClick={() => toggleSort('title')} className="flex items-center gap-1 hover:text-gray-800">
                  Title <ArrowUpDown size={10} />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Blog</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                <button onClick={() => toggleSort('views')} className="flex items-center gap-1 hover:text-gray-800">
                  Views <ArrowUpDown size={10} />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                <button onClick={() => toggleSort('updated_at')} className="flex items-center gap-1 hover:text-gray-800">
                  Updated <ArrowUpDown size={10} />
                </button>
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-sm text-gray-400">
                  No posts found
                </td>
              </tr>
            ) : filtered.map((post, i) => (
              <tr
                key={post.id}
                className={`group hover:bg-gray-50 transition-colors ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <td className="px-4 py-3">
                  <Link href={`/dashboard/blogs/${post.blog_id}/posts/${post.id}`}>
                    <p className="font-medium text-gray-800 hover:underline truncate max-w-xs">{post.title}</p>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[post.status]}`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{post.blog?.name ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500 flex items-center gap-1">
                  <Eye size={11} /> {post.views.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <Link
                      href={`/dashboard/blogs/${post.blog_id}/posts/${post.id}`}
                      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                    >
                      <Edit size={12} />
                    </Link>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-2">{filtered.length} post{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
