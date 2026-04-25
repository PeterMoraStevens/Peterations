'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Callout } from '@/components/blog/Callout'
import {
  Save, Plus, X, Clock, Bold, Italic, Code, Code2, Heading2, Heading3,
  Link, ImageIcon, Minus, Quote, Info, AlertTriangle, CheckCircle, Zap,
  Undo2, Redo2, UploadCloud, Loader2, Trash2,
} from 'lucide-react'
import type { BlogPost } from '@/types'


function slugify(str: string): string {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

// ── Preview renderer ──────────────────────────────────────────────────────────

type Segment =
  | { kind: 'md'; text: string }
  | { kind: 'callout'; type: 'note' | 'warning' | 'tip' | 'important'; text: string }

function parseSegments(content: string): Segment[] {
  const segments: Segment[] = []
  const re = /<Callout\s+type="(note|warning|tip|important)">([\s\S]*?)<\/Callout>/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) segments.push({ kind: 'md', text: content.slice(last, m.index) })
    segments.push({ kind: 'callout', type: m[1] as 'note' | 'warning' | 'tip' | 'important', text: m[2].trim() })
    last = m.index + m[0].length
  }
  if (last < content.length) segments.push({ kind: 'md', text: content.slice(last) })
  return segments
}

function MDXPreview({ content, title }: { content: string; title: string }) {
  if (!content.trim()) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Start writing to see a preview
      </div>
    )
  }
  const segments = parseSegments(content)
  return (
    <article className="prose prose-lg max-w-none prose-brutal px-8 py-10">
      {title && <h1 className="not-prose text-4xl font-bold mb-8 leading-tight">{title}</h1>}
      {segments.map((seg, i) =>
        seg.kind === 'callout' ? (
          <Callout key={i} type={seg.type}>{seg.text}</Callout>
        ) : (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{seg.text}</ReactMarkdown>
        )
      )}
    </article>
  )
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

interface ToolbarProps {
  onInsert: (before: string, after?: string, placeholder?: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onUploadImage: () => void
  uploadingImage: boolean
}

function ToolbarDivider() {
  return <span className="w-px h-5 bg-border mx-0.5 shrink-0" />
}

function TB({
  label, title, onClick, disabled, children,
}: {
  label?: string; title: string; onClick: () => void; disabled?: boolean; children?: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
      {label && <span>{label}</span>}
    </button>
  )
}

function Toolbar({ onInsert, onUndo, onRedo, canUndo, canRedo, onUploadImage, uploadingImage }: ToolbarProps) {
  return (
    <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 border-b-2 border-border bg-background">
      <TB title="Undo (⌘Z)" onClick={onUndo} disabled={!canUndo}>
        <Undo2 size={14} />
      </TB>
      <TB title="Redo (⌘⇧Z)" onClick={onRedo} disabled={!canRedo}>
        <Redo2 size={14} />
      </TB>
      <ToolbarDivider />
      <TB title="Heading 2" onClick={() => onInsert('\n## ', '', 'Heading')}>
        <Heading2 size={14} />
      </TB>
      <TB title="Heading 3" onClick={() => onInsert('\n### ', '', 'Subheading')}>
        <Heading3 size={14} />
      </TB>
      <ToolbarDivider />
      <TB title="Bold" onClick={() => onInsert('**', '**', 'bold text')}>
        <Bold size={14} />
      </TB>
      <TB title="Italic" onClick={() => onInsert('*', '*', 'italic text')}>
        <Italic size={14} />
      </TB>
      <TB title="Inline code" onClick={() => onInsert('`', '`', 'code')}>
        <Code size={14} />
      </TB>
      <ToolbarDivider />
      <TB title="Code block" onClick={() => onInsert('\n```\n', '\n```\n', 'code here')}>
        <Code2 size={14} />
      </TB>
      <TB title="Blockquote" onClick={() => onInsert('\n> ', '', 'quote')}>
        <Quote size={14} />
      </TB>
      <TB title="Divider" onClick={() => onInsert('\n\n---\n\n')}>
        <Minus size={14} />
      </TB>
      <ToolbarDivider />
      <TB title="Link" onClick={() => onInsert('[', '](url)', 'link text')}>
        <Link size={14} />
      </TB>
      <TB title="Image (markdown)" onClick={() => onInsert('![', '](https://)', 'alt text')}>
        <ImageIcon size={14} />
      </TB>
      <TB title="Upload image" onClick={onUploadImage} disabled={uploadingImage}>
        {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
      </TB>
      <ToolbarDivider />
      <TB title="Callout: Note" onClick={() => onInsert('\n<Callout type="note">\n', '\n</Callout>\n', 'Note content')}>
        <Info size={14} className="text-blue-500" /><span className="text-xs">Note</span>
      </TB>
      <TB title="Callout: Warning" onClick={() => onInsert('\n<Callout type="warning">\n', '\n</Callout>\n', 'Warning content')}>
        <AlertTriangle size={14} className="text-yellow-500" /><span className="text-xs">Warn</span>
      </TB>
      <TB title="Callout: Tip" onClick={() => onInsert('\n<Callout type="tip">\n', '\n</Callout>\n', 'Tip content')}>
        <CheckCircle size={14} className="text-green-500" /><span className="text-xs">Tip</span>
      </TB>
      <TB title="Callout: Important" onClick={() => onInsert('\n<Callout type="important">\n', '\n</Callout>\n', 'Important content')}>
        <Zap size={14} className="text-red-500" /><span className="text-xs">!</span>
      </TB>
    </div>
  )
}

// ── Main editor ───────────────────────────────────────────────────────────────

interface BlogEditorProps {
  initialPost?: Partial<BlogPost>
  postId?: string
}

export function BlogEditor({ initialPost, postId }: BlogEditorProps) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // ── History stack (refs = no re-renders on every keystroke) ──────────────────
  const initialContent = initialPost?.content ?? ''
  const historyRef = useRef<string[]>([initialContent])
  const historyIdxRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  function syncUndoRedo() {
    setCanUndo(historyIdxRef.current > 0)
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1)
  }

