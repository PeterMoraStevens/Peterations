'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require-admin'

function revalidate() {
  revalidatePath('/admin/comments')
  revalidatePath('/blog/[post]', 'page')
}

export async function approveCommentAction(id: string) {
  await requireAdmin()
  const { approveComment } = await import('@/lib/db/comments')
  await approveComment(id)
  revalidate()
}

export async function deleteCommentAction(id: string) {
  await requireAdmin()
  const { deleteComment } = await import('@/lib/db/comments')
  await deleteComment(id)
  revalidate()
}
