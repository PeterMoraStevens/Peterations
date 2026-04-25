import 'server-only'
import sql from './postgres'
import type { Project } from '@/types'

type ProjectRow = {
  id: string
  title: string
  description: string
  url: string | null
  repo_url: string | null
  tags: string[]
  image_url: string | null
  image_path: string | null
  featured: boolean
  order: number
}

function rowToProject(r: ProjectRow): Project {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    url: r.url ?? undefined,
    repoUrl: r.repo_url ?? undefined,
    tags: r.tags,
    imageUrl: r.image_url ?? undefined,
    imagePath: r.image_path ?? undefined,
    featured: r.featured,
    order: r.order,
  }
}

export async function getProjects(): Promise<Project[]> {
  const rows = await sql<ProjectRow[]>`SELECT * FROM projects ORDER BY "order" ASC, created_at ASC`
  return rows.map(rowToProject)
}

export async function upsertProject(data: Omit<Project, 'id'> & { id?: string }): Promise<Project> {
  if (data.id) {
    const rows = await sql<ProjectRow[]>`
      UPDATE projects SET
        title       = ${data.title},
        description = ${data.description},
        url         = ${data.url ?? null},
        repo_url    = ${data.repoUrl ?? null},
        tags        = ${sql.array(data.tags)},
        image_url   = ${data.imageUrl ?? null},
        image_path  = ${data.imagePath ?? null},
        featured    = ${data.featured},
        "order"     = ${data.order}
      WHERE id = ${data.id}
      RETURNING *
    `
    return rowToProject(rows[0])
  }
  const [{ max }] = await sql<{ max: number }[]>`SELECT COALESCE(MAX("order"), -1) + 1 AS max FROM projects`
  const rows = await sql<ProjectRow[]>`
    INSERT INTO projects (title, description, url, repo_url, tags, image_url, image_path, featured, "order")
    VALUES (${data.title}, ${data.description}, ${data.url ?? null}, ${data.repoUrl ?? null},
            ${sql.array(data.tags)}, ${data.imageUrl ?? null}, ${data.imagePath ?? null}, ${data.featured}, ${max})
    RETURNING *
  `
  return rowToProject(rows[0])
}

export async function updateProjectOrder(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, i) => sql`UPDATE projects SET "order" = ${i} WHERE id = ${id}`))
}

export async function deleteProject(id: string): Promise<{ imagePath?: string }> {
  const rows = await sql<{ image_path: string | null }[]>`DELETE FROM projects WHERE id = ${id} RETURNING image_path`
  return { imagePath: rows[0]?.image_path ?? undefined }
}