  function commitHistory(text: string) {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null }
    const stack = historyRef.current.slice(0, historyIdxRef.current + 1)
    if (stack[stack.length - 1] === text) return
    const next = [...stack, text].slice(-100) // cap at 100 snapshots
    historyRef.current = next
    historyIdxRef.current = next.length - 1
    syncUndoRedo()
  }

  function undo() {
    if (debounceRef.current) commitHistory(content) // flush pending snapshot
    if (historyIdxRef.current <= 0) return
    historyIdxRef.current--
    setContent(historyRef.current[historyIdxRef.current])
    syncUndoRedo()
  }

  function redo() {
    if (historyIdxRef.current >= historyRef.current.length - 1) return
    historyIdxRef.current++
    setContent(historyRef.current[historyIdxRef.current])
    syncUndoRedo()
  }

  function handleTextChange(val: string) {
    setContent(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => commitHistory(val), 800)
  }

  function handleEditorKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const mod = e.metaKey || e.ctrlKey
    if (!mod || e.key !== 'z') return
    e.preventDefault()
    if (e.shiftKey) redo()
    else undo()
  }
  // ─────────────────────────────────────────────────────────────────────────────

  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [slug, setSlug] = useState(initialPost?.slug ?? '')
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '')
  const [content, setContent] = useState(initialContent)
  const coverImage = initialPost?.coverImage ?? ''
  const coverImagePath = initialPost?.coverImagePath ?? ''
  const [inlineImages, setInlineImages] = useState<{ url: string; path: string }[]>(
    () => (initialPost?.imagePaths ?? []).map((p) => ({
      path: p,
      url: `${process.env.NEXT_PUBLIC_CDN_URL ?? ''}/${p}`,
    }))
  )
  const [tags, setTags] = useState<string[]>(initialPost?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [published, setPublished] = useState(initialPost?.published ?? false)
  const [saving, setSaving] = useState(false)
  const [deletingImagePath, setDeletingImagePath] = useState<string | null>(null)
  const [error, setError] = useState('')

  const previewText = content
    .replace(/<Callout[^>]*>([\s\S]*?)<\/Callout>/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^-{3,}$/gm, '')
  const readingTime = Math.max(1, Math.ceil(previewText.trim().split(/\s+/).filter(Boolean).length / 200))
  const wordCount = previewText.trim().split(/\s+/).filter(Boolean).length

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!postId) setSlug(slugify(val))
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  const insert = useCallback((before: string, after = '', placeholder = '') => {
    const el = textareaRef.current
    if (!el) return
    commitHistory(content) // snapshot before the toolbar action
    const { selectionStart: s, selectionEnd: e } = el
    const selected = content.slice(s, e) || placeholder
    const next = content.slice(0, s) + before + selected + after + content.slice(e)
    setContent(next)
    // schedule a snapshot for the new content too
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => commitHistory(next), 100)
    requestAnimationFrame(() => {
      el.focus()
      const pos = s + before.length + selected.length + (after ? after.length : 0)
      el.setSelectionRange(pos, pos)
    })
  }, [content])

  async function uploadToGarage(file: File, folder: string): Promise<{ url: string; storagePath: string } | null> {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', folder)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) return null
    return res.json()
  }

  async function handleInlineImageUpload(files: FileList | null) {
    if (!files?.length) return
    setUploadingImage(true)
    try {
      const result = await uploadToGarage(files[0], 'blog')
      if (result) {
        insert('![', `](${result.url})`, 'alt text')
        setInlineImages((prev) => [...prev, { url: result.url, path: result.storagePath }])
      }
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  async function handleDeleteInlineImage(path: string) {
    setDeletingImagePath(path)
    try {
      const { deletePostImageAction } = await import('@/app/actions/blog')
      await deletePostImageAction(postId ?? '', path)
      setInlineImages((prev) => prev.filter((img) => img.path !== path))
    } finally {
      setDeletingImagePath(null)
    }
  }

  async function handleSave() {
    if (!title || !slug || !content) {
      setError('Title, slug, and content are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { saveBlogPostAction } = await import('@/app/actions/blog')
      const now = new Date().toISOString()
      const result = await saveBlogPostAction({
        id: postId,
        title, slug, excerpt, content,
        coverImage: coverImage || undefined,
        coverImagePath: coverImagePath || undefined,
        imagePaths: inlineImages.map((img) => img.path),
        tags, published, readingTime,
        publishedAt: initialPost?.publishedAt ?? now,
        createdAt: initialPost?.createdAt ?? now,
        updatedAt: now,
      })
      if ('error' in result) { setError(result.error ?? 'Unknown error'); return }
      router.push('/admin/blog')
      router.refresh()
    } catch {
      setError('Failed to save post.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{postId ? 'Edit Post' : 'New Post'}</h1>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Clock size={12} />
            {readingTime} min read
          </span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm font-semibold">{published ? 'Live' : 'Draft'}</span>
            <button
              type="button"
              onClick={() => setPublished(!published)}
              className={`relative w-10 h-6 rounded-full border-2 border-border shadow-brutal-sm transition-all ${published ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full border-2 border-border bg-card transition-all ${published ? 'left-4' : 'left-0.5'}`} />
            </button>
          </label>
          <Button onClick={handleSave} disabled={saving}>
            <Save size={14} />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="border-2 border-destructive bg-destructive/10 rounded-xl p-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Meta fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border-2 border-border shadow-brutal rounded-2xl p-6">
        <div className="space-y-1.5">
          <Label>Title *</Label>
          <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Post title" />
        </div>
        <div className="space-y-1.5">
          <Label>Slug *</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="post-slug" className="font-mono" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Excerpt</Label>
          <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short description shown in the post list" />
        </div>
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="Add tag + Enter"
            />
            <Button type="button" variant="secondary" size="icon" onClick={addTag}>
              <Plus size={14} />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 bg-secondary border-2 border-border rounded-lg px-2 py-0.5 text-xs font-semibold shadow-brutal-sm">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Split editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-2 border-border shadow-brutal rounded-2xl overflow-hidden" style={{ minHeight: 600 }}>

        {/* ── Left: editor ── */}
        <div className="flex flex-col border-b-2 lg:border-b-0 lg:border-r-2 border-border">
          <div className="border-b-2 border-border bg-muted/50 px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide">MDX Editor</span>
            <span className="text-xs text-muted-foreground font-mono">{wordCount} words</span>
          </div>
          <Toolbar
            onInsert={insert}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onUploadImage={() => imageInputRef.current?.click()}
            uploadingImage={uploadingImage}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleInlineImageUpload(e.target.files)}
          />
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleEditorKeyDown}
            placeholder={`Write in MDX...\n\n## Example heading\n\nParagraph text here.\n\n<Callout type="note">\nThis is a note component.\n</Callout>`}
            className="flex-1 w-full resize-none bg-background text-foreground font-mono text-sm p-5 focus:outline-none"
            spellCheck={false}
            style={{ minHeight: 500 }}
          />
        </div>

        {/* ── Right: preview ── */}
        <div className="overflow-y-auto bg-card">
          <div className="border-b-2 border-border bg-muted/50 px-4 py-2">
            <span className="text-xs font-semibold tracking-wide">Preview</span>
          </div>
          <MDXPreview content={content} title={title} />
        </div>
      </div>

      {/* ── Inline images ── */}
      {inlineImages.length > 0 && (
        <div className="border-2 border-border shadow-brutal rounded-2xl overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b-2 border-border">
            <span className="text-xs font-semibold tracking-wide">Uploaded Images</span>
            <span className="text-xs text-muted-foreground ml-2">({inlineImages.length})</span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {inlineImages.map((img) => (
              <div key={img.path} className="relative group border-2 border-border rounded-xl overflow-hidden shadow-brutal-sm">
                <img src={img.url} alt="" className="w-full h-24 object-cover" />
                <button
                  type="button"
                  title="Delete from storage"
                  disabled={deletingImagePath === img.path}
                  onClick={() => handleDeleteInlineImage(img.path)}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {deletingImagePath === img.path
                    ? <Loader2 size={20} className="animate-spin text-white" />
                    : <Trash2 size={20} className="text-white" />
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
