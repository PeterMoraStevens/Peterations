'use client'

import { useState, useRef } from 'react'
import { Reorder } from 'framer-motion'
import { Plus, X, Save, Loader2, Trash2, GripVertical, ChevronDown, ChevronUp, UploadCloud, Music, Film, UtensilsCrossed, Camera, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createGroupAction, updateGroupNameAction, reorderGroupsAction, deleteGroupAction,
  saveMusicEntryAction, deleteMusicEntryAction,
  saveMovieEntryAction, deleteMovieEntryAction,
  saveDishEntryAction, deleteDishEntryAction,
  assignPhotoToGroupAction,
} from '@/app/actions/living'
import { deletePhotoAction } from '@/app/actions/photos'
import type { LivingGroup, LivingContentType, MusicEntry, MovieEntry, DishEntry, Photo } from '@/types'

// ── Shared helpers ─────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10)

function useImageUpload(folder: string) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  async function upload(files: FileList | null): Promise<{ url: string; storagePath: string } | null> {
    if (!files?.length) return null
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', files[0])
      fd.append('folder', folder)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      return await res.json()
    } finally {
      setUploading(false)
      if (ref.current) ref.current.value = ''
    }
  }
  return { uploading, ref, upload }
}

function ImageUploadZone({ imageUrl, onUpload, onClear, uploading }: {
  imageUrl?: string; onUpload: (files: FileList | null) => void; onClear: () => void; uploading: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  return imageUrl ? (
    <div className="relative w-32 border-2 border-border rounded-xl overflow-hidden shadow-brutal-sm">
      <img src={imageUrl} alt="" className="w-full h-20 object-cover" />
      <button type="button" onClick={onClear} className="absolute top-1 right-1 bg-destructive text-white rounded p-0.5"><X size={10} /></button>
    </div>
  ) : (
    <>
      <button type="button" disabled={uploading} onClick={() => ref.current?.click()}
        className="w-full border-2 border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-muted/30 transition-colors disabled:opacity-60 text-xs font-medium text-muted-foreground">
        {uploading ? <><Loader2 size={14} className="animate-spin" />Uploading…</> : <><UploadCloud size={14} />Upload image</>}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files)} />
    </>
  )
}

// ── Group section shell ────────────────────────────────────────────────────────

function GroupShell({
  group, onDelete, onRename, children,
}: {
  group: LivingGroup | null // null = "Ungrouped"
  onDelete?: () => void
  onRename?: (name: string) => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group?.name ?? '')
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleRename() {
    if (!name.trim() || !group || !onRename) return
    setRenaming(true)
    await updateGroupNameAction(group.id, name.trim())
    onRename(name.trim())
    setEditing(false)
    setRenaming(false)
  }

  async function handleDelete() {
    if (!group || !onDelete) return
    if (!confirm(`Delete group "${group.name}"? Items will become ungrouped.`)) return
    setDeleting(true)
    await deleteGroupAction(group.id)
    onDelete()
  }

  return (
    <div className="border-2 border-border rounded-2xl overflow-hidden shadow-brutal">
      <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b-2 border-border">
        {group ? (
          editing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-7 text-sm py-0" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false) }} />
              <Button size="sm" onClick={handleRename} disabled={renaming}>{renaming ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="font-bold text-sm flex-1 text-left hover:underline">{group.name}</button>
          )
        ) : (
          <span className="font-bold text-sm flex-1 text-muted-foreground italic">Ungrouped</span>
        )}
        {group && (
          <Button variant="destructive" size="icon" className="h-6 w-6" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
          </Button>
        )}
        <button onClick={() => setOpen((o) => !o)} className="text-muted-foreground">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {open && <div className="p-4">{children}</div>}
    </div>
  )
}

// ── Music ─────────────────────────────────────────────────────────────────────

