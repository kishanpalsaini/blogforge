import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Eye } from 'lucide-react'

type Props = { params: { username: string; blogSlug: string } }

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data: blog } = await supabase.from('blogs').select('name, description').eq('slug', params.blogSlug).single()
  return { title: blog?.name, description: blog?.description }
}

export default async function PublicBlogPage({ params }: Props) {
  const supabase = createClient()

  const { data: blog } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', params.blogSlug)
    .eq('is_public', true)
    .single()

  if (!blog) notFound()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, views, published_at, cover_image')
    .eq('blog_id', blog.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">{blog.name}</h1>
        {blog.description && <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">{blog.description}</p>}
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {posts && posts.length > 0 ? posts.map(post => (
          <article key={post.id} className="group">
            <Link href={`/b/${params.username}/${params.blogSlug}/${post.slug}`}>
              {post.cover_image && (
                <img src={post.cover_image} alt={post.title} className="w-full h-48 object-cover rounded-xl mb-4" />
              )}
              <h2 className="text-lg font-semibold text-gray-900 group-hover:underline">{post.title}</h2>
              {post.excerpt && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.excerpt}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                {post.published_at && <span>{format(new Date(post.published_at), 'MMM d, yyyy')}</span>}
                <span className="flex items-center gap-1"><Eye size={11} /> {post.views}</span>
              </div>
            </Link>
            <div className="border-b border-gray-50 mt-6" />
          </article>
        )) : (
          <p className="text-center text-gray-400 text-sm py-20">No posts yet.</p>
        )}
      </main>
    </div>
  )
}
