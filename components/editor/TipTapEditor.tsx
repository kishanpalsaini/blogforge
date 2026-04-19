'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Youtube from '@tiptap/extension-youtube'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { createClient } from '@/lib/supabase/client'
import { useRef } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Minus, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Youtube as YoutubeIcon, Table as TableIcon,
  Undo, Redo, Upload,
} from 'lucide-react'

type TipTapEditorProps = {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  blogId?: string
}

export function TipTapEditor({ content, onChange, placeholder, blogId }: TipTapEditorProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({ allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing your post...' }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Youtube.configure({ controls: true, width: 640, height: 360 }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-gray max-w-none focus:outline-none min-h-[400px] px-5 py-4 text-sm leading-relaxed',
      },
    },
  })

  if (!editor) return null

  async function handleImageUpload(file: File) {
    if (!file.type.startsWith('image/')) return
    if (blogId) {
      const ext = file.name.split('.').pop()
      const filename = `${blogId}/${Date.now()}.${ext}`
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(filename, file, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(data.path)
        editor?.chain().focus().setImage({ src: urlData.publicUrl }).run()
        return
      }
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) editor?.chain().focus().setImage({ src: e.target.result as string }).run()
    }
    reader.readAsDataURL(file)
  }

  function addLink() {
    const url = prompt('Enter URL:')
    if (url) editor?.chain().focus().setLink({ href: url }).run()
  }

  function addYoutube() {
    const url = prompt('Enter YouTube URL:')
    if (url) editor?.commands.setYoutubeVideo({ src: url })
  }

  const ToolBtn = ({ onClick, active = false, title, children, disabled = false }: {
    onClick: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean
  }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors ${active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30'
        }`}
    >
      {children}
    </button>
  )

  const Divider = () => <div className="w-px h-4 bg-gray-200 mx-0.5 shrink-0" />

  const words = editor.storage.characterCount.words()
  const readingTime = Math.max(1, Math.round(words / 200))

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}><Undo size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}><Redo size={13} /></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={13} /></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter size={13} /></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left"><AlignLeft size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center"><AlignCenter size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right"><AlignRight size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify size={13} /></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><List size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block"><Code size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider line"><Minus size={13} /></ToolBtn>
        <Divider />
        <ToolBtn onClick={addLink} active={editor.isActive('link')} title="Add link"><LinkIcon size={13} /></ToolBtn>
        <ToolBtn onClick={() => fileInputRef.current?.click()} title="Upload image from device"><Upload size={13} /></ToolBtn>
        <ToolBtn onClick={() => { const url = prompt('Image URL:'); if (url) editor.chain().focus().setImage({ src: url }).run() }} title="Insert image by URL"><ImageIcon size={13} /></ToolBtn>
        <ToolBtn onClick={addYoutube} title="Embed YouTube video"><YoutubeIcon size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table"><TableIcon size={13} /></ToolBtn>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleImageUpload(file)
          e.target.value = ''
        }}
      />

      <EditorContent editor={editor} />

      <div className="flex items-center gap-4 px-5 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
        <span>{words} words</span>
        <span>{readingTime} min read</span>
        <span className="ml-auto">{editor.storage.characterCount.characters()} characters</span>
      </div>
    </div>
  )
}
