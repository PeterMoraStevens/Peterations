import 'server-only'
import sql from './postgres'
import type { PostComment } from '@/types'

type Row = {
  id: string
  post_id: string
  parent_id: string | null
  name: string
  message: string
  is_author: boolean
  approved: boolean
  created_at: Date
  post_title?: string
  post_slug?: string
}

function rowToComment(r: Row): PostComment {
  return {
    id: r.id,
    postId: r.post_id,
    parentId: r.parent_id ?? undefined,
    name: r.name,
    message: r.message,
    isAuthor: r.is_author,
    approved: r.approved,
    createdAt: r.created_at.toISOString(),
    postTitle: r.post_title,
    postSlug: r.post_slug,
  }
}

/** Approved comments for a post, oldest first. Threading is done by the caller. */
export async function getApprovedComments(postId: string): Promise<PostComment[]> {
  const rows = await sql<Row[]>`
    SELECT * FROM post_comments
    WHERE post_id = ${postId} AND approved = true
    ORDER BY created_at ASC
  `
  return rows.map(rowToComment)
}

export async function getAllComments(): Promise<PostComment[]> {
  const rows = await sql<Row[]>`
    SELECT c.*, p.title AS post_title, p.slug AS post_slug
    FROM post_comments c
    JOIN posts p ON p.id = c.post_id
    ORDER BY c.created_at DESC
  `
  return rows.map(rowToComment)
}

export async function getCommentMeta(id: string): Promise<{ postId: string; approved: boolean } | null> {
  const rows = await sql<{ post_id: string; approved: boolean }[]>`
    SELECT post_id, approved FROM post_comments WHERE id = ${id} LIMIT 1
  `
  return rows[0] ? { postId: rows[0].post_id, approved: rows[0].approved } : null
}

export async function createComment(input: {
  postId: string
  parentId?: string
  name: string
  message: string
  isAuthor: boolean
}): Promise<PostComment> {
  // Author comments skip moderation.
  const rows = await sql<Row[]>`
    INSERT INTO post_comments (post_id, parent_id, name, message, is_author, approved)
    VALUES (${input.postId}, ${input.parentId ?? null}, ${input.name}, ${input.message}, ${input.isAuthor}, ${input.isAuthor})
    RETURNING *
  `
  return rowToComment(rows[0])
}

export async function approveComment(id: string): Promise<void> {
  await sql`UPDATE post_comments SET approved = true WHERE id = ${id}`
}

/** Deleting a comment also deletes its replies (ON DELETE CASCADE). */
export async function deleteComment(id: string): Promise<void> {
  await sql`DELETE FROM post_comments WHERE id = ${id}`
}
