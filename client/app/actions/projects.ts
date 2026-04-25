'use server'

import { getProjects, upsertProject, updateProjectOrder, deleteProject } from '@/lib/db/projects'
import { deleteFromGarage } from '@/lib/storage/garage'
import { revalidatePath } from 'next/cache'
import type { Project } from '@/types'

export async function saveProjectAction(data: Omit<Project, 'id'> & { id?: string }): Promise<Project> {
  const project = await upsertProject(data)
  revalidatePath('/projects')
  revalidatePath('/admin/projects')
  return project
}

export async function reorderProjectsAction(ids: string[]): Promise<void> {
  await updateProjectOrder(ids)
  revalidatePath('/projects')
  revalidatePath('/admin/projects')
}

export async function deleteProjectAction(id: string): Promise<void> {
  const { imagePath } = await deleteProject(id)
  if (imagePath) await deleteFromGarage(imagePath).catch(() => {})
  revalidatePath('/projects')
  revalidatePath('/admin/projects')
}