function MusicForm({ groupId, initial, onSave, onCancel }: {
  groupId?: string; initial?: MusicEntry; onSave: (e: MusicEntry) => void; onCancel: () => void
}) {
  const [artist, setArtist] = useState(initial?.artist ?? '')
  const [track, setTrack] = useState(initial?.track ?? '')
  const [album, setAlbum] = useState(initial?.album ?? '')
  const [date, setDate] = useState(initial?.listenedAt ?? today)
  const [spotify, setSpotify] = useState(initial?.spotifyUrl ?? '')
  const [artUrl, setArtUrl] = useState(initial?.artUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!artist || !track) { setError('Artist and track are required.'); return }
    setSaving(true)
    try {
      const saved = await saveMusicEntryAction({ id: initial?.id, groupId, artist, track, album, listenedAt: date, spotifyUrl: spotify || undefined, artUrl: artUrl || undefined })
      onSave(saved)
    } catch { setError('Failed to save.'); setSaving(false) }
  }

  return (
    <div className="bg-card border-2 border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Artist *</Label><Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist" /></div>
        <div className="space-y-1"><Label className="text-xs">Track *</Label><Input value={track} onChange={(e) => setTrack(e.target.value)} placeholder="Track name" /></div>
        <div className="space-y-1"><Label className="text-xs">Album</Label><Input value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Album" /></div>
        <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">Spotify URL</Label><Input value={spotify} onChange={(e) => setSpotify(e.target.value)} placeholder="https://open.spotify.com/..." /></div>
        <div className="space-y-1"><Label className="text-xs">Album art URL</Label><Input value={artUrl} onChange={(e) => setArtUrl(e.target.value)} placeholder="https://..." /></div>
      </div>
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </div>
  )
}

function MusicRow({ entry, onEdit, onDelete }: { entry: MusicEntry; onEdit: () => void; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)
  async function handleDelete() {
    setDeleting(true)
    await deleteMusicEntryAction(entry.id)
    onDelete()
  }
  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 select-none">
      <GripVertical size={14} className="text-muted-foreground shrink-0 cursor-grab" />
      {entry.artUrl && <img src={entry.artUrl} alt="" className="w-8 h-8 object-cover rounded border border-border shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs truncate">{entry.track}</p>
        <p className="text-xs text-muted-foreground truncate">{entry.artist} · {entry.album}</p>
      </div>
      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onEdit}>Edit</Button>
      <Button variant="destructive" size="icon" className="h-6 w-6" onClick={handleDelete} disabled={deleting}>
        {deleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
      </Button>
    </div>
  )
}

function MusicGroup({ group, entries, onGroupDelete, onGroupRename }: {
  group: LivingGroup | null; entries: MusicEntry[]; onGroupDelete?: () => void; onGroupRename?: (n: string) => void
}) {
  const [items, setItems] = useState(entries)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <GroupShell group={group} onDelete={onGroupDelete} onRename={onGroupRename}>
      <div className="space-y-2">
        <Reorder.Group axis="y" values={items} onReorder={(next) => { setItems(next) }} className="flex flex-col gap-1.5">
          {items.map((entry) => editingId === entry.id ? (
            <div key={entry.id}><MusicForm groupId={group?.id} initial={entry}
              onSave={(u) => { setItems((is) => is.map((i) => i.id === u.id ? u : i)); setEditingId(null) }}
              onCancel={() => setEditingId(null)} /></div>
          ) : (
            <Reorder.Item key={entry.id} value={entry} className="list-none">
              <MusicRow entry={entry} onEdit={() => setEditingId(entry.id)} onDelete={() => setItems((is) => is.filter((i) => i.id !== entry.id))} />
            </Reorder.Item>
          ))}
        </Reorder.Group>
        {adding ? (
          <MusicForm groupId={group?.id}
            onSave={(e) => { setItems((is) => [...is, e]); setAdding(false) }}
            onCancel={() => setAdding(false)} />
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="w-full"><Plus size={12} />Add song</Button>
        )}
      </div>
    </GroupShell>
  )
}

// ── Movies ────────────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} className="text-yellow-400">
          <Star size={18} className={s <= value ? 'fill-yellow-400' : 'fill-transparent'} />
        </button>
      ))}
      <span className="text-xs font-semibold ml-1 self-center">{value}/5</span>
    </div>
  )
}

