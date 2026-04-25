'use server'

import { addPhoto, updatePhotoOrder, deletePhotoRecord, updatePhotoMeta } from '@/lib/db/photos'
import { deleteFromGarage } from '@/lib/storage/garage'
import { revalidatePath } from 'next/cache'
import type { Photo } from '@/types'

export async function addPhotoAction(data: {
  title?: string
  location?: string
  storagePath: string
  url: string
  width: number
  height: number
  camera?: string
  lens?: string
}): Promise<Photo> {
  const photo = await addPhoto(data)
  revalidatePath('/photography')
  revalidatePath('/admin/photography')
  return photo
}

export async function updatePhotoMetaAction(id: string, data: {
  title?: string
  description?: string
  camera?: string
  lens?: string
}): Promise<Photo> {
  const photo = await updatePhotoMeta(id, data)
  revalidatePath('/photography')
  revalidatePath('/admin/photography')
  return photo
}

export async function reorderPhotosAction(ids: string[]): Promise<void> {
  await updatePhotoOrder(ids)
  revalidatePath('/photography')
  revalidatePath('/admin/photography')
}

export async function deletePhotoAction(id: string): Promise<void> {
  const storagePath = await deletePhotoRecord(id)
  if (storagePath) await deleteFromGarage(storagePath)
  revalidatePath('/photography')
  revalidatePath('/admin/photography')
}
