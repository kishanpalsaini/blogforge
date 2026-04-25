'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { createClient } from '@/lib/supabase/client'
import slugify from 'slugify'
import { Save, Globe, ChevronDown, X, ImagePlus, Tag } from 'lucide-react'

type Props = { params: { blogId: string } }

export default function NewPostPage({ params }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [seoOpen, setSeoOpen] = useState(false)
  const [toolLink, setToolLink] = useState('')
  const [toolName, setToolName] = useState('')
  const [error, setError] = useState('')

  function handleTitleChange(value: string) {
    setTitle(value)
    setSlug(slugify(value, { lower: true, strict: true }))
  }

  async function handleCoverUpload(file: File) {
    if (!file.type.startsWith('image/')) return
    const ext = file.name.split('.').pop()
    const filename = `covers/${params.blogId}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('post-images').upload(filename, file, { upsert: true })
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(data.path)
      setCoverImage(urlData.publicUrl)
      setCoverPreview(urlData.publicUrl)
    } else {
      // fallback base64 preview
      const reader = new FileReader()
      reader.onload = e => { if (e.target?.result) setCoverPreview(e.target.result as string) }
      reader.readAsDataURL(file)
    }
  }

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const t = tagInput.trim().toLowerCase()
      if (t && !tags.includes(t) && tags.length < 5) {
        setTags([...tags, t])
        setTagInput('')
      }
    }
  }

  async function savePost(status: 'draft' | 'published') {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')

    const { data, error } = await supabase.from('posts').insert({
      blog_id: params.blogId,
      title: title.trim(),
      slug: slug || slugify(title, { lower: true, strict: true }),
      content,
      excerpt,
      cover_image: coverImage || null,
      status,
      seo_title: seoTitle || null,
      seo_description: seoDesc || null,
      tool_link: toolLink || null,
      tool_name: toolName || null,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }).select().single()

    if (!error && data) {
      router.push(`/dashboard/blogs/${params.blogId}/posts/${data.id}`)
    } else {
      setError(error?.message ?? 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
          <span className="text-gray-200">|</span>
          <span className="text-sm text-gray-500">New post</span>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button onClick={() => savePost('draft')} disabled={saving || !title}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            <Save size={12} /> Save draft
          </button>
          <button onClick={() => savePost('published')} disabled={saving || !title}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40">
            <Globe size={12} /> Publish
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Cover image */}
        <div className="mb-6">
          {coverPreview ? (
            <div className="relative rounded-xl overflow-hidden mb-4 group">
              <img src={coverPreview} alt="Cover" className="w-full h-52 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button onClick={() => coverInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white text-gray-800 text-xs rounded-lg font-medium">
                  Change
                </button>
                <button onClick={() => { setCoverImage(''); setCoverPreview('') }}
                  className="px-3 py-1.5 bg-white text-red-600 text-xs rounded-lg font-medium">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => coverInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 rounded-xl px-4 py-3 w-full justify-center hover:border-gray-300 transition-colors mb-4">
              <ImagePlus size={16} /> Add cover image
            </button>
          )}
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = '' }} />
        </div>

        {/* Title */}
        <input value={title} onChange={e => handleTitleChange(e.target.value)}
          placeholder="Post title..."
          className="w-full text-3xl font-semibold text-gray-900 bg-transparent border-none outline-none placeholder-gray-200 mb-2" />

        {/* Slug */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-400">Slug:</span>
          <input value={slug} onChange={e => setSlug(e.target.value)}
            className="text-xs text-gray-500 bg-transparent border-none outline-none flex-1 font-mono"
            placeholder="auto-generated" />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-6 p-2.5 border border-gray-200 rounded-xl bg-white min-h-10">
          <Tag size={13} className="text-gray-300 shrink-0" />
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tag}
              <button onClick={() => setTags(tags.filter(t => t !== tag))}><X size={10} /></button>
            </span>
          ))}
          {tags.length < 5 && (
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
              placeholder={tags.length === 0 ? "Add tags (press Enter)..." : "Add tag..."}
              className="text-xs outline-none bg-transparent flex-1 min-w-24 text-gray-600 placeholder-gray-300" />
          )}
        </div>

        {/* Editor */}
        <TipTapEditor content={content} onChange={setContent}
          placeholder="Start writing your post..." />

        {/* Excerpt */}
        <div className="mt-5">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Excerpt <span className="text-gray-300 font-normal">— shown in blog listings</span></label>
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
            placeholder="Brief description of this post..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
        </div>

        {/* Tool Info */}
        <div className="mt-4 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500">Tool Info</p>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tool Name</label>
            <input value={toolName} onChange={e => setToolName(e.target.value)}
              placeholder="e.g. free online word processor"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tool Link</label>
            <input value={toolLink} onChange={e => setToolLink(e.target.value)}
              placeholder="/tools/your-tool-slug"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono" />
          </div>
        </div>

        {/* SEO */}
        <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setSeoOpen(!seoOpen)}
            className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
            SEO & Meta
            <ChevronDown size={14} className={`transition-transform ${seoOpen ? 'rotate-180' : ''}`} />
          </button>
          {seoOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">SEO Title <span className="text-gray-300">({(seoTitle || title).length}/60)</span></label>
                <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)}
                  placeholder={title || 'SEO title...'}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Meta Description <span className="text-gray-300">({seoDesc.length}/160)</span></label>
                <textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} rows={2}
                  placeholder="Description for search engines..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">OG Image URL <span className="text-gray-300">(defaults to cover image)</span></label>
                <input placeholder={coverImage || 'https://...'} disabled value={coverImage}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-400 bg-gray-50" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
