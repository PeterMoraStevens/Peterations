'use client'

import { useState, useRef } from 'react'
import { Reorder } from 'framer-motion'
import NextImage from 'next/image'
import { Upload, Trash2, GripVertical, Loader2, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addPhotoAction, reorderPhotosAction, deletePhotoAction, updatePhotoMetaAction } from '@/app/actions/photos'
import type { Photo } from '@/types'

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

async function extractExif(file: File): Promise<{ camera?: string; lens?: string }> {
  try {
    const exifr = (await import('exifr')).default
    const data = await exifr.parse(file, ['Make', 'Model', 'LensModel', 'LensMake'])
    if (!data) return {}
    const make = data.Make?.trim() ?? ''
    const model = data.Model?.trim() ?? ''
    const camera = [make, model].filter(Boolean).join(' ') || undefined
    const lens = data.LensModel?.trim() || data.LensMake?.trim() || undefined
    return { camera, lens }
  } catch {
    return {}
  }
}

// ── Inline metadata editor ────────────────────────────────────────────────────

function MetaEditor({ photo, onSave }: {
  photo: Photo
  onSave: (updated: Photo) => void
}) {
  const [title, setTitle] = useState(photo.title ?? '')
  const [description, setDescription] = useState(photo.description ?? '')
  const [camera, setCamera] = useState(photo.camera ?? '')
  const [lens, setLens] = useState(photo.lens ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const updated = await updatePhotoMetaAction(photo.id, {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      camera: camera.trim() || undefined,
      lens: lens.trim() || undefined,
    })
    onSave(updated)
    setSaving(false)
  }

  return (
    <div className="border-t-2 border-border bg-muted/30 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Name</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Photo name…" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What's in this photo…"
            className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Camera</Label>
          <Input value={camera} onChange={(e) => setCamera(e.target.value)} placeholder="e.g. Sony A7C II" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Lens</Label>
          <Input value={lens} onChange={(e) => setLens(e.target.value)} placeholder="e.g. 35mm f/1.8" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

// ── Photo row ─────────────────────────────────────────────────────────────────

function PhotoRow({ photo, onDelete, onUpdate }: {
  photo: Photo
  onDelete: (id: string) => void
  onUpdate: (updated: Photo) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deletingId, setDeletingId] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this photo? It will be permanently removed from storage.')) return
    setDeletingId(true)
    await deletePhotoAction(photo.id)
    onDelete(photo.id)
  }

  return (
    <div className="bg-card border-2 border-border shadow-brutal rounded-xl overflow-hidden select-none">
      <div className="flex items-center gap-3 p-3">
        <GripVertical size={18} className="text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
        <NextImage
          src={photo.url}
          alt={photo.title ?? ''}
          width={64}
          height={64}
          className="w-16 h-16 object-cover rounded-lg border-2 border-border shrink-0"
          draggable={false}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{photo.title || <span className="text-muted-foreground italic">Untitled</span>}</p>
          {photo.camera && <p className="text-xs text-muted-foreground truncate">{photo.camera}{photo.lens ? ` · ${photo.lens}` : ''}</p>}
          {photo.description && <p className="text-xs text-muted-foreground truncate">{photo.description}</p>}
          <p className="text-xs text-muted-foreground font-mono">{photo.width}×{photo.height}</p>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="p-1.5 rounded-lg border-2 border-border hover:bg-muted transition-colors shrink-0"
          title="Edit metadata"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <Button
          variant="destructive"
          size="icon"
          onClick={handleDelete}
          disabled={deletingId}
          className="shrink-0"
        >
          {deletingId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </Button>
      </div>
      {expanded && (
        <MetaEditor photo={photo} onSave={(updated) => { onUpdate(updated); setExpanded(false) }} />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PhotoManager({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [reordering, setReordering] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(files: FileList) {
    setUploading(true)
    try {
      const fileArr = Array.from(files)
      for (let i = 0; i < fileArr.length; i++) {
        const file = fileArr[i]
        setUploadProgress(`${i + 1} / ${fileArr.length}`)
        const [dims, exif] = await Promise.all([getImageDimensions(file), extractExif(file)])
        const form = new FormData()
        form.append('file', file)
        form.append('folder', 'photography')
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        if (!res.ok) throw new Error('Upload failed')
        const { url, storagePath } = await res.json()
        const photo = await addPhotoAction({
          storagePath, url,
          width: dims.width, height: dims.height,
          camera: exif.camera,
          lens: exif.lens,
        })
        setPhotos((prev) => [...prev, photo])
      }
    } catch (err) {
      console.error('[PhotoManager] upload error', err)
    } finally {
      setUploading(false)
      setUploadProgress('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleReorderEnd(newOrder: Photo[]) {
    setReordering(true)
    try {
      await reorderPhotosAction(newOrder.map((p) => p.id))
    } finally {
      setReordering(false)
    }
  }

  return (
    <div>
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-10 bg-card text-center mb-6 cursor-pointer transition-colors ${
          dragOver ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/30'
        }`}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files)
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="animate-spin text-muted-foreground" />
            <p className="font-bold">Uploading {uploadProgress}…</p>
            <p className="text-sm text-muted-foreground">EXIF data extracted automatically</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={36} className="text-muted-foreground" />
            <p className="font-bold">Drop photos here or click to upload</p>
            <p className="text-sm text-muted-foreground">JPG, PNG, WebP · camera & lens read from EXIF</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files) }}
        />
      </div>

      {/* Photo list */}
      {photos.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground font-medium">
          No photos yet — upload some above.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-muted-foreground">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} · drag to reorder · click ↓ to edit
            </p>
            {reordering && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Saving order…
              </span>
            )}
          </div>
          <Reorder.Group
            axis="y"
            values={photos}
            onReorder={(newOrder) => {
              setPhotos(newOrder)
              handleReorderEnd(newOrder)
            }}
            className="flex flex-col gap-3"
          >
            {photos.map((photo) => (
              <Reorder.Item key={photo.id} value={photo} className="list-none">
                <PhotoRow
                  photo={photo}
                  onDelete={(id) => setPhotos((prev) => prev.filter((p) => p.id !== id))}
                  onUpdate={(updated) => setPhotos((prev) => prev.map((p) => p.id === updated.id ? updated : p))}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </>
      )}
    </div>
  )
}
