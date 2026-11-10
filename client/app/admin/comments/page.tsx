import React from 'react'
import { Clock, CheckCheck } from 'lucide-react'
import { CommentRow } from '@/components/admin/CommentRow'
import type { PostComment } from '@/types'

export const dynamic = 'force-dynamic'

async function getAllComments(): Promise<{ comments: PostComment[]; error?: string }> {
  try {
    const { getAllComments } = await import('@/lib/db/comments')
    return { comments: await getAllComments() }
  } catch (err) {
    return { comments: [], error: (err as Error).message }
  }
}

export default async function AdminCommentsPage() {
  const { comments, error } = await getAllComments()
  const byId = new Map(comments.map((c) => [c.id, c]))
  const pending = comments.filter((c) => !c.approved).reverse() // oldest first
  const approved = comments.filter((c) => c.approved)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Comments</h1>
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

      {comments.length === 0 ? (
        <div className="border-2 border-border shadow-brutal rounded-2xl p-12 text-center bg-card">
          <p className="font-bold text-lg mb-1">No comments yet.</p>
          <p className="text-sm text-muted-foreground">They&apos;ll appear here once readers comment on a post.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Clock size={16} /> Pending approval
              </h2>
              <div className="border-2 border-border shadow-brutal rounded-2xl overflow-hidden">
                {pending.map((c, i) => (
                  <CommentRow key={c.id} comment={c} parent={c.parentId ? byId.get(c.parentId) : undefined} stripe={i % 2 === 0} />
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
                {approved.map((c, i) => (
                  <CommentRow key={c.id} comment={c} parent={c.parentId ? byId.get(c.parentId) : undefined} stripe={i % 2 === 0} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
