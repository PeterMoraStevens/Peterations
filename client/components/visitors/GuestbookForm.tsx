'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Send, Check } from 'lucide-react'

const DEFAULT_NAME = 'Anonymous'

export function GuestbookForm() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || DEFAULT_NAME, message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      setSubmitted(true)
      setName('')
      setMessage('')
    } catch {
      setError('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="border-2 border-border shadow-brutal rounded-2xl p-6 bg-card flex items-center gap-3">
        <Check size={18} className="text-green-600 shrink-0" />
        <div>
          <p className="font-bold text-sm">Message received!</p>
          <p className="text-xs text-muted-foreground">It'll appear here once approved.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border-2 border-border shadow-brutal rounded-2xl p-6 bg-card space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="gb-name">Name</Label>
        <Input
          id="gb-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={DEFAULT_NAME}
          maxLength={80}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="gb-message">Message *</Label>
        <textarea
          id="gb-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say hello…"
          maxLength={500}
          required
          rows={4}
          className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
      </div>
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
      <Button type="submit" disabled={submitting || !message.trim()}>
        <Send size={14} />
        {submitting ? 'Sending…' : 'Sign the book'}
      </Button>
    </form>
  )
}
