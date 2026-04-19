'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Eye, FileText, TrendingUp, BookOpen } from 'lucide-react'

type Post = {
  id: string
  title: string
  views: number
  status: string
  blog_id: string
  blogName: string
  created_at: string
  published_at: string | null
}

type Blog = { id: string; name: string; slug: string }

export function AnalyticsClient({ posts, blogs }: { posts: Post[]; blogs: Blog[] }) {
  const [selectedBlog, setSelectedBlog] = useState('all')

  const filtered = selectedBlog === 'all'
    ? posts
    : posts.filter(p => p.blog_id === selectedBlog)

  const totalViews = filtered.reduce((acc, p) => acc + p.views, 0)
  const published = filtered.filter(p => p.status === 'published')
  const drafts = filtered.filter(p => p.status === 'draft')
  const top5 = [...filtered].sort((a, b) => b.views - a.views).slice(0, 5)

  // Bar chart: top 5 posts by views
  const barData = top5.map(p => ({
    name: p.title.length > 24 ? p.title.slice(0, 24) + '…' : p.title,
    views: p.views,
    blog: p.blogName,
  }))

  // Pie chart: views per blog
  const viewsByBlog = blogs.map(b => ({
    name: b.name,
    value: posts.filter(p => p.blog_id === b.id).reduce((acc, p) => acc + p.views, 0),
  })).filter(b => b.value > 0)

  const PIE_COLORS = ['#378ADD', '#1D9E75', '#D4537E', '#EF9F27', '#7F77DD']

  // Status breakdown
  const statusData = [
    { name: 'Published', value: published.length, color: '#3B6D11' },
    { name: 'Draft', value: drafts.length, color: '#888780' },
    { name: 'Archived', value: filtered.filter(p => p.status === 'archived').length, color: '#854F0B' },
  ].filter(s => s.value > 0)

  const stats = [
    { label: 'Total views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-blue-600 bg-blue-50' },
    { label: 'Published posts', value: published.length, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Total posts', value: filtered.length, icon: FileText, color: 'text-purple-600 bg-purple-50' },
    { label: 'Blogs', value: blogs.length, icon: BookOpen, color: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your blog performance.</p>
        </div>
        <select
          value={selectedBlog}
          onChange={e => setSelectedBlog(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none"
        >
          <option value="all">All blogs</option>
          {blogs.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon size={15} />
            </div>
            <div className="text-2xl font-semibold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Top posts bar chart */}
        <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Top posts by views</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: '0.5px solid #e5e7eb', borderRadius: 8, boxShadow: 'none' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="views" fill="#378ADD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-sm text-gray-400">
              No published posts yet
            </div>
          )}
        </div>

        {/* Pie chart views per blog */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Views by blog</h2>
          {viewsByBlog.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={viewsByBlog}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {viewsByBlog.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, border: '0.5px solid #e5e7eb', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-sm text-gray-400">No data yet</div>
          )}
        </div>
      </div>

      {/* Status breakdown + Top posts table */}
      <div className="grid grid-cols-3 gap-4">
        {/* Status */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Post status</h2>
          <div className="space-y-3">
            {statusData.map(s => (
              <div key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{s.name}</span>
                  <span className="font-medium text-gray-900">{s.value}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${filtered.length ? (s.value / filtered.length) * 100 : 0}%`,
                      background: s.color,
                    }}
                  />
                </div>
              </div>
            ))}
            {statusData.length === 0 && (
              <p className="text-sm text-gray-400">No posts yet</p>
            )}
          </div>
        </div>

        {/* Top posts table */}
        <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">All posts ranked by views</h2>
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400">No posts yet</p>
            )}
            {[...filtered]
              .sort((a, b) => b.views - a.views)
              .slice(0, 7)
              .map((post, i) => (
                <div key={post.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-300 w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{post.title}</p>
                    <p className="text-xs text-gray-400">{post.blogName}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Eye size={10} />
                    {post.views.toLocaleString()}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    post.status === 'published' ? 'bg-green-50 text-green-700' :
                    post.status === 'draft' ? 'bg-gray-100 text-gray-500' :
                    'bg-orange-50 text-orange-600'
                  }`}>
                    {post.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
