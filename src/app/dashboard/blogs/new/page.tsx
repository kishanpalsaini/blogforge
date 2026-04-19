'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import slugify from 'slugify'
import { BookOpen } from 'lucide-react'

export default function NewBlogPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleNameChange(value: string) {
    setName(value)
    setSlug(slugify(value, { lower: true, strict: true }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error } = await supabase
      .from('blogs')
      .insert({ user_id: user.id, name: name.trim(), slug, description })
      .select()
      .single()

    if (error) {
      setError(error.message.includes('unique') ? 'That slug is already taken. Try a different name.' : error.message)
      setLoading(false)
    } else {
      router.push(`/dashboard/blogs/${data.id}`)
      router.refresh()
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Create a new blog</h1>
        <p className="text-sm text-gray-500 mt-1">Give your blog a name and you're ready to write.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Blog name</label>
            <input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              required
              placeholder="My Tech Blog"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Slug</label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-gray-900">
              <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 shrink-0">
                blogforge.com/b/
              </span>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                required
                placeholder="my-tech-blog"
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this blog about?"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-2.5 border border-gray-200 text-sm rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name || !slug}
              className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              {loading ? 'Creating...' : 'Create blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
