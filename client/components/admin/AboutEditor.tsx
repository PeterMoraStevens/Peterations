'use client'

import { useState, useRef } from 'react'
import NextImage from 'next/image'
import { Reorder } from 'framer-motion'
import Cropper from 'react-easy-crop'
import {
  Plus, X, Save, Loader2, Trash2, GripVertical, UploadCloud,
  ChevronDown, ChevronUp, User, Crop,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  saveAboutProfileAction,
  deleteAboutPhotoAction,
  saveTimelineEntryAction,
  reorderTimelineAction,
  deleteTimelineEntryAction,
  saveAboutLinkAction,
  deleteAboutLinkAction,
} from '@/app/actions/about'
import type { AboutProfile, AboutLink, TimelineEntry } from '@/types'

// ── Photo crop ────────────────────────────────────────────────────────────────

type CropArea = { x: number; y: number; width: number; height: number }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function getCroppedBlob(imageSrc: string, pixelCrop: CropArea): Promise<Blob> {
  const img = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/jpeg', 0.92)
  )
}

function PhotoCropModal({
  src,
  onApply,
  onClose,
}: {
  src: string
  onApply: (url: string, storagePath: string) => void
  onClose: () => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleApply() {
    if (!croppedAreaPixels) return
    setSaving(true)
    setError('')
    try {
      const blob = await getCroppedBlob(src, croppedAreaPixels)
      const file = new File([blob], 'profile-cropped.jpg', { type: 'image/jpeg' })
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'about')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const { url, storagePath } = await res.json()
      onApply(url, storagePath)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-card border-2 border-border shadow-brutal-xl rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b-2 border-border">
          <h3 className="font-bold text-lg">Crop profile photo</h3>
          <button onClick={onClose} className="p-1 hover:text-destructive transition-colors"><X size={18} /></button>
        </div>
        <div className="relative w-full bg-black" style={{ height: 340 }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, px) => setCroppedAreaPixels(px)}
          />
        </div>
        {error && <p className="px-4 pt-3 text-sm text-destructive font-medium">{error}</p>}
        <div className="p-4 flex items-center gap-4">
          <label className="text-sm font-semibold text-muted-foreground shrink-0">Zoom</label>
          <input
            type="range" min={1} max={3} step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleApply} disabled={saving || !croppedAreaPixels}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Crop size={14} />}
              {saving ? 'Uploading…' : 'Apply crop'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Skill tag manager ─────────────────────────────────────────────────────────

function SkillsEditor({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [input, setInput] = useState('')

  function add() {
    const t = input.trim()
    if (t && !skills.includes(t)) onChange([...skills, t])
    setInput('')
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Add skill + Enter"
        />
        <Button type="button" variant="secondary" size="icon" onClick={add}>
          <Plus size={14} />
        </Button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 bg-secondary border-2 border-border rounded-lg px-2 py-0.5 text-xs font-semibold shadow-brutal-sm"
            >
              {s}
              <button onClick={() => onChange(skills.filter((x) => x !== s))} className="hover:text-destructive transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Bullet list editor ────────────────────────────────────────────────────────

function BulletsEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  const [input, setInput] = useState('')

  function add() {
    const t = input.trim()
    if (t) onChange([...bullets, t])
    setInput('')
  }

  function update(i: number, val: string) {
    const next = [...bullets]
    next[i] = val
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-muted-foreground shrink-0">•</span>
          <Input
            value={b}
            onChange={(e) => update(i, e.target.value)}
            className="flex-1"
          />
          <button
            onClick={() => onChange(bullets.filter((_, j) => j !== i))}
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Add bullet point + Enter"
        />
        <Button type="button" variant="secondary" size="icon" onClick={add}>
          <Plus size={14} />
        </Button>
      </div>
    </div>
  )
}

// ── Timeline entry form ───────────────────────────────────────────────────────

const BLANK_ENTRY: Omit<TimelineEntry, 'id'> = {
  role: '', company: '', startDate: '', endDate: undefined,
  description: '', bullets: [], skills: [], order: 0, current: false,
}

function TimelineEntryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<TimelineEntry>
  onSave: (entry: TimelineEntry) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({ ...BLANK_ENTRY, ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.role || !form.company || !form.startDate) {
      setError('Role, company, and start date are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const saved = await saveTimelineEntryAction({ ...form, id: initial.id })
      onSave(saved)
    } catch {
      setError('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-card border-2 border-border shadow-brutal rounded-2xl p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Role *</Label>
          <Input value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="Software Engineer" />
        </div>
        <div className="space-y-1.5">
          <Label>Company *</Label>
          <Input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Acme Corp" />
        </div>
        <div className="space-y-1.5">
          <Label>Start date *</Label>
          <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>End date</Label>
          <Input
            type="date"
            value={form.endDate ?? ''}
            onChange={(e) => set('endDate', e.target.value || undefined)}
            disabled={form.current}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={form.current}
          onChange={(e) => { set('current', e.target.checked); if (e.target.checked) set('endDate', undefined) }}
          className="w-4 h-4 border-2 border-border rounded"
        />
        <span className="text-sm font-semibold">Current position</span>
      </label>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Brief summary of the role…"
          rows={2}
          className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Bullet points</Label>
        <BulletsEditor bullets={form.bullets} onChange={(b) => set('bullets', b)} />
      </div>

      <div className="space-y-1.5">
        <Label>Skills / technologies</Label>
        <SkillsEditor skills={form.skills} onChange={(s) => set('skills', s)} />
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save entry'}
        </Button>
      </div>
    </div>
  )
}

// ── Timeline entry card ───────────────────────────────────────────────────────

function TimelineCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: TimelineEntry
  onEdit: () => void
  onDelete: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${entry.role} at ${entry.company}"? This cannot be undone.`)) return
    setDeleting(true)
    await deleteTimelineEntryAction(entry.id)
    onDelete()
  }

  const period = entry.current
    ? `${entry.startDate} — Present`
    : `${entry.startDate}${entry.endDate ? ` — ${entry.endDate}` : ''}`

  return (
    <div className="flex items-center gap-3 bg-card border-2 border-border shadow-brutal rounded-xl p-4 select-none">
      <GripVertical size={18} className="text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{entry.role}</p>
        <p className="text-xs text-primary font-semibold">{entry.company}</p>
        <p className="text-xs text-muted-foreground">{period}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="destructive" size="icon" onClick={handleDelete} disabled={deleting}>
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </Button>
      </div>
    </div>
  )
}

// ── Links editor ─────────────────────────────────────────────────────────────

function LinksEditor({ initialLinks }: { initialLinks: AboutLink[] }) {
  const [links, setLinks] = useState(initialLinks)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd() {
    if (!label.trim() || !url.trim()) return
    setSaving(true)
    try {
      const saved = await saveAboutLinkAction({ label: label.trim(), url: url.trim(), order: links.length })
      setLinks((l) => [...l, saved])
      setLabel('')
      setUrl('')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await deleteAboutLinkAction(id)
    setLinks((l) => l.filter((x) => x.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. GitHub)" className="w-40 shrink-0" />
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }} />
        <Button type="button" variant="secondary" onClick={handleAdd} disabled={saving || !label.trim() || !url.trim()}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        </Button>
      </div>
      {links.length > 0 && (
        <div className="flex flex-col gap-2">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-2 bg-muted/40 border-2 border-border rounded-xl px-3 py-2">
              <span className="font-semibold text-sm w-32 shrink-0 truncate">{link.label}</span>
              <span className="text-xs text-muted-foreground flex-1 truncate">{link.url}</span>
              <button
                onClick={() => handleDelete(link.id)}
                disabled={deletingId === link.id}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                {deletingId === link.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main editor ───────────────────────────────────────────────────────────────

interface AboutEditorProps {
  initialProfile: AboutProfile
  initialTimeline: TimelineEntry[]
  initialLinks: AboutLink[]
}

export function AboutEditor({ initialProfile, initialTimeline, initialLinks }: AboutEditorProps) {
  // Profile state
  const [profile, setProfile] = useState(initialProfile)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [removingPhoto, setRemovingPhoto] = useState(false)
  const [photoCropSrc, setPhotoCropSrc] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Timeline state
  const [entries, setEntries] = useState(initialTimeline)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [reordering, setReordering] = useState(false)

  function setProfileField<K extends keyof AboutProfile>(k: K, v: AboutProfile[K]) {
    setProfile((p) => ({ ...p, [k]: v }))
  }

  function handlePhotoSelect(files: FileList | null) {
    if (!files?.length) return
    setUploadingPhoto(true)
    const reader = new FileReader()
    reader.onload = (e) => setPhotoCropSrc(e.target?.result as string)
    reader.readAsDataURL(files[0])
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      await saveAboutProfileAction(profile, initialProfile.photoPath)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleReorder(newOrder: TimelineEntry[]) {
    setEntries(newOrder)
    setReordering(true)
    await reorderTimelineAction(newOrder.map((e) => e.id))
    setReordering(false)
  }

  return (
    <div className="space-y-10">

      {/* ── Profile ── */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold">Profile</h2>
          <div className="flex-1 h-0.5 bg-border" />
        </div>

        <div className="bg-card border-2 border-border shadow-brutal rounded-2xl p-6 space-y-5">
          {/* Photo */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 border-2 border-border shadow-brutal rounded-xl overflow-hidden bg-muted shrink-0 flex items-center justify-center">
              {profile.photoUrl ? (
                <NextImage src={profile.photoUrl} alt="Profile" width={80} height={80} className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <Button
                variant="secondary"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                {uploadingPhoto ? 'Uploading…' : 'Upload photo'}
              </Button>
              {profile.photoUrl && (
                <button
                  disabled={removingPhoto}
                  className="block text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  onClick={async () => {
                    setRemovingPhoto(true)
                    if (profile.photoPath) await deleteAboutPhotoAction(profile.photoPath)
                    setProfile((p) => ({ ...p, photoUrl: undefined, photoPath: undefined }))
                    setRemovingPhoto(false)
                  }}
                >
                  {removingPhoto ? 'Removing…' : 'Remove photo'}
                </button>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelect(e.target.files)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Name</Label>
              <Input value={profile.name} onChange={(e) => setProfileField('name', e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Bio</Label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfileField('bio', e.target.value)}
                placeholder="Write a short bio…"
                rows={4}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Skills</Label>
            <SkillsEditor skills={profile.skills} onChange={(s) => setProfileField('skills', s)} />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {profileSaved ? 'Saved!' : savingProfile ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Experience ── */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold">Experience</h2>
          <div className="flex-1 h-0.5 bg-border" />
          <div className="flex items-center gap-2">
            {reordering && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 size={12} className="animate-spin" />Saving order…</span>}
            <Button onClick={() => setEditingId('new')}>
              <Plus size={14} /> Add entry
            </Button>
          </div>
        </div>

        {editingId === 'new' && (
          <div className="mb-4">
            <TimelineEntryForm
              initial={{}}
              onSave={(entry) => { setEntries((e) => [...e, entry]); setEditingId(null) }}
              onCancel={() => setEditingId(null)}
            />
          </div>
        )}

        {entries.length === 0 && editingId !== 'new' ? (
          <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <p className="font-semibold mb-1 text-muted-foreground">No experience entries yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Drag to reorder</p>
            <Reorder.Group
              axis="y"
              values={entries}
              onReorder={handleReorder}
              className="flex flex-col gap-3"
            >
              {entries.map((entry) =>
                editingId === entry.id ? (
                  <div key={entry.id}>
                    <TimelineEntryForm
                      initial={entry}
                      onSave={(updated) => {
                        setEntries((es) => es.map((e) => (e.id === updated.id ? updated : e)))
                        setEditingId(null)
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <Reorder.Item key={entry.id} value={entry} className="list-none">
                    <TimelineCard
                      entry={entry}
                      onEdit={() => setEditingId(entry.id)}
                      onDelete={() => setEntries((es) => es.filter((e) => e.id !== entry.id))}
                    />
                  </Reorder.Item>
                )
              )}
            </Reorder.Group>
          </div>
        )}
      </section>

      {/* ── Links ── */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold">Links</h2>
          <div className="flex-1 h-0.5 bg-border" />
        </div>
        <div className="bg-card border-2 border-border shadow-brutal rounded-2xl p-6">
          <LinksEditor initialLinks={initialLinks} />
        </div>
      </section>

      {photoCropSrc && (
        <PhotoCropModal
          src={photoCropSrc}
          onApply={(url, storagePath) => {
            setProfile((p) => ({ ...p, photoUrl: url, photoPath: storagePath }))
            setPhotoCropSrc(null)
            setUploadingPhoto(false)
          }}
          onClose={() => { setPhotoCropSrc(null); setUploadingPhoto(false) }}
        />
      )}
    </div>
  )
}
