import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PostsTable } from '@/components/dashboard/PostsTable'

export const metadata = { title: 'All posts' }

export default async function AllPostsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: blogs } = await supabase
    .from('blogs')
    .select('id, name, slug')
    .eq('user_id', user.id)

  const blogIds = (blogs ?? []).map(b => b.id)

  const { data: posts } = blogIds.length
    ? await supabase
        .from('posts')
        .select('*')
        .in('blog_id', blogIds)
        .order('updated_at', { ascending: false })
    : { data: [] }

  const blogMap = Object.fromEntries((blogs ?? []).map(b => [b.id, b]))

  const postsWithBlog = (posts ?? []).map(p => ({
    ...p,
    blog: blogMap[p.blog_id]
      ? { ...blogMap[p.blog_id], user_id: user.id, is_public: true, description: null, logo_url: null, created_at: '' }
      : undefined,
  }))

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">All posts</h1>
        <p className="text-sm text-gray-500 mt-1">{posts?.length ?? 0} posts across {blogs?.length ?? 0} blogs</p>
      </div>
      <PostsTable posts={postsWithBlog} />
    </div>
  )
}
