export type User = {
  id: string
  email: string
  created_at: string
}

export type Blog = {
  id: string
  user_id: string
  name: string
  description: string | null
  slug: string
  logo_url: string | null
  is_public: boolean
  created_at: string
  posts?: Post[]
  _count?: { posts: number }
}

export type Post = {
  id: string
  blog_id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  cover_image: string | null
  status: 'draft' | 'published' | 'archived'
  seo_title: string | null
  seo_description: string | null
  views: number
  published_at: string | null
  created_at: string
  updated_at: string
  blog?: Blog
}

export type Tag = {
  id: string
  blog_id: string
  name: string
  slug: string
}

export type PostTag = {
  post_id: string
  tag_id: string
}

export type CreateBlogInput = {
  name: string
  description?: string
  slug: string
}

export type CreatePostInput = {
  blog_id: string
  title: string
  slug: string
  content?: string
  excerpt?: string
  cover_image?: string
  status?: 'draft' | 'published' | 'archived'
  seo_title?: string
  seo_description?: string
}

export type UpdatePostInput = Partial<CreatePostInput>

export type DashboardStats = {
  totalBlogs: number
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalViews: number
}
