import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { PostsTable } from '@/components/dashboard/PostsTable'
import { Settings, Globe, Plus, Eye } from 'lucide-react'
import type { Metadata } from 'next'

type Props = { params: { blogId: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: blog } = await supabase.from('blogs').select('name').eq('id', params.blogId).single()
  return { title: blog?.name ?? 'Blog' }
}

export default async function BlogPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: blog } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', params.blogId)
    .eq('user_id', user.id)
    .single()

  if (!blog) notFound()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('blog_id', params.blogId)
    .order('updated_at', { ascending: false })

  const totalViews = posts?.reduce((acc, p) => acc + p.views, 0) ?? 0
  const published = posts?.filter(p => p.status === 'published').length ?? 0
  const drafts = posts?.filter(p => p.status === 'draft').length ?? 0

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {blog.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{blog.name}</h1>
          </div>
          {blog.description && (
            <p className="text-sm text-gray-500 ml-10">{blog.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/b/${user.id}/${blog.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <Globe size={12} /> View public
          </a>
          <Link
            href={`/dashboard/blogs/${blog.id}/settings`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <Settings size={12} /> Settings
          </Link>
          <Link
            href={`/dashboard/blogs/${blog.id}/posts/new`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700"
          >
            <Plus size={12} /> New post
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total posts', value: posts?.length ?? 0 },
          { label: 'Published', value: published },
          { label: 'Drafts', value: drafts },
          { label: 'Total views', value: totalViews.toLocaleString(), icon: Eye },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="text-xl font-semibold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Posts table */}
      <PostsTable
        posts={(posts ?? []).map(p => ({ ...p, blog: { name: blog.name, slug: blog.slug, id: blog.id, user_id: user.id, is_public: blog.is_public, created_at: blog.created_at } }))}
        blogId={blog.id}
      />
    </div>
  )
}
