'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { createClient } from '@/lib/supabase/client'
import { Save, Globe, Archive, Trash2, ChevronDown, Eye } from 'lucide-react'
import { format } from 'date-fns'

type Props = { params: { blogId: string; postId: string } }

export default function EditPostPage({ params }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [views, setViews] = useState(0)
  const [updatedAt, setUpdatedAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [seoOpen, setSeoOpen] = useState(false)
  const [toolLink, setToolLink] = useState('')
  const [toolName, setToolName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPost() {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('id', params.postId)
        .single()

      if (data) {
        setTitle(data.title)
        setSlug(data.slug)
        setContent(data.content ?? '')
        setExcerpt(data.excerpt ?? '')
        setSeoTitle(data.seo_title ?? '')
        setSeoDesc(data.seo_description ?? '')
        setStatus(data.status)
        setViews(data.views)
        setToolLink(data.tool_link ?? '')
        setToolName(data.tool_name ?? '')
        setUpdatedAt(data.updated_at)
      }
      setLoading(false)
    }
    loadPost()
  }, [params.postId])

  async function savePost(newStatus?: typeof status) {
    setSaving(true)
    const targetStatus = newStatus ?? status

    const { error } = await supabase.from('posts').update({
      title,
      slug,
      content,
      excerpt,
      seo_title: seoTitle,
      seo_description: seoDesc,
      status: targetStatus,
      tool_link: toolLink,
      tool_name: toolName,
      published_at: targetStatus === 'published' ? new Date().toISOString() : undefined,
    }).eq('id', params.postId)

    setSaving(false)
    if (!error) {
      setStatus(targetStatus)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
  }

  async function deletePost() {
    if (!confirm('Delete this post permanently?')) return
    await supabase.from('posts').delete().eq('id', params.postId)
    router.push(`/dashboard/blogs/${params.blogId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-400">Loading post...</div>
      </div>
    )
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-green-50 text-green-700',
    archived: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
          <span className="text-gray-200">|</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}>{status}</span>
          {updatedAt && (
            <span className="text-xs text-gray-400">
              Saved {format(new Date(updatedAt), 'MMM d, h:mm a')}
            </span>
          )}
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Eye size={11} /> {views.toLocaleString()} views
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={deletePost}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => savePost('archived')}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <Archive size={12} /> Archive
          </button>
          <button
            onClick={() => savePost('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <Save size={12} /> {saved ? 'Saved!' : 'Save draft'}
          </button>
          <button
            onClick={() => savePost('published')}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700"
          >
            <Globe size={12} /> {status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Post title..."
          className="w-full text-3xl font-semibold text-gray-900 bg-transparent border-none outline-none placeholder-gray-200 mb-2"
        />
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-gray-400">Slug:</span>
          <input
            value={slug}
            onChange={e => setSlug(e.target.value)}
            className="text-xs text-gray-500 bg-transparent border-none outline-none flex-1 font-mono"
          />
        </div>

        <TipTapEditor content={content} onChange={setContent} />

        <div className="mt-6">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Excerpt kp</label>
          <textarea
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            rows={2}
            placeholder="Short description shown in blog listings..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
        </div>

        <div className="mt-4 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-600">Tool Info</p>
          <div>
            <label className="text-xs text-gray-500">Tool Name</label>
            <input value={toolName} onChange={e => setToolName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 ..." />
          </div>
          <div>
            <label className="text-xs text-gray-500">Tool Link</label>
            <input value={toolLink} onChange={e => setToolLink(e.target.value)}
              placeholder="/tools/your-tool-slug"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono ..." />
          </div>
        </div>


        <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setSeoOpen(!seoOpen)}
            className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            SEO & Meta
            <ChevronDown size={14} className={`transition-transform ${seoOpen ? 'rotate-180' : ''}`} />
          </button>
          {seoOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
              <div>
                <label className="block text-xs text-gray-500 mb-1">SEO Title</label>
                <input
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  placeholder={title}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Meta Description</label>
                <textarea
                  value={seoDesc}
                  onChange={e => setSeoDesc(e.target.value)}
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{seoDesc.length}/160 characters</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
