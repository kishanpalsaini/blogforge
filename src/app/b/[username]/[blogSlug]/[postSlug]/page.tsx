import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

type Props = {
  params: { username: string; blogSlug: string; postSlug: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('title, seo_title, seo_description, excerpt')
    .eq('slug', params.postSlug)
    .single()

  return {
    title: post?.seo_title || post?.title || 'Post',
    description: post?.seo_description || post?.excerpt,
  }
}

export default async function PostPage({ params }: Props) {
  const supabase = createClient()

  // Find the blog
  const { data: blog } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', params.blogSlug)
    .eq('is_public', true)
    .single()

  if (!blog) notFound()

  // Find the post
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('blog_id', blog.id)
    .eq('slug', params.postSlug)
    .eq('status', 'published')
    .single()

  if (!post) notFound()

  // Increment views
  await supabase.rpc('increment_post_views', { post_id: post.id })

  return (
    <div className="min-h-screen bg-white">
      {/* Blog header */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <a href={`/b/${params.username}/${params.blogSlug}`} className="text-sm font-medium text-gray-800 hover:underline">
            {blog.name}
          </a>
        </div>
      </header>

      {/* Post */}
      <article className="max-w-2xl mx-auto px-6 py-10">
        {/* Cover image */}
        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-64 object-cover rounded-xl mb-8"
          />
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">{post.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-100">
          {post.published_at && (
            <span>{format(new Date(post.published_at), 'MMMM d, yyyy')}</span>
          )}
          <span>·</span>
          <span>{post.views} views</span>
        </div>

        {/* Content */}
        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />
      </article>
    </div>
  )
}
