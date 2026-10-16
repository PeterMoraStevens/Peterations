'use server'

import { saveBlogPost, deleteBlogPost, removeImagePathFromPost } from '@/lib/db/blog'
import { deleteFromGarage } from '@/lib/storage/garage'
import { isAdmin } from '@/lib/auth/require-admin'
import { revalidatePath } from 'next/cache'
import type { BlogPost } from '@/types'

type SaveResult =
  | { id: string; savedAt: string; error?: never }
  | { error: string; id?: never; savedAt?: never }

export async function saveBlogPostAction(
  data: Omit<BlogPost, 'id'> & { id?: string }
): Promise<SaveResult> {
  if (!(await isAdmin())) return { error: 'You are signed out. Sign in again to save.' }
  try {
    const id = await saveBlogPost(data)
    revalidatePath('/blog')
    revalidatePath(`/blog/${data.slug}`)
    revalidatePath('/admin/blog')
    return { id, savedAt: new Date().toISOString() }
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      return { error: `Another post already uses the slug "${data.slug}".` }
    }
    console.error('[saveBlogPostAction]', err)
    return { error: 'Failed to save post.' }
  }
}

export async function deleteBlogPostAction(
  id: string
): Promise<{ ok: true; error?: never } | { error: string; ok?: never }> {
  if (!(await isAdmin())) return { error: 'Unauthorized' }
  try {
    const deleted = await deleteBlogPost(id)
    if (deleted) {
      // Clean up all images associated with this post
      await Promise.allSettled(deleted.imagePaths.map((p) => deleteFromGarage(p)))
    }
    revalidatePath('/blog')
    revalidatePath('/admin/blog')
    return { ok: true }
  } catch (err) {
    console.error('[deleteBlogPostAction]', err)
    return { error: 'Failed to delete post.' }
  }
}

export async function deletePostImageAction(
  postId: string,
  storagePath: string
): Promise<void> {
  if (!(await isAdmin())) throw new Error('Unauthorized')
  await deleteFromGarage(storagePath)
  if (postId) await removeImagePathFromPost(postId, storagePath)
  revalidatePath('/admin/blog')
}

/** Deletes the stored file only; the editor clears the field and autosaves. */
export async function deleteCoverImageAction(storagePath: string): Promise<void> {
  if (!(await isAdmin())) throw new Error('Unauthorized')
  await deleteFromGarage(storagePath)
}
