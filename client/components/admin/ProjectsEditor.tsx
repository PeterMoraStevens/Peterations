'use client'

import { useState, useRef } from 'react'
import { Reorder } from 'framer-motion'
import { Plus, X, Save, Loader2, Trash2, GripVertical, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveProjectAction, reorderProjectsAction, deleteProjectAction } from '@/app/actions/projects'
import type { Project } from '@/types'

const BLANK: Omit<Project, 'id'> = {
  title: '', description: '', url: '', repoUrl: '', tags: [], featured: false, order: 0,
}

function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('')
  function add() {
    const t = input.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Add tag + Enter" />
        <Button type="button" variant="secondary" size="icon" onClick={add}><Plus size={14} /></Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 bg-secondary border-2 border-border rounded-lg px-2 py-0.5 text-xs font-semibold shadow-brutal-sm">
              {t}
              <button onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-destructive transition-colors"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<Project>
  onSave: (p: Project) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({ ...BLANK, ...initial })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const imgRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', files[0])
      fd.append('folder', 'projects')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const { url, storagePath } = await res.json()
      set('imageUrl', url)
      set('imagePath', storagePath)
    } finally {
      setUploading(false)
      if (imgRef.current) imgRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!form.title) { setError('Title is required.'); return }
    setSaving(true)
    setError('')
    try {
      const saved = await saveProjectAction({ ...form, id: initial.id })
      onSave(saved)
    } catch {
      setError('Failed to save.')
      setSaving(false)
    }
  }

  return (
    <div className="bg-card border-2 border-border shadow-brutal rounded-2xl p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <Label>Title *</Label>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="My Project" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What does this project do?"
            rows={3}
            className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Live URL</Label>
          <Input value={form.url ?? ''} onChange={(e) => set('url', e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-1.5">
          <Label>Repo URL</Label>
          <Input value={form.repoUrl ?? ''} onChange={(e) => set('repoUrl', e.target.value)} placeholder="https://github.com/..." />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Tags</Label>
        <TagsEditor tags={form.tags} onChange={(t) => set('tags', t)} />
      </div>

      <div className="space-y-1.5">
        <Label>Image (optional)</Label>
        {form.imageUrl ? (
          <div className="relative w-48 border-2 border-border rounded-xl overflow-hidden shadow-brutal-sm">
            <img src={form.imageUrl} alt="" className="w-full h-28 object-cover" />
            <button
              type="button"
              onClick={() => { set('imageUrl', undefined); set('imagePath', undefined) }}
              className="absolute top-1 right-1 bg-destructive text-white rounded-lg p-1 shadow"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={() => imgRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 hover:bg-muted/30 transition-colors disabled:opacity-60"
          >
            {uploading
              ? <><Loader2 size={20} className="animate-spin text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Uploading…</span></>
              : <><UploadCloud size={20} className="text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Upload image</span></>
            }
          </button>
        )}
        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
        <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="w-4 h-4 border-2 border-border rounded" />
        <span className="text-sm font-semibold">Featured project</span>
      </label>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save project'}
        </Button>
      </div>
    </div>
  )
}

function ProjectRow({ project, onEdit, onDelete }: { project: Project; onEdit: () => void; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return
    setDeleting(true)
    await deleteProjectAction(project.id)
    onDelete()
  }

  return (
    <div className="flex items-center gap-3 bg-card border-2 border-border shadow-brutal rounded-xl p-4 select-none">
      <GripVertical size={18} className="text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{project.title}</p>
        {project.url && <p className="text-xs text-muted-foreground truncate">{project.url}</p>}
      </div>
      {project.featured && <span className="text-[10px] font-bold px-2 py-0.5 bg-primary border border-border rounded-md shrink-0">Featured</span>}
      <div className="flex gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="destructive" size="icon" onClick={handleDelete} disabled={deleting}>
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </Button>
      </div>
    </div>
  )
}

export function ProjectsEditor({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [reordering, setReordering] = useState(false)

  async function handleReorder(newOrder: Project[]) {
    setProjects(newOrder)
    setReordering(true)
    await reorderProjectsAction(newOrder.map((p) => p.id))
    setReordering(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {reordering && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 size={12} className="animate-spin" />Saving order…</span>}
        <div className="ml-auto">
          <Button onClick={() => setEditingId('new')}><Plus size={14} /> Add project</Button>
        </div>
      </div>

      {editingId === 'new' && (
        <ProjectForm
          initial={{}}
          onSave={(p) => { setProjects((ps) => [...ps, p]); setEditingId(null) }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {projects.length === 0 && editingId !== 'new' ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <p className="font-semibold text-muted-foreground">No projects yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.length > 1 && <p className="text-xs text-muted-foreground font-medium">Drag to reorder</p>}
          <Reorder.Group axis="y" values={projects} onReorder={handleReorder} className="flex flex-col gap-3">
            {projects.map((project) =>
              editingId === project.id ? (
                <div key={project.id}>
                  <ProjectForm
                    initial={project}
                    onSave={(updated) => { setProjects((ps) => ps.map((p) => p.id === updated.id ? updated : p)); setEditingId(null) }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <Reorder.Item key={project.id} value={project} className="list-none">
                  <ProjectRow
                    project={project}
                    onEdit={() => setEditingId(project.id)}
                    onDelete={() => setProjects((ps) => ps.filter((p) => p.id !== project.id))}
                  />
                </Reorder.Item>
              )
            )}
          </Reorder.Group>
        </div>
      )}
    </div>
  )
}
