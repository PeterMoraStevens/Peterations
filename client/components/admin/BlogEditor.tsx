'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import { DragHandle } from '@tiptap/extension-drag-handle-react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { Markdown } from 'tiptap-markdown'
import type { EditorView } from '@tiptap/pm/view'
import { formatDistanceToNowStrict } from 'date-fns'
import {
  ArrowLeft, Check, Clock, CloudOff, ExternalLink, GripVertical, Loader2, PanelRight, Rocket, RotateCcw, Save, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { mdxToEditorHtml, toEmbedUrl } from '@/lib/blog/content'
import type { BlogPost } from '@/types'
import { CalloutNode } from './extensions/CalloutNode'
import { ChartNode } from './extensions/ChartNode'
import { CodeBlockNode } from './extensions/CodeBlockNode'
import { EmbedNode } from './extensions/EmbedNode'
import { BlogImageNode, type UploadFn } from './extensions/ImageNode'
import { QuizNode } from './extensions/QuizNode'
import { SlashCommand } from './extensions/SlashCommand'
import { ToggleNode } from './extensions/ToggleNode'
import {
  MdxTable, MdxTableCell, MdxTableHeader, MdxText, NamedHighlight, TableRow, TextColor,
} from './extensions/markdown'
import { CoverImage } from './blog-editor/CoverImage'
import { SettingsPanel, type InlineImage } from './blog-editor/SettingsPanel'
import { SelectionBubble, Toolbar } from './blog-editor/Toolbar'

const AUTOSAVE_MS = 1500
const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? ''

function slugify(str: string): string {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

function toLocalInput(iso?: string) {
  const d = iso ? new Date(iso) : new Date()
  // datetime-local wants local time without a zone.
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown()
}

async function uploadFile(file: File, folder: string): Promise<{ url: string; storagePath: string } | null> {
  const form = new FormData()
  form.append('file', file)
  form.append('folder', folder)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) return null
  return res.json()
}

interface Fields {
  title: string
  slug: string
  excerpt: string
  tags: string[]
  coverImage: string
  coverImagePath: string
  publishedAt: string
  imagePaths: string[]
}

interface LocalDraft { fields: Fields; content: string; savedAt: number }

type Status = 'idle' | 'editing' | 'saving' | 'saved' | 'local' | 'error'

const localKey = (id?: string) => `blog-editor:${id ?? 'new'}`

function readLocal(id?: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(localKey(id))
    return raw ? (JSON.parse(raw) as LocalDraft) : null
  } catch {
    return null
  }
}
function writeLocal(id: string | undefined, draft: LocalDraft) {
  try { localStorage.setItem(localKey(id), JSON.stringify(draft)) } catch { /* storage full or blocked */ }
}
function clearLocal(id?: string) {
  try { localStorage.removeItem(localKey(id)) } catch { /* blocked */ }
}

// ── Editor ───────────────────────────────────────────────────────────────────

interface BlogEditorProps {
  initialPost?: Partial<BlogPost>
  postId?: string
}

