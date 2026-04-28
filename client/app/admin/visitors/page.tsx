import React from 'react'
import { Clock, CheckCheck } from 'lucide-react'
import { GuestbookEntryRow } from '@/components/admin/GuestbookEntryRow'
import type { GuestbookEntry } from '@/types'

export const dynamic = 'force-dynamic'

async function getAllEntries(): Promise<{ entries: GuestbookEntry[]; error?: string }> {
  try {
    const { getAllEntries } = await import('@/lib/db/guestbook')
    return { entries: await getAllEntries() }
  } catch (err) {
    return { entries: [], error: (err as Error).message }
  }
}

export default async function AdminVisitorsPage() {
  const { entries, error } = await getAllEntries()
  const pending = entries.filter((e) => !e.approved)
  const approved = entries.filter((e) => e.approved)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Visitor's Book</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock size={14} />{pending.length} pending</span>
          <span className="flex items-center gap-1"><CheckCheck size={14} />{approved.length} approved</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 border-2 border-destructive bg-destructive/10 rounded-xl p-4 text-sm font-mono text-destructive">
          DB error: {error}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="border-2 border-border shadow-brutal rounded-2xl p-12 text-center bg-card">
          <p className="font-bold text-lg mb-1">No messages yet.</p>
          <p className="text-sm text-muted-foreground">They'll appear here once visitors submit the form.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Clock size={16} /> Pending approval
              </h2>
              <div className="border-2 border-border shadow-brutal rounded-2xl overflow-hidden">
                {pending.map((entry, i) => (
                  <GuestbookEntryRow key={entry.id} entry={entry} stripe={i % 2 === 0} />
                ))}
              </div>
            </section>
          )}

          {approved.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <CheckCheck size={16} /> Approved
              </h2>
              <div className="border-2 border-border shadow-brutal rounded-2xl overflow-hidden">
                {approved.map((entry, i) => (
                  <GuestbookEntryRow key={entry.id} entry={entry} stripe={i % 2 === 0} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
