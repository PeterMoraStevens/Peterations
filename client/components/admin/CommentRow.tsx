'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { approveCommentAction, deleteCommentAction } from '@/app/actions/comments'
import { CommentForm } from '@/components/blog/CommentForm'
import { Check, Trash2, Reply, CornerDownRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { PostComment } from '@/types'

export function CommentRow({ comment, parent, stripe }: { comment: PostComment; parent?: PostComment; stripe: boolean }) {
  const [replyOpen, setReplyOpen] = useState(false)

  return (
    <div className={`px-5 py-4 border-t-2 border-border first:border-t-0 ${stripe ? 'bg-card' : 'bg-muted/40'}`}>
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-sm">{comment.name}</span>
            {comment.isAuthor && <Badge variant="default">Author</Badge>}
            <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
            <Badge variant={comment.approved ? 'default' : 'outline'} className="ml-auto">
              {comment.approved ? 'Live' : 'Pending'}
            </Badge>
          </div>
          {comment.postSlug && (
            <Link
              href={`/blog/${comment.postSlug}#comment-${comment.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold hover:underline underline-offset-4 mb-2"
            >
              on “{comment.postTitle}” <ExternalLink size={11} />
            </Link>
          )}
          {parent && (
            <p className="flex items-start gap-1 text-xs text-muted-foreground mb-1 line-clamp-1">
              <CornerDownRight size={12} className="shrink-0 mt-0.5" />
              Replying to {parent.name}: “{parent.message}”
            </p>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">{comment.message}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!comment.approved && (
            <form action={approveCommentAction.bind(null, comment.id)}>
              <Button type="submit" size="sm" variant="secondary">
                <Check size={12} /> Approve
              </Button>
            </form>
          )}
          {comment.postSlug && (
            <Button size="sm" variant="outline" onClick={() => setReplyOpen(!replyOpen)}>
              <Reply size={12} /> Reply
            </Button>
          )}
          <ConfirmDialog
            title="Delete this comment?"
            description={<>{comment.name}’s comment will be permanently removed, along with any replies to it.</>}
            onConfirm={() => deleteCommentAction(comment.id)}
            trigger={
              <Button type="button" size="sm" variant="destructive" title="Delete (also deletes replies)" aria-label="Delete comment">
                <Trash2 size={12} />
              </Button>
            }
          />
        </div>
      </div>

      {replyOpen && comment.postSlug && (
        <div className="mt-3 pl-3 border-l-2 border-border">
          {!comment.approved && (
            <p className="text-xs text-muted-foreground mb-2">Replying will also approve this comment.</p>
          )}
          <CommentForm
            slug={comment.postSlug}
            parentId={comment.id}
            isAdmin
            onCancel={() => setReplyOpen(false)}
            onPosted={() => setReplyOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