function MovieForm({ groupId, initial, onSave, onCancel }: {
  groupId?: string; initial?: MovieEntry; onSave: (e: MovieEntry) => void; onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [date, setDate] = useState(initial?.watchedAt ?? today)
  const [year, setYear] = useState(initial?.year?.toString() ?? '')
  const [review, setReview] = useState(initial?.review ?? '')
  const [letterboxd, setLetterboxd] = useState(initial?.letterboxdUrl ?? '')
  const [posterUrl, setPosterUrl] = useState(initial?.posterUrl ?? '')
  const [posterPath, setPosterPath] = useState(initial?.posterPath ?? '')
  const { uploading, ref, upload } = useImageUpload('movies')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!title) { setError('Title is required.'); return }
    setSaving(true)
    try {
      const saved = await saveMovieEntryAction({ id: initial?.id, groupId, title, rating, watchedAt: date, year: year ? parseInt(year) : undefined, review: review || undefined, letterboxdUrl: letterboxd || undefined, posterUrl: posterUrl || undefined, posterPath: posterPath || undefined })
      onSave(saved)
    } catch { setError('Failed to save.'); setSaving(false) }
  }

  return (
    <div className="bg-card border-2 border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2"><Label className="text-xs">Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Movie title" /></div>
        <div className="space-y-1"><Label className="text-xs">Rating</Label><StarPicker value={rating} onChange={setRating} /></div>
        <div className="space-y-1"><Label className="text-xs">Watched</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">Year</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" /></div>
        <div className="space-y-1"><Label className="text-xs">Letterboxd URL</Label><Input value={letterboxd} onChange={(e) => setLetterboxd(e.target.value)} placeholder="https://..." /></div>
        <div className="space-y-1 col-span-2"><Label className="text-xs">Review</Label><textarea value={review} onChange={(e) => setReview(e.target.value)} rows={2} placeholder="Short review…" className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" /></div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Poster</Label>
          <ImageUploadZone imageUrl={posterUrl} uploading={uploading}
            onUpload={async (files) => { const r = await upload(files); if (r) { setPosterUrl(r.url); setPosterPath(r.storagePath) } }}
            onClear={() => { setPosterUrl(''); setPosterPath('') }} />
        </div>
      </div>
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </div>
  )
}

function MovieRow({ entry, onEdit, onDelete }: { entry: MovieEntry; onEdit: () => void; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)
  async function handleDelete() {
    setDeleting(true)
    await deleteMovieEntryAction(entry.id, entry.posterPath)
    onDelete()
  }
  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 select-none">
      <GripVertical size={14} className="text-muted-foreground shrink-0 cursor-grab" />
      {entry.posterUrl && <img src={entry.posterUrl} alt="" className="w-7 h-10 object-cover rounded border border-border shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs truncate">{entry.title}{entry.year ? ` (${entry.year})` : ''}</p>
        <p className="text-xs text-muted-foreground">{entry.rating}/5 · {entry.watchedAt}</p>
      </div>
      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onEdit}>Edit</Button>
      <Button variant="destructive" size="icon" className="h-6 w-6" onClick={handleDelete} disabled={deleting}>
        {deleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
      </Button>
    </div>
  )
}

function MovieGroup({ group, entries, onGroupDelete, onGroupRename }: {
  group: LivingGroup | null; entries: MovieEntry[]; onGroupDelete?: () => void; onGroupRename?: (n: string) => void
}) {
  const [items, setItems] = useState(entries)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  return (
    <GroupShell group={group} onDelete={onGroupDelete} onRename={onGroupRename}>
      <div className="space-y-2">
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="flex flex-col gap-1.5">
          {items.map((entry) => editingId === entry.id ? (
            <div key={entry.id}><MovieForm groupId={group?.id} initial={entry}
              onSave={(u) => { setItems((is) => is.map((i) => i.id === u.id ? u : i)); setEditingId(null) }}
              onCancel={() => setEditingId(null)} /></div>
          ) : (
            <Reorder.Item key={entry.id} value={entry} className="list-none">
              <MovieRow entry={entry} onEdit={() => setEditingId(entry.id)} onDelete={() => setItems((is) => is.filter((i) => i.id !== entry.id))} />
            </Reorder.Item>
          ))}
        </Reorder.Group>
        {adding ? (
          <MovieForm groupId={group?.id} onSave={(e) => { setItems((is) => [...is, e]); setAdding(false) }} onCancel={() => setAdding(false)} />
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="w-full"><Plus size={12} />Add movie</Button>
        )}
      </div>
    </GroupShell>
  )
}

