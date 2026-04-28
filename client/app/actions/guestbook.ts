'use server'

import { revalidatePath } from 'next/cache'

export async function approveEntryAction(id: string) {
  const { approveEntry } = await import('@/lib/db/guestbook')
  await approveEntry(id)
  revalidatePath('/admin/visitors')
  revalidatePath('/visitors')
}

export async function replyToEntryAction(id: string, reply: string) {
  const { replyToEntry } = await import('@/lib/db/guestbook')
  await replyToEntry(id, reply)
  revalidatePath('/admin/visitors')
  revalidatePath('/visitors')
}

export async function deleteEntryAction(id: string) {
  const { deleteEntry } = await import('@/lib/db/guestbook')
  await deleteEntry(id)
  revalidatePath('/admin/visitors')
  revalidatePath('/visitors')
}
