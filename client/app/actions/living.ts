'use server'

import {
  getGroups, createGroup, updateGroupName, updateGroupOrder, deleteGroup,
  upsertMusicEntry, deleteMusicEntry, updateMusicOrder,
  upsertMovieEntry, deleteMovieEntry, updateMovieOrder,
  upsertDishEntry, deleteDishEntry, updateDishOrder,
  assignPhotoToGroup,
} from '@/lib/db/living'
import { deleteFromGarage } from '@/lib/storage/garage'
import { revalidatePath } from 'next/cache'
import type { LivingContentType, LivingGroup, MusicEntry, MovieEntry, DishEntry } from '@/types'

function revalidate() {
  revalidatePath('/living-life')
  revalidatePath('/admin/living-life')
}

// Groups
export async function createGroupAction(type: LivingContentType, name: string): Promise<LivingGroup> {
  const group = await createGroup(type, name)
  revalidate()
  return group
}

export async function updateGroupNameAction(id: string, name: string): Promise<void> {
  await updateGroupName(id, name)
  revalidate()
}

export async function reorderGroupsAction(ids: string[]): Promise<void> {
  await updateGroupOrder(ids)
  revalidate()
}

export async function deleteGroupAction(id: string): Promise<void> {
  await deleteGroup(id)
  revalidate()
}

// Music
export async function saveMusicEntryAction(data: Omit<MusicEntry, 'id' | 'order'> & { id?: string }): Promise<MusicEntry> {
  const entry = await upsertMusicEntry(data)
  revalidate()
  return entry
}

export async function deleteMusicEntryAction(id: string): Promise<void> {
  await deleteMusicEntry(id)
  revalidate()
}

export async function reorderMusicAction(ids: string[]): Promise<void> {
  await updateMusicOrder(ids)
  revalidate()
}

// Movies
export async function saveMovieEntryAction(data: Omit<MovieEntry, 'id' | 'order'> & { id?: string }): Promise<MovieEntry> {
  const entry = await upsertMovieEntry(data)
  revalidate()
  return entry
}

export async function deleteMovieEntryAction(id: string, posterPath?: string): Promise<void> {
  await deleteMovieEntry(id)
  if (posterPath) await deleteFromGarage(posterPath).catch(() => {})
  revalidate()
}

export async function reorderMoviesAction(ids: string[]): Promise<void> {
  await updateMovieOrder(ids)
  revalidate()
}

// Dishes
export async function saveDishEntryAction(data: Omit<DishEntry, 'id' | 'order'> & { id?: string }): Promise<DishEntry> {
  const entry = await upsertDishEntry(data)
  revalidate()
  return entry
}

export async function deleteDishEntryAction(id: string, imagePath?: string): Promise<void> {
  await deleteDishEntry(id)
  if (imagePath) await deleteFromGarage(imagePath).catch(() => {})
  revalidate()
}

export async function reorderDishesAction(ids: string[]): Promise<void> {
  await updateDishOrder(ids)
  revalidate()
}

// Photography group assignment
export async function assignPhotoToGroupAction(photoId: string, groupId: string | null): Promise<void> {
  await assignPhotoToGroup(photoId, groupId)
  revalidate()
}
