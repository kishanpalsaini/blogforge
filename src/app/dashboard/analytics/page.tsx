import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsClient } from './AnalyticsClient'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
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
        .select('id, title, views, status, blog_id, created_at, published_at')
        .in('blog_id', blogIds)
        .order('views', { ascending: false })
    : { data: [] }

  const blogMap = Object.fromEntries((blogs ?? []).map(b => [b.id, b.name]))

  const postsWithBlog = (posts ?? []).map(p => ({
    ...p,
    blogName: blogMap[p.blog_id] ?? 'Unknown',
  }))

  return <AnalyticsClient posts={postsWithBlog} blogs={blogs ?? []} />
}
