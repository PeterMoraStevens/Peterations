import 'server-only'
import sql from './postgres'
import type { LivingGroup, LivingContentType, MusicEntry, MovieEntry, DishEntry, Photo } from '@/types'

// ── Groups ────────────────────────────────────────────────────────────────────

export async function getGroups(type: LivingContentType): Promise<LivingGroup[]> {
  const rows = await sql<{ id: string; type: string; name: string; order: number }[]>`
    SELECT id, type, name, "order" FROM living_groups WHERE type = ${type} ORDER BY "order" ASC
  `
  return rows.map((r) => ({ id: r.id, type: r.type as LivingContentType, name: r.name, order: r.order }))
}

export async function createGroup(type: LivingContentType, name: string): Promise<LivingGroup> {
  const [{ max }] = await sql<{ max: number }[]>`SELECT COALESCE(MAX("order"), -1) + 1 AS max FROM living_groups WHERE type = ${type}`
  const [row] = await sql<{ id: string; type: string; name: string; order: number }[]>`
    INSERT INTO living_groups (type, name, "order") VALUES (${type}, ${name}, ${max}) RETURNING id, type, name, "order"
  `
  return { id: row.id, type: row.type as LivingContentType, name: row.name, order: row.order }
}

export async function updateGroupName(id: string, name: string): Promise<void> {
  await sql`UPDATE living_groups SET name = ${name} WHERE id = ${id}`
}

export async function updateGroupOrder(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, i) => sql`UPDATE living_groups SET "order" = ${i} WHERE id = ${id}`))
}

export async function deleteGroup(id: string): Promise<void> {
  await sql`DELETE FROM living_groups WHERE id = ${id}`
}

// ── Music ─────────────────────────────────────────────────────────────────────

type MusicRow = { id: string; group_id: string | null; artist: string; track: string; album: string; listened_at: Date; spotify_url: string | null; art_url: string | null; order: number }

function rowToMusic(r: MusicRow): MusicEntry {
  return {
    id: r.id, groupId: r.group_id ?? undefined,
    artist: r.artist, track: r.track, album: r.album,
    listenedAt: r.listened_at.toISOString().slice(0, 10),
    spotifyUrl: r.spotify_url ?? undefined, artUrl: r.art_url ?? undefined,
    order: r.order,
  }
}

export async function getMusicEntries(): Promise<MusicEntry[]> {
  const rows = await sql<MusicRow[]>`SELECT * FROM music_entries ORDER BY group_id NULLS LAST, "order" ASC`
  return rows.map(rowToMusic)
}

export async function upsertMusicEntry(data: Omit<MusicEntry, 'id' | 'order'> & { id?: string }): Promise<MusicEntry> {
  if (data.id) {
    const [row] = await sql<MusicRow[]>`
      UPDATE music_entries SET group_id=${data.groupId ?? null}, artist=${data.artist}, track=${data.track},
        album=${data.album}, listened_at=${data.listenedAt}, spotify_url=${data.spotifyUrl ?? null}, art_url=${data.artUrl ?? null}
      WHERE id=${data.id} RETURNING *`
    return rowToMusic(row)
  }
  const [{ max }] = await sql<{ max: number }[]>`SELECT COALESCE(MAX("order"),-1)+1 AS max FROM music_entries WHERE group_id IS NOT DISTINCT FROM ${data.groupId ?? null}`
  const [row] = await sql<MusicRow[]>`
    INSERT INTO music_entries (group_id,artist,track,album,listened_at,spotify_url,art_url,"order")
    VALUES (${data.groupId ?? null},${data.artist},${data.track},${data.album},${data.listenedAt},${data.spotifyUrl ?? null},${data.artUrl ?? null},${max})
    RETURNING *`
  return rowToMusic(row)
}

export async function deleteMusicEntry(id: string): Promise<void> {
  await sql`DELETE FROM music_entries WHERE id = ${id}`
}

export async function updateMusicOrder(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, i) => sql`UPDATE music_entries SET "order" = ${i} WHERE id = ${id}`))
}

// ── Movies ────────────────────────────────────────────────────────────────────

type MovieRow = { id: string; group_id: string | null; title: string; rating: number; watched_at: Date; letterboxd_url: string | null; poster_url: string | null; poster_path: string | null; review: string | null; year: number | null; order: number }

function rowToMovie(r: MovieRow): MovieEntry {
  return {
    id: r.id, groupId: r.group_id ?? undefined,
    title: r.title, rating: Number(r.rating),
    watchedAt: r.watched_at.toISOString().slice(0, 10),
    letterboxdUrl: r.letterboxd_url ?? undefined, posterUrl: r.poster_url ?? undefined, posterPath: r.poster_path ?? undefined,
    review: r.review ?? undefined, year: r.year ?? undefined, order: r.order,
  }
}

export async function getMovieEntries(): Promise<MovieEntry[]> {
  const rows = await sql<MovieRow[]>`SELECT * FROM movie_entries ORDER BY group_id NULLS LAST, "order" ASC`
  return rows.map(rowToMovie)
}

