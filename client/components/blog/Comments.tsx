import { MessageSquare } from 'lucide-react'
import { CommentForm } from './CommentForm'
import { CommentThread, type CommentNode } from './CommentThread'
import type { PostComment } from '@/types'

async function getComments(postId: string): Promise<PostComment[]> {
  try {
    const { getApprovedComments } = await import('@/lib/db/comments')
    return await getApprovedComments(postId)
  } catch {
    return []
  }
}

/** Builds a reply tree. Replies whose parent isn't visible are dropped. */
function buildTree(comments: PostComment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>()
  for (const c of comments) nodes.set(c.id, { ...c, replies: [] })
  const roots: CommentNode[] = []
  for (const node of nodes.values()) {
    if (!node.parentId) roots.push(node)
    else nodes.get(node.parentId)?.replies.push(node)
  }
  return roots
}

export async function Comments({ postId, slug, isAdmin }: { postId: string; slug: string; isAdmin: boolean }) {
  const comments = await getComments(postId)
  const tree = buildTree(comments)

  return (
    <section id="comments" className="mt-16 scroll-mt-24">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare size={22} />
        Comments
        {comments.length > 0 && (
          <span className="text-base font-semibold text-muted-foreground">({comments.length})</span>
        )}
      </h2>

      <CommentForm slug={slug} isAdmin={isAdmin} />

      <div className="mt-8">
        {tree.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No comments yet. Start the conversation!
          </p>
        ) : (
          <CommentThread comments={tree} slug={slug} isAdmin={isAdmin} />
        )}
      </div>
    </section>
  )
}
