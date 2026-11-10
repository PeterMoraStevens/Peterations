'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Send, Check, X } from 'lucide-react'

const DEFAULT_NAME = 'Anonymous'
const MAX_MSG_LEN = 2000

interface Props {
  slug: string
  parentId?: string
  /** Signed-in author: no name field, posts go live immediately. */
  isAdmin: boolean
  onCancel?: () => void
  onPosted?: () => void
}

export function CommentForm({ slug, parentId, isAdmin, onCancel, onPosted }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const idPrefix = `c-${parentId ?? 'root'}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, parentId, name: name.trim() || DEFAULT_NAME, message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      setMessage('')
      if (data.approved) {
        router.refresh()
        onPosted?.()
      } else {
        setPending(true)
      }
    } catch {
      setError('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (pending) {
    return (
      <div className="border-2 border-border shadow-brutal-sm rounded-2xl p-4 bg-card flex items-center gap-3">
        <Check size={18} className="text-green-600 shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-sm">Thanks! {parentId ? 'Reply' : 'Comment'} received.</p>
          <p className="text-xs text-muted-foreground">It&apos;ll appear here once approved.</p>
        </div>
        {onCancel ? (
          <Button size="sm" variant="ghost" onClick={onCancel}><X size={12} /> Close</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setPending(false)}>Write another</Button>
        )}
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`border-2 border-border rounded-2xl p-5 bg-card space-y-4 ${parentId ? 'shadow-brutal-sm' : 'shadow-brutal'}`}
    >
      {isAdmin ? (
        <p className="text-xs font-semibold text-muted-foreground">Posting as Peter (author)</p>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-name`}>Name</Label>
          <Input
            id={`${idPrefix}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={DEFAULT_NAME}
            maxLength={80}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-message`}>{parentId ? 'Reply' : 'Comment'} *</Label>
        <textarea
          id={`${idPrefix}-message`}
          autoFocus={!!parentId}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={parentId ? 'Write a reply…' : 'Share your thoughts…'}
          maxLength={MAX_MSG_LEN}
          required
          rows={parentId ? 3 : 4}
          className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground text-right">{message.length}/{MAX_MSG_LEN}</p>
      </div>
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" size={parentId ? 'sm' : 'default'} disabled={submitting || !message.trim()}>
          <Send size={14} />
          {submitting ? 'Posting…' : parentId ? 'Post reply' : 'Post comment'}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            <X size={12} /> Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
