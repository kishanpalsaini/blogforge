import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, BookOpen, Eye, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch blogs
  const { data: blogs } = await supabase
    .from('blogs')
    .select('*, posts(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('*, blog:blogs(name, slug)')
    .in('blog_id', (blogs || []).map(b => b.id))
    .order('updated_at', { ascending: false })
    .limit(5)

  // Stats
  const totalPosts = recentPosts?.length ?? 0
  const totalViews = recentPosts?.reduce((acc, p) => acc + (p.views || 0), 0) ?? 0
  const publishedCount = recentPosts?.filter(p => p.status === 'published').length ?? 0

  const stats = [
    { label: 'Total blogs', value: blogs?.length ?? 0, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total posts', value: totalPosts, icon: FileText, color: 'text-purple-600 bg-purple-50' },
    { label: 'Published', value: publishedCount, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Total views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back! Here's what's happening.</p>
        </div>
        <Link
          href="/dashboard/blogs/new/posts/new"
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus size={14} /> New post
        </Link>
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

      <div className="grid grid-cols-3 gap-4">
        {/* Blogs */}
        <div className="col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">My blogs</h2>
            <Link href="/dashboard/blogs/new" className="text-xs text-gray-400 hover:text-gray-600">+ Create</Link>
          </div>
          <div className="space-y-2">
            {blogs?.map(blog => (
              <Link
                key={blog.id}
                href={`/dashboard/blogs/${blog.id}`}
                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {blog.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{blog.name}</p>
                  <p className="text-xs text-gray-400">{blog.posts?.[0]?.count ?? 0} posts</p>
                </div>
                <ArrowRight size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>
            ))}
            {(!blogs || blogs.length === 0) && (
              <Link
                href="/dashboard/blogs/new"
                className="flex items-center justify-center gap-2 p-4 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300"
              >
                <Plus size={14} /> Create your first blog
              </Link>
            )}
          </div>
        </div>

        {/* Recent Posts */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">Recent posts</h2>
            <Link href="/dashboard/posts" className="text-xs text-gray-400 hover:text-gray-600">See all</Link>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {recentPosts && recentPosts.length > 0 ? (
              recentPosts.map((post, i) => (
                <Link
                  key={post.id}
                  href={`/dashboard/blogs/${post.blog_id}/posts/${post.id}`}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    i < recentPosts.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {post.blog?.name} · {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    post.status === 'published' ? 'bg-green-50 text-green-700' :
                    post.status === 'draft' ? 'bg-gray-100 text-gray-500' :
                    'bg-orange-50 text-orange-600'
                  }`}>
                    {post.status}
                  </span>
                  <span className="text-xs text-gray-400 min-w-12 text-right">{post.views} views</span>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-sm text-gray-400">
                <FileText size={24} className="mb-2 opacity-40" />
                No posts yet. Create your first post!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
