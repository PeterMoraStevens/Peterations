'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { DragHandle } from '@tiptap/extension-drag-handle-react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import { Markdown } from 'tiptap-markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalloutNode, preprocessCallouts } from './extensions/CalloutNode'
import {
  Save, Plus, X, Clock, Bold, Italic, Code, Code2, Heading2, Heading3,
  Link as LinkIcon, ExternalLink, Minus, Quote, Info, AlertTriangle, CheckCircle, Zap,
  Undo2, Redo2, UploadCloud, Loader2, Trash2, Check,
  Underline as UnderlineIcon, Highlighter, Strikethrough, Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  GripVertical,
} from 'lucide-react'
import type { BlogPost } from '@/types'
import type { Editor } from '@tiptap/react'

function slugify(str: string): string {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

// ── Highlight colour presets ─────────────────────────────────────────────────

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Pink',   value: '#fbcfe8' },
  { label: 'Green',  value: '#bbf7d0' },
  { label: 'Blue',   value: '#bfdbfe' },
] as const

// ── Toolbar ───────────────────────────────────────────────────────────────────

function ToolbarDivider() {
  return <span className="w-px h-5 bg-border mx-0.5 shrink-0" />
}

function TB({
  label, title, onClick, disabled, active, children,
}: {
  label?: string; title: string; onClick: () => void; disabled?: boolean; active?: boolean; children?: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
      }`}
    >
      {children}
      {label && <span>{label}</span>}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkHref, setLinkHref] = useState('')

  const openLink = useCallback(() => {
    setLinkHref(editor.getAttributes('link').href ?? '')
    setLinkOpen(true)
  }, [editor])

  const applyLink = useCallback((href: string) => {
    if (href.trim()) {
      editor.chain().focus().setLink({ href: href.trim() }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
    setLinkOpen(false)
  }, [editor])

  const insertCallout = useCallback((type: 'note' | 'warning' | 'tip' | 'important') => {
    editor.chain().focus().insertContent({
      type: 'callout',
      attrs: { calloutType: type },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: `${type.charAt(0).toUpperCase() + type.slice(1)} content` }] }],
    }).run()
  }, [editor])

  return (
    <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 border-b-2 border-border bg-background">
      <TB title="Undo (⌘Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 size={14} />
      </TB>
      <TB title="Redo (⌘⇧Z)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 size={14} />
      </TB>
      <ToolbarDivider />
      <TB title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={14} />
      </TB>
      <TB title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 size={14} />
      </TB>
      <ToolbarDivider />
      <TB title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={14} />
      </TB>
      <TB title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={14} />
      </TB>
      <TB title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={14} />
      </TB>
      <TB title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={14} />
      </TB>
      <TB title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code size={14} />
      </TB>
      <ToolbarDivider />
      {/* Highlight colour swatches */}
      {HIGHLIGHT_COLORS.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          title={`Highlight ${label}`}
          onClick={() => editor.chain().focus().toggleHighlight({ color: value }).run()}
          className={`w-5 h-5 rounded border-2 transition-all shrink-0 ${
            editor.isActive('highlight', { color: value }) ? 'border-foreground scale-110' : 'border-border hover:scale-110'
          }`}
          style={{ backgroundColor: value }}
        />
      ))}
      <TB title="Clear highlight" onClick={() => editor.chain().focus().unsetHighlight().run()}>
        <Highlighter size={14} className="opacity-40" />
      </TB>
      <ToolbarDivider />
      <TB title="Superscript" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
        <SuperscriptIcon size={14} />
      </TB>
      <TB title="Subscript" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}>
        <SubscriptIcon size={14} />
      </TB>
      <ToolbarDivider />
      <TB title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 size={14} />
      </TB>
      <TB title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={14} />
      </TB>
      <TB title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={14} />
      </TB>
      <ToolbarDivider />
      <div className="relative">
        <TB title="Link" active={editor.isActive('link') || linkOpen} onClick={openLink}>
          <LinkIcon size={14} />
        </TB>
        {linkOpen && (
          <div className="absolute top-full left-0 mt-1 z-20 flex items-center gap-1.5 bg-card border-2 border-border shadow-brutal rounded-xl px-2.5 py-2 min-w-[300px]">
            <input
              autoFocus
              type="url"
              value={linkHref}
              onChange={(e) => setLinkHref(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink(linkHref) }
                if (e.key === 'Escape') setLinkOpen(false)
              }}
              placeholder="https://"
              className="flex-1 text-xs bg-transparent border-none outline-none font-mono min-w-0"
            />
            {linkHref && (
              <a href={linkHref} target="_blank" rel="noopener noreferrer"
                className="p-0.5 hover:bg-muted rounded shrink-0" title="Open link">
                <ExternalLink size={12} />
              </a>
            )}
            <button type="button" onClick={() => applyLink(linkHref)}
              className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground shrink-0">
              Apply
            </button>
            {editor.isActive('link') && (
              <button type="button" onClick={() => applyLink('')}
                className="px-2 py-0.5 rounded-lg text-xs font-semibold text-destructive hover:bg-muted shrink-0">
                Remove
              </button>
            )}
            <button type="button" onClick={() => setLinkOpen(false)}
              className="p-0.5 hover:bg-muted rounded shrink-0">
              <X size={12} />
            </button>
          </div>
        )}
      </div>
      <ToolbarDivider />
      <TB title="Callout: Note" onClick={() => insertCallout('note')}>
        <Info size={14} className="text-blue-500" /><span className="text-xs">Note</span>
      </TB>
      <TB title="Callout: Warning" onClick={() => insertCallout('warning')}>
        <AlertTriangle size={14} className="text-yellow-500" /><span className="text-xs">Warn</span>
      </TB>
      <TB title="Callout: Tip" onClick={() => insertCallout('tip')}>
        <CheckCircle size={14} className="text-green-500" /><span className="text-xs">Tip</span>
      </TB>
      <TB title="Callout: Important" onClick={() => insertCallout('important')}>
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
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [savedPostId, setSavedPostId] = useState<string | undefined>(postId)
  const [saved, setSaved] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Write your post…' }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Superscript,
      Subscript,
      Markdown.configure({ html: true, tightLists: true }),
      CalloutNode,
    ],
    content: preprocessCallouts(initialPost?.content ?? ''),
    immediatelyRender: false,
  })

  const [bubbleLinkOpen, setBubbleLinkOpen] = useState(false)
  const [bubbleLinkHref, setBubbleLinkHref] = useState('')
  const bubbleLinkOpenRef = useRef(false)
  bubbleLinkOpenRef.current = bubbleLinkOpen

  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [slug, setSlug] = useState(initialPost?.slug ?? '')
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '')
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
  const [publishedAt, setPublishedAt] = useState<string>(
    initialPost?.publishedAt ? initialPost.publishedAt.substring(0, 16) : new Date().toISOString().substring(0, 16)
  )
  const [saving, setSaving] = useState(false)
  const [deletingImagePath, setDeletingImagePath] = useState<string | null>(null)
  const [error, setError] = useState('')

  const wordCount = editor?.state.doc.textContent.trim().split(/\s+/).filter(Boolean).length ?? 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

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

  async function uploadToGarage(file: File, folder: string): Promise<{ url: string; storagePath: string } | null> {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', folder)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) return null
    return res.json()
  }

  async function handleInlineImageUpload(files: FileList | null) {
    if (!files?.length || !editor) return
    setUploadingImage(true)
    try {
      const result = await uploadToGarage(files[0], 'blog')
      if (result) {
        editor.chain().focus().setImage({ src: result.url, alt: 'image' }).run()
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
    if (!editor) return
    const content = (editor.storage as any).markdown.getMarkdown()
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
        id: savedPostId,
        title, slug, excerpt, content,
        coverImage: coverImage || undefined,
        coverImagePath: coverImagePath || undefined,
        imagePaths: inlineImages.map((img) => img.path),
        tags, published, readingTime,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : now,
        createdAt: initialPost?.createdAt ?? now,
        updatedAt: now,
      })
      if ('error' in result) { setError(result.error ?? 'Unknown error'); return }
      if (!savedPostId) {
        setSavedPostId(result.id)
        router.replace(`/admin/blog/${result.id}`)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
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
          <Button onClick={handleSave} disabled={saving} variant={saved ? 'secondary' : 'default'}>
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
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
          <Label>Published date</Label>
          <Input
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="font-mono"
          />
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

      {/* Editor */}
      <div className="border-2 border-border shadow-brutal rounded-2xl overflow-hidden h-[680px] flex flex-col">
        <div className="border-b-2 border-border bg-muted/50 px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold tracking-wide">Editor</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">{wordCount} words</span>
            <button
              type="button"
              title="Upload image"
              disabled={uploadingImage}
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
              <span>Upload</span>
            </button>
          </div>
        </div>
        {editor && <Toolbar editor={editor} />}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleInlineImageUpload(e.target.files)}
        />

        {/* Bubble menu — appears on text selection */}
        {editor && (
          <BubbleMenu
            editor={editor}
            shouldShow={() => bubbleLinkOpenRef.current || !editor.state.selection.empty}
            className="flex flex-col bg-card border-2 border-border shadow-brutal rounded-xl overflow-hidden"
          >
            <div className="flex items-center gap-0.5 px-1.5 py-1">
              <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                B
              </button>
              <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-2 py-1 rounded text-xs italic transition-colors ${editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                I
              </button>
              <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`px-2 py-1 rounded text-xs underline transition-colors ${editor.isActive('underline') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                U
              </button>
              <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`px-2 py-1 rounded text-xs line-through transition-colors ${editor.isActive('strike') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                S
              </button>
              <span className="w-px h-4 bg-border mx-0.5" />
              {HIGHLIGHT_COLORS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  title={`Highlight ${label}`}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: value }).run()}
                  className={`w-4 h-4 rounded border-2 transition-all ${editor.isActive('highlight', { color: value }) ? 'border-foreground scale-110' : 'border-border'}`}
                  style={{ backgroundColor: value }}
                />
              ))}
              <span className="w-px h-4 bg-border mx-0.5" />
              <button type="button" onClick={() => editor.chain().focus().toggleCode().run()}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${editor.isActive('code') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                {"</>"}
              </button>
              <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                H2
              </button>
              <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                H3
              </button>
              <span className="w-px h-4 bg-border mx-0.5" />
              <button
                type="button"
                title="Link"
                onClick={() => { setBubbleLinkHref(editor.getAttributes('link').href ?? ''); setBubbleLinkOpen(true) }}
                className={`px-2 py-1 rounded text-xs transition-colors ${editor.isActive('link') || bubbleLinkOpen ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                <LinkIcon size={12} />
              </button>
            </div>

            {bubbleLinkOpen && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 border-t-2 border-border">
                <input
                  autoFocus
                  type="url"
                  value={bubbleLinkHref}
                  onChange={(e) => setBubbleLinkHref(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const href = bubbleLinkHref.trim()
                      if (href) { editor.chain().focus().setLink({ href }).run() }
                      else { editor.chain().focus().unsetLink().run() }
                      setBubbleLinkOpen(false)
                    }
                    if (e.key === 'Escape') setBubbleLinkOpen(false)
                  }}
                  placeholder="https://"
                  className="flex-1 text-xs bg-transparent border-none outline-none font-mono min-w-0"
                  onMouseDown={(e) => e.stopPropagation()}
                />
                {bubbleLinkHref && (
                  <a href={bubbleLinkHref} target="_blank" rel="noopener noreferrer"
                    className="p-0.5 hover:bg-muted rounded shrink-0" title="Open link">
                    <ExternalLink size={11} />
                  </a>
                )}
                <button type="button"
                  onClick={() => {
                    const href = bubbleLinkHref.trim()
                    if (href) { editor.chain().focus().setLink({ href }).run() }
                    else { editor.chain().focus().unsetLink().run() }
                    setBubbleLinkOpen(false)
                  }}
                  className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground shrink-0">
                  Apply
                </button>
                {editor.isActive('link') && (
                  <button type="button"
                    onClick={() => { editor.chain().focus().unsetLink().run(); setBubbleLinkOpen(false) }}
                    className="px-2 py-0.5 rounded-lg text-xs font-semibold text-destructive hover:bg-muted shrink-0">
                    Remove
                  </button>
                )}
                <button type="button" onClick={() => setBubbleLinkOpen(false)}
                  className="p-0.5 hover:bg-muted rounded shrink-0">
                  <X size={11} />
                </button>
              </div>
            )}
          </BubbleMenu>
        )}

        {/* Drag handle */}
        {editor && (
          <DragHandle editor={editor} className="flex items-center justify-center w-6 h-6 rounded hover:bg-muted cursor-grab active:cursor-grabbing transition-colors">
            <GripVertical size={14} className="text-muted-foreground" />
          </DragHandle>
        )}

        <EditorContent
          editor={editor}
          className="relative flex-1 overflow-y-auto bg-card prose prose-lg max-w-none prose-brutal [&_.ProseMirror]:outline-none [&_.ProseMirror]:py-5 [&_.ProseMirror]:pr-5 [&_.ProseMirror]:pl-10 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
        />
      </div>

      {/* Inline images */}
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
