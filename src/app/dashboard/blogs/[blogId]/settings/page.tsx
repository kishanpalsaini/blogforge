'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Save } from 'lucide-react'
import slugify from 'slugify'

type Props = { params: { blogId: string } }

export default function BlogSettingsPage({ params }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('blogs').select('*').eq('id', params.blogId).single()
      if (data) {
        setName(data.name)
        setSlug(data.slug)
        setDescription(data.description ?? '')
        setIsPublic(data.is_public)
      }
    }
    load()
  }, [params.blogId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error } = await supabase
      .from('blogs')
      .update({ name, slug, description, is_public: isPublic })
      .eq('id', params.blogId)

    setSaving(false)
    if (error) {
      setError(error.message.includes('unique') ? 'Slug already taken.' : error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
  }

  async function handleDelete() {
    const confirmed = confirm(
      'Delete this blog and ALL its posts? This cannot be undone.'
    )
    if (!confirmed) return
    await supabase.from('blogs').delete().eq('id', params.blogId)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Blog settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your blog's details and visibility.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Blog name</label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setSlug(slugify(e.target.value, { lower: true, strict: true })) }}
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Slug</label>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Public blog</p>
              <p className="text-xs text-gray-400 mt-0.5">Published posts are visible to everyone</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isPublic ? 'bg-gray-900' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Save size={13} /> {saved ? 'Saved!' : saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-red-100 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-red-700 mb-1">Danger zone</h2>
        <p className="text-xs text-gray-400 mb-4">Deleting a blog removes all its posts permanently. This cannot be undone.</p>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
        >
          <Trash2 size={13} /> Delete this blog
        </button>
      </div>
    </div>
  )
}