export function BlogEditor({ initialPost, postId: initialId }: BlogEditorProps) {
  const [postId, setPostId] = useState(initialId)
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [slug, setSlug] = useState(initialPost?.slug ?? '')
  const [autoSlug, setAutoSlug] = useState(
    () => !initialPost?.published && (!initialPost?.slug || initialPost.slug === slugify(initialPost.title ?? '')),
  )
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '')
  const [tags, setTags] = useState<string[]>(initialPost?.tags ?? [])
  const [published, setPublished] = useState(initialPost?.published ?? false)
  const [publishedAt, setPublishedAt] = useState(() => toLocalInput(initialPost?.publishedAt || undefined))
  const [publishedAtTouched, setPublishedAtTouched] = useState(!!initialPost?.published)
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage ?? '')
  const [coverImagePath, setCoverImagePath] = useState(initialPost?.coverImagePath ?? '')
  const [coverUploading, setCoverUploading] = useState(false)
  const [inlineImages, setInlineImages] = useState<InlineImage[]>(
    () => (initialPost?.imagePaths ?? []).map((p) => ({ path: p, url: `${CDN}/${p}` })),
  )
  const [uploadingCount, setUploadingCount] = useState(0)
  const [deletingImagePath, setDeletingImagePath] = useState<string | null>(null)

  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(initialPost?.updatedAt ? new Date(initialPost.updatedAt) : null)
  const [savedSlug, setSavedSlug] = useState(initialPost?.slug ?? '')
  const [restore, setRestore] = useState<LocalDraft | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [words, setWords] = useState(0)
  const [, setClock] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const postIdRef = useRef(initialId)
  const publishedRef = useRef(published)
  const savedSnapshotRef = useRef<string | null>(null)
  const savedCoverPathRef = useRef(initialPost?.coverImagePath ?? '')
  const savingRef = useRef(false)
  const queuedRef = useRef(false)
  const uploadsRef = useRef(0)
  const fieldsRef = useRef<Fields>({
    title, slug, excerpt, tags, coverImage, coverImagePath, publishedAt,
    imagePaths: inlineImages.map((i) => i.path),
  })

  useEffect(() => {
    fieldsRef.current = {
      title, slug, excerpt, tags, coverImage, coverImagePath, publishedAt,
      imagePaths: inlineImages.map((i) => i.path),
    }
    publishedRef.current = published
  })

  const snapshot = useCallback((ed: Editor) => JSON.stringify({ ...fieldsRef.current, content: getMarkdown(ed) }), [])

  // ── Uploads ────────────────────────────────────────────────────────────────

  const uploadInline: UploadFn = useCallback(async (file) => {
    const res = await uploadFile(file, 'blog')
    if (res) setInlineImages((prev) => [...prev, { url: res.url, path: res.storagePath }])
    return res
  }, [])

  const insertImageFile = useCallback(async (file: File, pos?: number) => {
    const ed = editorRef.current
    if (!ed) return
    const id = Math.random().toString(36).slice(2)
    const blob = URL.createObjectURL(file)
    const node = ed.schema.nodes.image.create({ src: blob, uploading: true, uploadId: id })
    ed.view.dispatch(pos != null ? ed.state.tr.insert(pos, node) : ed.state.tr.replaceSelectionWith(node))

    uploadsRef.current++
    setUploadingCount((c) => c + 1)
    let res: Awaited<ReturnType<UploadFn>> = null
    try {
      res = await uploadInline(file)
    } catch {
      res = null
    }

    let found = -1
    ed.state.doc.descendants((n, p) => {
      if (found >= 0) return false
      if (n.type.name === 'image' && n.attrs.uploadId === id) found = p
    })
    if (found >= 0) {
      const current = ed.state.doc.nodeAt(found)!
      const tr = res
        ? ed.state.tr.setNodeMarkup(found, undefined, { ...current.attrs, src: res.url, uploading: false, uploadId: null })
        : ed.state.tr.delete(found, found + current.nodeSize)
      ed.view.dispatch(tr.setMeta('addToHistory', false))
    }
    URL.revokeObjectURL(blob)
    if (!res) setError('Image upload failed. Check your connection and try again.')

    uploadsRef.current--
    setUploadingCount((c) => c - 1)
    if (uploadsRef.current === 0 && queuedRef.current) {
      queuedRef.current = false
      void saveRef.current()
    }
  }, [uploadInline])

  // Editor props are captured once, so route them through a ref.
  const handlersRef = useRef<{
    paste: (view: EditorView, event: ClipboardEvent) => boolean
    drop: (view: EditorView, event: DragEvent, moved: boolean) => boolean
    key: (view: EditorView, event: KeyboardEvent) => boolean
  }>({ paste: () => false, drop: () => false, key: () => false })
  useEffect(() => {
    handlersRef.current = {
      paste(view, event) {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'))
        if (files.length) {
          files.forEach((f) => void insertImageFile(f))
          return true
        }
        const text = event.clipboardData?.getData('text/plain')?.trim() ?? ''
        const { $from, empty } = view.state.selection
        if (
          /^https?:\/\/\S+$/.test(text) && toEmbedUrl(text) && empty &&
          $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0
        ) {
          editorRef.current?.chain().focus().insertContent({ type: 'embed', attrs: { url: text } }).run()
          return true
        }
        return false
      },
      drop(view, event, moved) {
        if (moved) return false
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/'))
        if (!files.length) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        files.forEach((f) => void insertImageFile(f, pos))
        return true
      },
      key(_view, event) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault()
          setLinkOpen(true)
          return true
        }
        return false
      },
    }
  }, [insertImageFile])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        text: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
        dropcursor: { color: '#7c3aed', width: 3 },
      }),
      MdxText,
      CodeBlockNode,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Heading'
          return "Write something, or press '/' for blocks…"
        },
      }),
      NamedHighlight,
      TextColor,
      Superscript,
      Subscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      MdxTable,
      TableRow,
      MdxTableHeader,
      MdxTableCell,
      Markdown.configure({ html: true, tightLists: true, transformPastedText: true, breaks: false }),
      CalloutNode,
      ToggleNode,
      BlogImageNode.configure({ upload: uploadInline }),
      EmbedNode,
      ChartNode,
      QuizNode,
      SlashCommand.configure({ onImage: () => fileInputRef.current?.click() }),
    ],
    content: mdxToEditorHtml(initialPost?.content ?? ''),
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'blog-editor-content', spellcheck: 'true' },
      handlePaste: (view, event) => handlersRef.current.paste(view, event),
      handleDrop: (view, event, _slice, moved) => handlersRef.current.drop(view, event as DragEvent, moved),
      handleKeyDown: (view, event) => handlersRef.current.key(view, event),
    },
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed
      savedSnapshotRef.current = snapshot(ed)
      setWords(ed.getText().split(/\s+/).filter(Boolean).length)
    },
    onUpdate: ({ editor: ed }) => {
      setWords(ed.getText().split(/\s+/).filter(Boolean).length)
      setVersion((v) => v + 1)
    },
  })

  // ── Saving ─────────────────────────────────────────────────────────────────

  const save = useCallback(async (override?: { published?: boolean; publishedAt?: string; manual?: boolean }) => {
    const ed = editorRef.current
    if (!ed) return
    if (savingRef.current || uploadsRef.current > 0) {
      queuedRef.current = true
      return
    }
    const f = { ...fieldsRef.current, ...(override?.publishedAt ? { publishedAt: override.publishedAt } : {}) }
    if (!f.title.trim()) {
      if (override?.manual) setError('Give the post a title before saving.')
      return
    }
    const nextPublished = override?.published ?? publishedRef.current
    const finalSlug = f.slug || slugify(f.title) || `post-${Date.now().toString(36)}`
    const content = getMarkdown(ed)
    const snap = JSON.stringify({ ...f, content })
    const words = ed.getText().split(/\s+/).filter(Boolean).length

    savingRef.current = true
    setStatus('saving')
    try {
      const { saveBlogPostAction, deleteCoverImageAction } = await import('@/app/actions/blog')
      const now = new Date().toISOString()
      const result = await saveBlogPostAction({
        id: postIdRef.current,
        title: f.title.trim(),
        slug: finalSlug,
        excerpt: f.excerpt.trim(),
        content,
        coverImage: f.coverImage || undefined,
        coverImagePath: f.coverImagePath || undefined,
        imagePaths: f.imagePaths,
        tags: f.tags,
        published: nextPublished,
        readingTime: Math.max(1, Math.ceil(words / 200)),
        publishedAt: f.publishedAt ? new Date(f.publishedAt).toISOString() : now,
        createdAt: initialPost?.createdAt ?? now,
        updatedAt: now,
      })
      if ('error' in result) {
        setStatus('error')
        setError(result.error ?? 'Failed to save post.')
        return
      }

      if (!postIdRef.current) {
        postIdRef.current = result.id
        setPostId(result.id)
        clearLocal(undefined)
        // Swap the URL without remounting the editor (keeps cursor + undo history).
        window.history.replaceState(null, '', `/admin/blog/${result.id}`)
      }
      if (savedCoverPathRef.current && savedCoverPathRef.current !== f.coverImagePath) {
        void deleteCoverImageAction(savedCoverPathRef.current).catch(() => {})
      }
      savedCoverPathRef.current = f.coverImagePath
      if (!f.slug) setSlug(finalSlug)
      if (override?.publishedAt) setPublishedAt(override.publishedAt)
      publishedRef.current = nextPublished
      setPublished(nextPublished)
      if (nextPublished) setAutoSlug(false)
      setSavedSlug(finalSlug)
      savedSnapshotRef.current = snap
      clearLocal(postIdRef.current)
      setError('')
      setLastSavedAt(new Date(result.savedAt))
      setStatus(snapshot(ed) === snap ? 'saved' : nextPublished ? 'local' : 'editing')
    } catch {
      setStatus('error')
      setError("Couldn't reach the server. Your changes are kept on this device.")
    } finally {
      savingRef.current = false
      if (queuedRef.current) {
        queuedRef.current = false
        // Re-check on the next tick; the autosave effect picks up anything new.
        setVersion((v) => v + 1)
      }
    }
  }, [initialPost?.createdAt, snapshot])

  const saveRef = useRef(save)
  useEffect(() => { saveRef.current = save }, [save])

  // Autosave: drafts go to the server; live posts keep a local draft until "Update".
  useEffect(() => {
    const ed = editorRef.current
    if (!ed || savedSnapshotRef.current === null) return
    const timer = setTimeout(() => {
      const snap = snapshot(ed)
      if (snap === savedSnapshotRef.current) {
        setStatus((s) => (s === 'editing' || s === 'local' ? 'saved' : s))
        clearLocal(postIdRef.current)
        return
      }
      writeLocal(postIdRef.current, { fields: fieldsRef.current, content: getMarkdown(ed), savedAt: Date.now() })
      if (publishedRef.current) setStatus('local')
      else void saveRef.current()
    }, AUTOSAVE_MS)
    return () => clearTimeout(timer)
  }, [version, title, slug, excerpt, tags, coverImage, publishedAt, inlineImages, snapshot])

  const markEditing = useCallback(() => {
    setStatus((s) => (s === 'saving' ? s : publishedRef.current ? 'local' : 'editing'))
  }, [])
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    markEditing()
  }, [version, title, slug, excerpt, tags, coverImage, publishedAt, markEditing])

  // Offer to restore a local draft newer than what the server has.
  useEffect(() => {
    const local = readLocal(initialId)
    if (!local) return
    const serverTime = initialPost?.updatedAt ? new Date(initialPost.updatedAt).getTime() : 0
    if (local.savedAt > serverTime && local.content !== (initialPost?.content ?? '')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRestore(local)
    } else {
      clearLocal(initialId)
    }
  }, [initialId, initialPost?.updatedAt, initialPost?.content])

  function applyRestore() {
    if (!restore || !editor) return
    const f = restore.fields
    setTitle(f.title); setSlug(f.slug); setExcerpt(f.excerpt); setTags(f.tags)
    setCoverImage(f.coverImage); setCoverImagePath(f.coverImagePath); setPublishedAt(f.publishedAt)
    editor.commands.setContent(mdxToEditorHtml(restore.content))
    setRestore(null)
  }

  // ⌘S / Ctrl+S saves (and pushes live edits on published posts).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveRef.current({ manual: true })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Warn before leaving with changes the server doesn't have yet.
  useEffect(() => {
    const unsaved = status === 'editing' || status === 'saving' || status === 'local' || status === 'error' || uploadingCount > 0
    if (!unsaved) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [status, uploadingCount])

  // Keep "Saved 2 min ago" fresh.
  useEffect(() => {
    const t = setInterval(() => setClock((c) => c + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  // ── Field handlers ─────────────────────────────────────────────────────────

  function handleTitleChange(val: string) {
    setTitle(val)
    if (autoSlug) setSlug(slugify(val))
  }

  async function handleCoverFile(file: File) {
    setCoverUploading(true)
    try {
      const res = await uploadFile(file, 'blog/covers')
      if (!res) { setError('Cover upload failed.'); return }
      // A cover that was never saved can go straight away.
      if (coverImagePath && coverImagePath !== savedCoverPathRef.current) {
        const { deleteCoverImageAction } = await import('@/app/actions/blog')
        void deleteCoverImageAction(coverImagePath).catch(() => {})
      }
      setCoverImage(res.url)
      setCoverImagePath(res.storagePath)
    } finally {
      setCoverUploading(false)
    }
  }

  async function handleCoverRemove() {
    if (coverImagePath && coverImagePath !== savedCoverPathRef.current) {
      const { deleteCoverImageAction } = await import('@/app/actions/blog')
      void deleteCoverImageAction(coverImagePath).catch(() => {})
    }
    setCoverImage('')
    setCoverImagePath('')
  }

  async function handleDeleteInlineImage(path: string) {
    setDeletingImagePath(path)
    try {
      const { deletePostImageAction } = await import('@/app/actions/blog')
      await deletePostImageAction(postIdRef.current ?? '', path)
      setInlineImages((prev) => prev.filter((img) => img.path !== path))
    } catch {
      setError('Could not delete that image.')
    } finally {
      setDeletingImagePath(null)
    }
  }

  function publish() {
    void save({
      published: true,
      manual: true,
      // First publish of an old draft: date it today unless a date was chosen.
      publishedAt: publishedAtTouched ? undefined : toLocalInput(),
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const readingTime = Math.max(1, Math.ceil(words / 200))
  const hasUnpushed = published && status === 'local'
  // Image URLs still in the doc, so the settings panel won't offer to delete them.
  const usedImages: string[] = []
  if (editor && showSettings) {
    editor.state.doc.descendants((n) => { if (n.type.name === 'image') usedImages.push(n.attrs.src) })
  }

  return (
    <div className="-mt-4 pb-24">
      {/* Sticky header: status, actions, formatting */}
      <div className="sticky top-[58px] z-30 -mx-4 mb-6 border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-3 px-4 py-2">
          <Link href="/admin/blog" className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold hover:bg-muted">
            <ArrowLeft size={15} /> <span className="hidden sm:inline">Posts</span>
          </Link>
          <span className={cn(
            'rounded-md border-2 border-border px-1.5 py-0.5 text-[11px] font-bold',
            published ? 'bg-secondary text-secondary-foreground' : 'bg-card',
          )}>
            {published ? 'Live' : 'Draft'}
          </span>
          <SaveStatus status={status} lastSavedAt={lastSavedAt} hasTitle={!!title.trim()} published={published} />

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Clock size={12} /> {words.toLocaleString()} words · {readingTime} min
            </span>
            {postId && savedSlug && (
              <a
                href={`/blog/${savedSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                title={published ? 'View live post' : 'Preview draft'}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-muted"
              >
                <ExternalLink size={13} /> <span className="hidden sm:inline">{published ? 'View' : 'Preview'}</span>
              </a>
            )}
            <button
              type="button"
              title="Post settings"
              onClick={() => setShowSettings(!showSettings)}
              className={cn('rounded-lg p-1.5 hover:bg-muted', showSettings && 'bg-primary')}
            >
              <PanelRight size={16} />
            </button>
            {published ? (
              <Button size="sm" onClick={() => save({ manual: true })} disabled={status === 'saving' || (!hasUnpushed && status !== 'error')}>
                {status === 'saving' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Update
              </Button>
            ) : (
              <Button size="sm" onClick={publish} disabled={status === 'saving' || !title.trim()}>
                <Rocket size={13} /> Publish
              </Button>
            )}
          </div>
        </div>
        {editor && (
          <div className="border-t-2 border-border bg-card">
            <Toolbar editor={editor} onImage={() => fileInputRef.current?.click()} uploading={uploadingCount > 0} />
          </div>
        )}
      </div>

      {restore && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border-2 border-border bg-accent px-4 py-3 text-sm shadow-brutal-sm">
          <RotateCcw size={15} />
          <span className="font-semibold">
            Found unsaved changes from {formatDistanceToNowStrict(restore.savedAt, { addSuffix: true })}.
          </span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { clearLocal(initialId); setRestore(null) }}>Discard</Button>
            <Button size="sm" onClick={applyRestore}>Restore</Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          <CloudOff size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          {status === 'error' && (
            <button type="button" onClick={() => save({ manual: true })} className="font-semibold underline underline-offset-2">Retry</button>
          )}
          <button type="button" title="Dismiss" onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}

      <div className={cn('grid gap-8', showSettings && 'lg:grid-cols-[minmax(0,1fr)_280px]')}>
        <div className="min-w-0 mx-auto w-full max-w-3xl">
          <CoverImage url={coverImage} uploading={coverUploading} onFile={handleCoverFile} onRemove={handleCoverRemove} />

          <AutoTextarea
            value={title}
            onChange={handleTitleChange}
            onEnter={() => editor?.commands.focus('start')}
            placeholder="Untitled post"
            className="mt-8 text-4xl md:text-5xl font-bold leading-tight"
          />
          <AutoTextarea
            value={excerpt}
            onChange={setExcerpt}
            onEnter={() => editor?.commands.focus('start')}
            placeholder="Add a one-line summary for the post list…"
            className="mt-3 text-lg font-medium text-muted-foreground"
          />

          <div className="mt-8 rounded-2xl border-2 border-border bg-card shadow-brutal">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                Array.from(e.target.files ?? []).forEach((f) => void insertImageFile(f))
                e.target.value = ''
              }}
            />
            {editor && <SelectionBubble editor={editor} linkOpen={linkOpen} setLinkOpen={setLinkOpen} />}
            {editor && (
              <DragHandle editor={editor} className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted cursor-grab active:cursor-grabbing">
                <GripVertical size={14} className="text-muted-foreground" />
              </DragHandle>
            )}
            <EditorContent
              editor={editor}
              className="blog-editor prose prose-lg max-w-none prose-brutal min-h-[60vh] py-8 pl-12 pr-6 sm:pr-10"
            />
          </div>
        </div>

        {showSettings && (
          <aside className="lg:sticky lg:top-[170px] lg:self-start rounded-2xl border-2 border-border bg-background p-5 shadow-brutal lg:max-h-[calc(100vh-190px)] lg:overflow-y-auto">
            <SettingsPanel
              slug={slug}
              onSlugChange={(v) => { setSlug(slugify(v.replace(/\s/g, '-')) || v.toLowerCase()); setAutoSlug(false) }}
              onSlugReset={() => { setSlug(slugify(title)); setAutoSlug(!published) }}
              autoSlug={autoSlug}
              publishedAt={publishedAt}
              onPublishedAtChange={(v) => { setPublishedAt(v); setPublishedAtTouched(true) }}
              tags={tags}
              onTagsChange={setTags}
              published={published}
              onUnpublish={() => save({ published: false, manual: true })}
              images={inlineImages}
              content={usedImages.join('\n')}
              deletingPath={deletingImagePath}
              onDeleteImage={handleDeleteInlineImage}
            />
          </aside>
        )}
      </div>
    </div>
  )
}

// ── Bits ─────────────────────────────────────────────────────────────────────

function SaveStatus({ status, lastSavedAt, hasTitle, published }: {
  status: Status; lastSavedAt: Date | null; hasTitle: boolean; published: boolean
}) {
  const ago = lastSavedAt ? formatDistanceToNowStrict(lastSavedAt, { addSuffix: true }) : null
  let icon = <Check size={13} />
  let text: string
  let tone = 'text-muted-foreground'

  switch (status) {
    case 'saving':
      icon = <Loader2 size={13} className="animate-spin" />
      text = 'Saving…'
      break
    case 'editing':
      icon = <span className="h-2 w-2 rounded-full bg-amber-400 border border-border" />
      text = hasTitle ? 'Editing…' : 'Add a title to start autosaving'
      break
    case 'local':
      icon = <span className="h-2 w-2 rounded-full bg-amber-400 border border-border" />
      text = 'Unpublished changes · saved on this device'
      tone = 'text-foreground'
      break
    case 'error':
      icon = <CloudOff size={13} />
      text = 'Not saved'
      tone = 'text-destructive'
      break
    case 'saved':
      text = `Saved ${ago ?? ''}`.trim()
      break
    default:
      text = ago ? `Saved ${ago}` : published ? 'Up to date' : 'Not saved yet'
  }

  return (
    <span className={cn('flex min-w-0 items-center gap-1.5 truncate text-xs font-medium', tone)} aria-live="polite">
      {icon}
      <span className="truncate">{text}</span>
    </span>
  )
}

function AutoTextarea({ value, onChange, onEnter, placeholder, className }: {
  value: string
  onChange: (v: string) => void
  onEnter: () => void
  placeholder: string
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); onEnter() }
      }}
      className={cn('block w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-muted-foreground/50', className)}
    />
  )
}
