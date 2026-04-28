'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import { approveEntryAction, deleteEntryAction, replyToEntryAction } from '@/app/actions/guestbook'
import { Check, Trash2, Reply, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { GuestbookEntry } from '@/types'

export function GuestbookEntryRow({ entry, stripe }: { entry: GuestbookEntry; stripe: boolean }) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState(entry.reply ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSaveReply(text = replyText) {
    setSaving(true)
    await replyToEntryAction(entry.id, text.trim())
    setSaving(false)
    setReplyOpen(false)
  }

  return (
    <div className={`px-5 py-4 border-t-2 border-border first:border-t-0 ${stripe ? 'bg-card' : 'bg-muted/40'}`}>
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm">{entry.name}</span>
            <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
            <Badge variant={entry.approved ? 'default' : 'outline'} className="ml-auto">
              {entry.approved ? 'Live' : 'Pending'}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{entry.message}</p>

          {/* Existing reply */}
          {entry.reply && !replyOpen && (
            <div className="mt-3 pl-3 border-l-2 border-border">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-semibold text-foreground">Your reply</p>
                <button
                  type="button"
                  title="Delete reply"
                  onClick={() => handleSaveReply('')}
                  disabled={saving}
                  className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                >
                  <X size={11} />
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{entry.reply}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!entry.approved && (
            <form action={approveEntryAction.bind(null, entry.id)}>
              <Button type="submit" size="sm" variant="secondary">
                <Check size={12} /> Approve
              </Button>
            </form>
          )}
          <Button size="sm" variant="outline" onClick={() => { setReplyText(entry.reply ?? ''); setReplyOpen(!replyOpen) }}>
            <Reply size={12} /> {entry.reply ? 'Edit reply' : 'Reply'}
          </Button>
          <form action={deleteEntryAction.bind(null, entry.id)}>
            <Button type="submit" size="sm" variant="destructive">
              <Trash2 size={12} />
            </Button>
          </form>
        </div>
      </div>

      {/* Inline reply editor */}
      {replyOpen && (
        <div className="mt-3 pl-3 border-l-2 border-border space-y-2">
          <textarea
            autoFocus
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply…"
            rows={3}
            className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => handleSaveReply()} disabled={saving}>
              {saving ? 'Saving…' : 'Save reply'}
            </Button>
            {entry.reply && (
              <Button size="sm" variant="outline" onClick={() => handleSaveReply('')} disabled={saving}>
                Remove reply
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setReplyOpen(false)}>
              <X size={12} /> Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
