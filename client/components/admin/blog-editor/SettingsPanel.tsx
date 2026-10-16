'use client'

import React, { useState } from 'react'
import { Link2, RefreshCw, X, Loader2, Trash2, Keyboard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Kbd } from './ui'

export interface InlineImage { url: string; path: string }

export function SettingsPanel({
  slug, onSlugChange, onSlugReset, autoSlug,
  publishedAt, onPublishedAtChange,
  tags, onTagsChange,
  published, onUnpublish,
  images, content, deletingPath, onDeleteImage,
}: {
  slug: string
  onSlugChange: (v: string) => void
  onSlugReset: () => void
  autoSlug: boolean
  publishedAt: string
  onPublishedAtChange: (v: string) => void
  tags: string[]
  onTagsChange: (t: string[]) => void
  published: boolean
  onUnpublish: () => void
  images: InlineImage[]
  content: string
  deletingPath: string | null
  onDeleteImage: (path: string) => void
}) {
  const [tagInput, setTagInput] = useState('')

  function addTag(raw = tagInput) {
    const next = raw.split(',').map((t) => t.trim()).filter(Boolean).filter((t) => !tags.includes(t))
    if (next.length) onTagsChange([...tags, ...next])
    setTagInput('')
  }

  return (
    <div className="space-y-6 text-sm">
      <section className="space-y-1.5">
        <Label className="flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Link2 size={13} /> URL slug</span>
          {autoSlug ? (
            <span className="text-[11px] font-medium text-muted-foreground">follows title</span>
          ) : (
            <button type="button" onClick={onSlugReset} className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
              <RefreshCw size={10} /> from title
            </button>
          )}
        </Label>
        <Input value={slug} onChange={(e) => onSlugChange(e.target.value)} className="font-mono text-xs h-9" placeholder="post-slug" />
        <p className="truncate font-mono text-[11px] text-muted-foreground">/blog/{slug || '…'}</p>
      </section>

      <section className="space-y-1.5">
        <Label>Publish date</Label>
        <Input type="datetime-local" value={publishedAt} onChange={(e) => onPublishedAtChange(e.target.value)} className="font-mono text-xs h-9" />
      </section>

      <section className="space-y-1.5">
        <Label>Tags</Label>
        <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-xl border-2 border-border bg-card px-2 py-1.5 focus-within:shadow-brutal-sm">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-md border-2 border-border bg-secondary px-1.5 py-0.5 text-xs font-semibold">
              {tag}
              <button type="button" title={`Remove ${tag}`} onClick={() => onTagsChange(tags.filter((t) => t !== tag))} className="hover:text-destructive">
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => (e.target.value.endsWith(',') ? addTag(e.target.value) : setTagInput(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addTag() }
              if (e.key === 'Backspace' && !tagInput && tags.length) onTagsChange(tags.slice(0, -1))
            }}
            onBlur={() => addTag()}
            placeholder={tags.length ? '' : 'Add tags…'}
            className="min-w-16 flex-1 bg-transparent text-xs outline-none"
          />
        </div>
      </section>

      {published && (
        <section className="rounded-xl border-2 border-border bg-card p-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            This post is live. Edits are kept as a local draft until you press <strong>Update</strong>.
          </p>
          <button type="button" onClick={onUnpublish} className="text-xs font-semibold text-destructive hover:underline">
            Unpublish (revert to draft)
          </button>
        </section>
      )}

      {images.length > 0 && (
        <section className="space-y-2">
          <Label>Uploaded images <span className="text-muted-foreground font-normal">({images.length})</span></Label>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => {
              const inUse = content.includes(img.url)
              return (
                <div key={img.path} className="group relative overflow-hidden rounded-lg border-2 border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-16 w-full object-cover" />
                  {inUse ? (
                    <span className="absolute bottom-0.5 left-0.5 rounded bg-card px-1 text-[9px] font-bold">in post</span>
                  ) : (
                    <button
                      type="button"
                      title="Delete from storage"
                      disabled={deletingPath === img.path}
                      onClick={() => onDeleteImage(img.path)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      {deletingPath === img.path
                        ? <Loader2 size={16} className="animate-spin text-white" />
                        : <Trash2 size={16} className="text-white" />}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">Images no longer in the post can be deleted.</p>
        </section>
      )}

      <section className="space-y-2">
        <Label className="flex items-center gap-1.5"><Keyboard size={13} /> Shortcuts</Label>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex justify-between"><span>Insert a block</span><Kbd>/</Kbd></li>
          <li className="flex justify-between"><span>Save now</span><Kbd>⌘ S</Kbd></li>
          <li className="flex justify-between"><span>Link</span><Kbd>⌘ K</Kbd></li>
          <li className="flex justify-between"><span>Heading</span><Kbd>## space</Kbd></li>
          <li className="flex justify-between"><span>List</span><Kbd>- space</Kbd></li>
          <li className="flex justify-between"><span>Checklist</span><Kbd>[ ] space</Kbd></li>
          <li className="flex justify-between"><span>Quote</span><Kbd>&gt; space</Kbd></li>
          <li className="flex justify-between"><span>Code block</span><Kbd>```</Kbd></li>
          <li className="flex justify-between"><span>Divider</span><Kbd>---</Kbd></li>
          <li className="flex justify-between"><span>Highlight</span><Kbd>==text==</Kbd></li>
        </ul>
      </section>
    </div>
  )
}
