'use server'

import {
  upsertAboutProfile,
  upsertTimelineEntry,
  updateTimelineOrder,
  deleteTimelineEntry,
  clearAboutPhoto,
  upsertAboutLink,
  deleteAboutLink,
  reorderAboutLinks,
} from '@/lib/db/about'
import type { AboutLink } from '@/types'
import { deleteFromGarage } from '@/lib/storage/garage'
import { revalidatePath } from 'next/cache'
import type { AboutProfile, TimelineEntry } from '@/types'

export async function deleteAboutPhotoAction(photoPath: string): Promise<void> {
  await deleteFromGarage(photoPath).catch(() => {})
  await clearAboutPhoto()
  revalidatePath('/about')
  revalidatePath('/admin/about')
}

export async function saveAboutProfileAction(
  data: AboutProfile,
  oldPhotoPath?: string
): Promise<void> {
  if (oldPhotoPath && oldPhotoPath !== data.photoPath) {
    await deleteFromGarage(oldPhotoPath).catch(() => {})
  }
  await upsertAboutProfile(data)
  revalidatePath('/about')
  revalidatePath('/admin/about')
}

export async function saveTimelineEntryAction(
  data: Omit<TimelineEntry, 'id'> & { id?: string }
): Promise<TimelineEntry> {
  const entry = await upsertTimelineEntry(data)
  revalidatePath('/about')
  revalidatePath('/admin/about')
  return entry
}

export async function reorderTimelineAction(ids: string[]): Promise<void> {
  await updateTimelineOrder(ids)
  revalidatePath('/about')
  revalidatePath('/admin/about')
}

export async function deleteTimelineEntryAction(id: string): Promise<void> {
  await deleteTimelineEntry(id)
  revalidatePath('/about')
  revalidatePath('/admin/about')
}

export async function saveAboutLinkAction(data: { id?: string; label: string; url: string; order: number }): Promise<AboutLink> {
  const link = await upsertAboutLink(data)
  revalidatePath('/about')
  revalidatePath('/admin/about')
  return link
}

export async function deleteAboutLinkAction(id: string): Promise<void> {
  await deleteAboutLink(id)
  revalidatePath('/about')
  revalidatePath('/admin/about')
}

export async function reorderAboutLinksAction(ids: string[]): Promise<void> {
  await reorderAboutLinks(ids)
  revalidatePath('/about')
  revalidatePath('/admin/about')
}
