'use server'

import { saveBlogPost, deleteBlogPost, removeImagePathFromPost } from '@/lib/db/blog'
import { deleteFromGarage } from '@/lib/storage/garage'
import { revalidatePath } from 'next/cache'
import type { BlogPost } from '@/types'

export async function saveBlogPostAction(
  data: Omit<BlogPost, 'id'> & { id?: string }
): Promise<{ id: string; error?: never } | { error: string; id?: never }> {
  try {
    const id = await saveBlogPost(data)
    revalidatePath('/blog')
    revalidatePath(`/blog/${data.slug}`)
    revalidatePath('/admin/blog')
    return { id }
  } catch (err) {
    console.error('[saveBlogPostAction]', err)
    return { error: 'Failed to save post.' }
  }
}

export async function deleteBlogPostAction(
  id: string
): Promise<{ ok: true; error?: never } | { error: string; ok?: never }> {
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
  await deleteFromGarage(storagePath)
  if (postId) await removeImagePathFromPost(postId, storagePath)
  revalidatePath('/admin/blog')
}

export async function deleteCoverImageAction(
  postId: string | undefined,
  storagePath: string
): Promise<void> {
  await deleteFromGarage(storagePath)
  if (postId) {
    const { saveBlogPost, getBlogPostById } = await import('@/lib/db/blog')
    const post = await getBlogPostById(postId)
    if (post) {
      await saveBlogPost({ ...post, coverImage: undefined, coverImagePath: undefined })
    }
  }
  revalidatePath('/admin/blog')
}
