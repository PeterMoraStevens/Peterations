'use client'

import React, { useRef, useState } from 'react'
import { ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CoverImage({
  url, uploading, onFile, onRemove,
}: {
  url?: string
  uploading: boolean
  onFile: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const dropProps = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragging(true) },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'))
      if (file) onFile(file)
    },
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0]
        if (f) onFile(f)
        e.target.value = ''
      }}
    />
  )

  if (!url) {
    return (
      <button
        type="button"
        {...dropProps}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/40 px-4 py-5 text-sm font-semibold text-muted-foreground transition-colors',
          'hover:border-border hover:bg-card hover:text-foreground',
          dragging && 'border-border bg-primary/40 text-foreground',
        )}
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        {uploading ? 'Uploading cover…' : dragging ? 'Drop to set cover' : 'Add a cover image'}
        <span className="hidden sm:inline font-normal opacity-70">— optional, click or drop a file</span>
        {input}
      </button>
    )
  }

  return (
    <div
      {...dropProps}
      className={cn(
        'group relative overflow-hidden rounded-2xl border-2 border-border bg-muted shadow-brutal',
        dragging && 'ring-4 ring-primary',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Cover" className={cn('block aspect-[2/1] w-full object-cover', uploading && 'opacity-50')} />
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin" />
        </div>
      )}
      <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border-2 border-border bg-card px-2.5 py-1 text-xs font-semibold shadow-brutal-sm hover:bg-muted"
        >
          <RefreshCw size={12} /> Change
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1.5 rounded-lg border-2 border-border bg-card px-2.5 py-1 text-xs font-semibold shadow-brutal-sm hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 size={12} /> Remove
        </button>
      </div>
      {input}
    </div>
  )
}
