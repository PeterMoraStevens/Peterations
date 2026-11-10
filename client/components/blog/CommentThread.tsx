'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import { deleteCommentAction } from '@/app/actions/comments'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CommentForm } from './CommentForm'
import { Reply, Trash2 } from 'lucide-react'
import type { PostComment } from '@/types'

export type CommentNode = PostComment & { replies: CommentNode[] }

/** Past this depth replies stop indenting further so threads stay readable on mobile. */
const MAX_INDENT_DEPTH = 3

interface Props {
  comments: CommentNode[]
  slug: string
  isAdmin: boolean
  depth?: number
}

export function CommentThread({ comments, slug, isAdmin, depth = 0 }: Props) {
  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} slug={slug} isAdmin={isAdmin} depth={depth} />
      ))}
    </ul>
  )
}

function CommentItem({ comment, slug, isAdmin, depth }: { comment: CommentNode; slug: string; isAdmin: boolean; depth: number }) {
  const [replying, setReplying] = useState(false)
  const indent = depth < MAX_INDENT_DEPTH

  return (
    <li>
      <div
        id={`comment-${comment.id}`}
        className={`border-2 border-border rounded-2xl p-5 scroll-mt-24 ${depth === 0 ? 'shadow-brutal' : 'shadow-brutal-sm'} ${comment.isAuthor ? 'bg-accent' : 'bg-card'}`}
      >
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <span className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-sm truncate">{comment.name}</span>
            {comment.isAuthor && <Badge variant="default">Author</Badge>}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{comment.message}</p>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReplying(!replying)}
            className="inline-flex items-center gap-1 text-xs font-semibold hover:underline underline-offset-4"
          >
            <Reply size={12} /> Reply
          </button>
          {isAdmin && (
            <ConfirmDialog
              title={comment.replies.length ? 'Delete comment and replies?' : 'Delete this comment?'}
              description={
                comment.replies.length
                  ? `This will permanently delete ${comment.name}’s comment and its ${comment.replies.length === 1 ? 'reply' : `${comment.replies.length} replies`}.`
                  : `${comment.name}’s comment will be permanently removed.`
              }
              onConfirm={() => deleteCommentAction(comment.id)}
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={12} /> Delete
                </button>
              }
            />
          )}
        </div>
      </div>

      {(replying || comment.replies.length > 0) && (
        <div className={`mt-4 space-y-4 ${indent ? 'pl-4 sm:pl-6 border-l-2 border-border ml-2 sm:ml-4' : ''}`}>
          {replying && (
            <CommentForm
              slug={slug}
              parentId={comment.id}
              isAdmin={isAdmin}
              onCancel={() => setReplying(false)}
              onPosted={() => setReplying(false)}
            />
          )}
          {comment.replies.length > 0 && (
            <CommentThread comments={comment.replies} slug={slug} isAdmin={isAdmin} depth={depth + 1} />
          )}
        </div>
      )}
    </li>
  )
}