// ── Dishes ────────────────────────────────────────────────────────────────────

function DishForm({ groupId, initial, onSave, onCancel }: {
  groupId?: string; initial?: DishEntry; onSave: (e: DishEntry) => void; onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial?.cookedAt ?? today)
  const [cuisine, setCuisine] = useState(initial?.cuisine ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [imagePath, setImagePath] = useState(initial?.imagePath ?? '')
  const { uploading, ref, upload } = useImageUpload('dishes')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!name) { setError('Name is required.'); return }
    setSaving(true)
    try {
      const saved = await saveDishEntryAction({ id: initial?.id, groupId, name, cookedAt: date, cuisine: cuisine || undefined, notes: notes || undefined, imageUrl: imageUrl || undefined, imagePath: imagePath || undefined })
      onSave(saved)
    } catch { setError('Failed to save.'); setSaving(false) }
  }

  return (
    <div className="bg-card border-2 border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2"><Label className="text-xs">Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dish name" /></div>
        <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">Cuisine</Label><Input value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="French, Italian…" /></div>
        <div className="space-y-1 col-span-2"><Label className="text-xs">Notes</Label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes…" className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" /></div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Photo</Label>
          <ImageUploadZone imageUrl={imageUrl} uploading={uploading}
            onUpload={async (files) => { const r = await upload(files); if (r) { setImageUrl(r.url); setImagePath(r.storagePath) } }}
            onClear={() => { setImageUrl(''); setImagePath('') }} />
        </div>
      </div>
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </div>
  )
}

function DishRow({ entry, onEdit, onDelete }: { entry: DishEntry; onEdit: () => void; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)
  async function handleDelete() {
    setDeleting(true)
    await deleteDishEntryAction(entry.id, entry.imagePath)
    onDelete()
  }
  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 select-none">
      <GripVertical size={14} className="text-muted-foreground shrink-0 cursor-grab" />
      {entry.imageUrl && <img src={entry.imageUrl} alt="" className="w-10 h-10 object-cover rounded border border-border shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs truncate">{entry.name}</p>
        <p className="text-xs text-muted-foreground">{entry.cuisine ? `${entry.cuisine} · ` : ''}{entry.cookedAt}</p>
      </div>
      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onEdit}>Edit</Button>
      <Button variant="destructive" size="icon" className="h-6 w-6" onClick={handleDelete} disabled={deleting}>
        {deleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
      </Button>
    </div>
  )
}

function DishGroup({ group, entries, onGroupDelete, onGroupRename }: {
  group: LivingGroup | null; entries: DishEntry[]; onGroupDelete?: () => void; onGroupRename?: (n: string) => void
}) {
  const [items, setItems] = useState(entries)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  return (
    <GroupShell group={group} onDelete={onGroupDelete} onRename={onGroupRename}>
      <div className="space-y-2">
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="flex flex-col gap-1.5">
          {items.map((entry) => editingId === entry.id ? (
            <div key={entry.id}><DishForm groupId={group?.id} initial={entry}
              onSave={(u) => { setItems((is) => is.map((i) => i.id === u.id ? u : i)); setEditingId(null) }}
              onCancel={() => setEditingId(null)} /></div>
          ) : (
            <Reorder.Item key={entry.id} value={entry} className="list-none">
              <DishRow entry={entry} onEdit={() => setEditingId(entry.id)} onDelete={() => setItems((is) => is.filter((i) => i.id !== entry.id))} />
            </Reorder.Item>
          ))}
        </Reorder.Group>
        {adding ? (
          <DishForm groupId={group?.id} onSave={(e) => { setItems((is) => [...is, e]); setAdding(false) }} onCancel={() => setAdding(false)} />
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="w-full"><Plus size={12} />Add dish</Button>
        )}
      </div>
    </GroupShell>
  )
}

// ── Alert dialog ──────────────────────────────────────────────────────────────

