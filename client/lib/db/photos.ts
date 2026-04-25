import 'server-only'
import sql from './postgres'
import type { Photo } from '@/types'

type Row = {
  id: string
  title: string | null
  description: string | null
  camera: string | null
  lens: string | null
  taken_at: Date | null
  location: string | null
  storage_path: string
  url: string
  width: number
  height: number
  order: number
  created_at: Date
}

function rowToPhoto(r: Row): Photo {
  return {
    id: r.id,
    title: r.title ?? undefined,
    description: r.description ?? undefined,
    camera: r.camera ?? undefined,
    lens: r.lens ?? undefined,
    takenAt: r.taken_at?.toISOString(),
    location: r.location ?? undefined,
    storagePath: r.storage_path,
    url: r.url,
    width: r.width,
    height: r.height,
    order: r.order,
  }
}

export async function getPhotos(): Promise<Photo[]> {
  const rows = await sql<Row[]>`SELECT * FROM photos ORDER BY "order" ASC, created_at ASC`
  return rows.map(rowToPhoto)
}

export async function addPhoto(data: {
  title?: string
  location?: string
  storagePath: string
  url: string
  width: number
  height: number
  camera?: string
  lens?: string
}): Promise<Photo> {
  const [{ max }] = await sql<{ max: number }[]>`
    SELECT COALESCE(MAX("order"), -1) + 1 AS max FROM photos
  `
  const rows = await sql<Row[]>`
    INSERT INTO photos (title, description, camera, lens, location, storage_path, url, width, height, "order")
    VALUES (${data.title ?? null}, null, ${data.camera ?? null}, ${data.lens ?? null},
            ${data.location ?? null}, ${data.storagePath}, ${data.url},
            ${data.width}, ${data.height}, ${max})
    RETURNING *
  `
  return rowToPhoto(rows[0])
}

export async function updatePhotoMeta(id: string, data: {
  title?: string
  description?: string
  camera?: string
  lens?: string
}): Promise<Photo> {
  const rows = await sql<Row[]>`
    UPDATE photos
    SET title       = ${data.title ?? null},
        description = ${data.description ?? null},
        camera      = ${data.camera ?? null},
        lens        = ${data.lens ?? null}
    WHERE id = ${id}
    RETURNING *
  `
  return rowToPhoto(rows[0])
}

export async function updatePhotoOrder(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, i) => sql`UPDATE photos SET "order" = ${i} WHERE id = ${id}`))
}

export async function deletePhotoRecord(id: string): Promise<string | null> {
  const rows = await sql<{ storage_path: string }[]>`
    DELETE FROM photos WHERE id = ${id} RETURNING storage_path
  `
  return rows[0]?.storage_path ?? null
}