export async function upsertMovieEntry(data: Omit<MovieEntry, 'id' | 'order'> & { id?: string }): Promise<MovieEntry> {
  if (data.id) {
    const [row] = await sql<MovieRow[]>`
      UPDATE movie_entries SET group_id=${data.groupId ?? null}, title=${data.title}, rating=${data.rating},
        watched_at=${data.watchedAt}, letterboxd_url=${data.letterboxdUrl ?? null}, poster_url=${data.posterUrl ?? null},
        poster_path=${data.posterPath ?? null}, review=${data.review ?? null}, year=${data.year ?? null}
      WHERE id=${data.id} RETURNING *`
    return rowToMovie(row)
  }
  const [{ max }] = await sql<{ max: number }[]>`SELECT COALESCE(MAX("order"),-1)+1 AS max FROM movie_entries WHERE group_id IS NOT DISTINCT FROM ${data.groupId ?? null}`
  const [row] = await sql<MovieRow[]>`
    INSERT INTO movie_entries (group_id,title,rating,watched_at,letterboxd_url,poster_url,poster_path,review,year,"order")
    VALUES (${data.groupId ?? null},${data.title},${data.rating},${data.watchedAt},${data.letterboxdUrl ?? null},${data.posterUrl ?? null},${data.posterPath ?? null},${data.review ?? null},${data.year ?? null},${max})
    RETURNING *`
  return rowToMovie(row)
}

export async function deleteMovieEntry(id: string): Promise<void> {
  await sql`DELETE FROM movie_entries WHERE id = ${id}`
}

export async function updateMovieOrder(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, i) => sql`UPDATE movie_entries SET "order" = ${i} WHERE id = ${id}`))
}

// ── Dishes ────────────────────────────────────────────────────────────────────

type DishRow = { id: string; group_id: string | null; name: string; cooked_at: Date; image_url: string | null; image_path: string | null; notes: string | null; cuisine: string | null; order: number }

function rowToDish(r: DishRow): DishEntry {
  return {
    id: r.id, groupId: r.group_id ?? undefined,
    name: r.name, cookedAt: r.cooked_at.toISOString().slice(0, 10),
    imageUrl: r.image_url ?? undefined, imagePath: r.image_path ?? undefined,
    notes: r.notes ?? undefined, cuisine: r.cuisine ?? undefined, order: r.order,
  }
}

export async function getDishEntries(): Promise<DishEntry[]> {
  const rows = await sql<DishRow[]>`SELECT * FROM dish_entries ORDER BY group_id NULLS LAST, "order" ASC`
  return rows.map(rowToDish)
}

export async function upsertDishEntry(data: Omit<DishEntry, 'id' | 'order'> & { id?: string }): Promise<DishEntry> {
  if (data.id) {
    const [row] = await sql<DishRow[]>`
      UPDATE dish_entries SET group_id=${data.groupId ?? null}, name=${data.name}, cooked_at=${data.cookedAt},
        image_url=${data.imageUrl ?? null}, image_path=${data.imagePath ?? null}, notes=${data.notes ?? null}, cuisine=${data.cuisine ?? null}
      WHERE id=${data.id} RETURNING *`
    return rowToDish(row)
  }
  const [{ max }] = await sql<{ max: number }[]>`SELECT COALESCE(MAX("order"),-1)+1 AS max FROM dish_entries WHERE group_id IS NOT DISTINCT FROM ${data.groupId ?? null}`
  const [row] = await sql<DishRow[]>`
    INSERT INTO dish_entries (group_id,name,cooked_at,image_url,image_path,notes,cuisine,"order")
    VALUES (${data.groupId ?? null},${data.name},${data.cookedAt},${data.imageUrl ?? null},${data.imagePath ?? null},${data.notes ?? null},${data.cuisine ?? null},${max})
    RETURNING *`
  return rowToDish(row)
}

export async function deleteDishEntry(id: string, imagePath?: string): Promise<void> {
  await sql`DELETE FROM dish_entries WHERE id = ${id}`
}

export async function updateDishOrder(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, i) => sql`UPDATE dish_entries SET "order" = ${i} WHERE id = ${id}`))
}

// ── Photos (group assignment) ─────────────────────────────────────────────────

export async function getPhotosWithGroups(): Promise<Photo[]> {
  const rows = await sql<{ id: string; group_id: string | null; title: string | null; taken_at: Date | null; location: string | null; storage_path: string; url: string; width: number; height: number; order: number }[]>`
    SELECT id, group_id, title, taken_at, location, storage_path, url, width, height, "order" FROM photos ORDER BY group_id NULLS LAST, "order" ASC
  `
  return rows.map((r) => ({
    id: r.id, groupId: r.group_id ?? undefined,
    title: r.title ?? undefined, takenAt: r.taken_at?.toISOString() ?? undefined,
    location: r.location ?? undefined, storagePath: r.storage_path, url: r.url,
    width: r.width, height: r.height, order: r.order,
  }))
}

export async function assignPhotoToGroup(photoId: string, groupId: string | null): Promise<void> {
  await sql`UPDATE photos SET group_id = ${groupId} WHERE id = ${photoId}`
}