function AlertDialog({ open, title, description, onConfirm, onCancel, loading }: {
  open: boolean; title: string; description: string
  onConfirm: () => void; onCancel: () => void; loading?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="bg-card border-2 border-border shadow-brutal-xl rounded-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-2">
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2 justify-end px-6 pb-6">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {loading ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Photography ───────────────────────────────────────────────────────────────

function PhotoGroup({ group, allPhotos, onGroupDelete, onGroupRename, onAssigned, onDeleted }: {
  group: LivingGroup | null
  allPhotos: Photo[]
  onGroupDelete?: () => void
  onGroupRename?: (n: string) => void
  onAssigned?: (photoId: string, groupId: string | undefined) => void
  onDeleted?: (photoId: string) => void
}) {
  const [assigning, setAssigning] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Photo | null>(null)
  const [deleting, setDeleting] = useState(false)

  const displayPhotos = group
    ? allPhotos.filter((p) => p.groupId === group.id)
    : allPhotos.filter((p) => !p.groupId)

  const ungroupedPool = group ? allPhotos.filter((p) => !p.groupId) : []

  async function handleAssign(photoId: string) {
    setAssigning(photoId)
    await assignPhotoToGroupAction(photoId, group?.id ?? null)
    onAssigned?.(photoId, group?.id)
    setAssigning(null)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    await deletePhotoAction(pendingDelete.id)
    onDeleted?.(pendingDelete.id)
    setPendingDelete(null)
    setDeleting(false)
  }

  return (
    <>
      <GroupShell group={group} onDelete={onGroupDelete} onRename={onGroupRename}>
        <div className="space-y-3">
          {displayPhotos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {displayPhotos.map((photo) => (
                <div key={photo.id} className="relative group border-2 border-border rounded-xl overflow-hidden shadow-brutal-sm">
                  <img src={photo.url} alt={photo.title ?? ''} className="w-full h-20 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPendingDelete(photo)}
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} className="text-white" />
                    <span className="text-white text-[10px] font-semibold">Delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          {group && ungroupedPool.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Add from ungrouped:</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {ungroupedPool.map((photo) => (
                  <button key={photo.id} type="button" disabled={assigning === photo.id}
                    onClick={() => handleAssign(photo.id)}
                    className="relative border-2 border-dashed border-border rounded-lg overflow-hidden hover:border-foreground transition-colors">
                    <img src={photo.url} alt="" className="w-full h-14 object-cover" />
                    {assigning === photo.id && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={12} className="animate-spin text-white" /></div>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!group && displayPhotos.length > 0 && (
            <p className="text-xs text-muted-foreground">Hover a photo and click delete to permanently remove it from storage.</p>
          )}
          {displayPhotos.length === 0 && (!group || ungroupedPool.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-4">No photos yet. Upload photos in the Photography admin then assign them here.</p>
          )}
        </div>
      </GroupShell>

      <AlertDialog
        open={!!pendingDelete}
        title="Delete photo?"
        description="This will permanently remove the photo from storage. This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </>
  )
}

// ── Content type tab ──────────────────────────────────────────────────────────

type TabData = {
  music: { groups: LivingGroup[]; entries: MusicEntry[] }
  movies: { groups: LivingGroup[]; entries: MovieEntry[] }
  dishes: { groups: LivingGroup[]; entries: DishEntry[] }
  photography: { groups: LivingGroup[]; photos: Photo[] }
}

function ContentTab({ type, data }: { type: LivingContentType; data: TabData }) {
  const [groups, setGroups] = useState<LivingGroup[]>(
    type === 'music' ? data.music.groups : type === 'movies' ? data.movies.groups : type === 'dishes' ? data.dishes.groups : data.photography.groups
  )
  const [newGroupName, setNewGroupName] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)
  const [allPhotos, setAllPhotos] = useState<Photo[]>(
    type === 'photography' ? data.photography.photos : []
  )

  const entries =
    type === 'music' ? data.music.entries :
    type === 'movies' ? data.movies.entries :
    type === 'dishes' ? data.dishes.entries : []

  async function handleAddGroup() {
    const name = newGroupName.trim()
    if (!name) return
    setAddingGroup(true)
    const group = await createGroupAction(type, name)
    setGroups((gs) => [...gs, group])
    setNewGroupName('')
    setAddingGroup(false)
  }

  function getGroupEntries<T extends { groupId?: string }>(items: T[], groupId?: string): T[] {
    return groupId ? items.filter((e) => e.groupId === groupId) : items.filter((e) => !e.groupId)
  }

  function handlePhotoAssigned(photoId: string, groupId: string | undefined) {
    setAllPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, groupId } : p))
  }

  function handlePhotoDeleted(photoId: string) {
    setAllPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  const ungroupedEntries = getGroupEntries(entries as { groupId?: string }[], undefined)
  const ungroupedPhotos = allPhotos.filter((p) => !p.groupId)
  const hasUngrouped = type === 'photography' ? ungroupedPhotos.length > 0 : ungroupedEntries.length > 0

  return (
    <div className="space-y-4">
      {/* Add group */}
      <div className="flex gap-2">
        <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddGroup() } }}
          placeholder="New group name (e.g. Nature, French)…" />
        <Button onClick={handleAddGroup} disabled={addingGroup || !newGroupName.trim()} variant="secondary">
          {addingGroup ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add group
        </Button>
      </div>

      {/* Groups */}
      {groups.map((group) => {
        const groupEntries = getGroupEntries(entries as { groupId?: string }[], group.id)
        return type === 'music' ? (
          <MusicGroup key={group.id} group={group} entries={groupEntries as MusicEntry[]}
            onGroupDelete={() => setGroups((gs) => gs.filter((g) => g.id !== group.id))}
            onGroupRename={(n) => setGroups((gs) => gs.map((g) => g.id === group.id ? { ...g, name: n } : g))} />
        ) : type === 'movies' ? (
          <MovieGroup key={group.id} group={group} entries={groupEntries as MovieEntry[]}
            onGroupDelete={() => setGroups((gs) => gs.filter((g) => g.id !== group.id))}
            onGroupRename={(n) => setGroups((gs) => gs.map((g) => g.id === group.id ? { ...g, name: n } : g))} />
        ) : type === 'dishes' ? (
          <DishGroup key={group.id} group={group} entries={groupEntries as DishEntry[]}
            onGroupDelete={() => setGroups((gs) => gs.filter((g) => g.id !== group.id))}
            onGroupRename={(n) => setGroups((gs) => gs.map((g) => g.id === group.id ? { ...g, name: n } : g))} />
        ) : (
          <PhotoGroup key={group.id} group={group} allPhotos={allPhotos}
            onGroupDelete={() => setGroups((gs) => gs.filter((g) => g.id !== group.id))}
            onGroupRename={(n) => setGroups((gs) => gs.map((g) => g.id === group.id ? { ...g, name: n } : g))}
            onAssigned={handlePhotoAssigned}
            onDeleted={handlePhotoDeleted} />
        )
      })}

      {/* Ungrouped */}
      {(hasUngrouped || groups.length === 0) && (
        type === 'music' ? <MusicGroup group={null} entries={ungroupedEntries as MusicEntry[]} /> :
        type === 'movies' ? <MovieGroup group={null} entries={ungroupedEntries as MovieEntry[]} /> :
        type === 'dishes' ? <DishGroup group={null} entries={ungroupedEntries as DishEntry[]} /> :
        <PhotoGroup group={null} allPhotos={allPhotos}
          onAssigned={handlePhotoAssigned}
          onDeleted={handlePhotoDeleted} />
      )}
    </div>
  )
}

// ── Main editor ───────────────────────────────────────────────────────────────

const TABS: { type: LivingContentType; label: string; icon: React.ElementType }[] = [
  { type: 'music', label: 'Music', icon: Music },
  { type: 'movies', label: 'Movies', icon: Film },
  { type: 'dishes', label: 'Dishes', icon: UtensilsCrossed },
  { type: 'photography', label: 'Photography', icon: Camera },
]

export function LivingEditor({ initialData }: { initialData: TabData }) {
  const [activeTab, setActiveTab] = useState<LivingContentType>('music')

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-2 border-border rounded-xl p-1 bg-muted/30 w-fit">
        {TABS.map(({ type, label, icon: Icon }) => (
          <button key={type} onClick={() => setActiveTab(type)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === type ? 'bg-card border-2 border-border shadow-brutal-sm' : 'hover:bg-card/50'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      <ContentTab type={activeTab} data={initialData} />
    </div>
  )
}
