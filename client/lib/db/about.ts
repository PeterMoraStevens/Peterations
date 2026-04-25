import 'server-only'
import sql from './postgres'
import type { AboutProfile, AboutLink, TimelineEntry } from '@/types'

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getAboutProfile(): Promise<AboutProfile> {
  const rows = await sql<{ name: string; bio: string; photo_url: string | null; photo_path: string | null; skills: string[] }[]>`
    SELECT name, bio, photo_url, photo_path, skills FROM about_profile WHERE id = 'main'
  `
  if (!rows[0]) return { name: '', bio: '', skills: [] }
  const r = rows[0]
  return {
    name: r.name,
    bio: r.bio,
    photoUrl: r.photo_url ?? undefined,
    photoPath: r.photo_path ?? undefined,
    skills: r.skills,
  }
}

export async function upsertAboutProfile(data: AboutProfile): Promise<void> {
  await sql`
    INSERT INTO about_profile (id, name, bio, photo_url, photo_path, skills, updated_at)
    VALUES ('main', ${data.name}, ${data.bio}, ${data.photoUrl ?? null}, ${data.photoPath ?? null}, ${sql.array(data.skills)}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      name       = EXCLUDED.name,
      bio        = EXCLUDED.bio,
      photo_url  = EXCLUDED.photo_url,
      photo_path = EXCLUDED.photo_path,
      skills     = EXCLUDED.skills,
      updated_at = NOW()
  `
}

// ── Timeline ──────────────────────────────────────────────────────────────────

type TimelineRow = {
  id: string
  role: string
  company: string
  start_date: Date
  end_date: Date | null
  description: string
  bullets: string[]
  skills: string[]
  order: number
  current: boolean
}

function rowToEntry(r: TimelineRow): TimelineEntry {
  return {
    id: r.id,
    role: r.role,
    company: r.company,
    startDate: r.start_date.toISOString().slice(0, 10),
    endDate: r.end_date?.toISOString().slice(0, 10),
    description: r.description,
    bullets: r.bullets,
    skills: r.skills,
    order: r.order,
    current: r.current,
  }
}

export async function getTimeline(): Promise<TimelineEntry[]> {
  const rows = await sql<TimelineRow[]>`SELECT * FROM timeline ORDER BY "order" ASC, created_at ASC`
  return rows.map(rowToEntry)
}

export async function upsertTimelineEntry(data: Omit<TimelineEntry, 'id'> & { id?: string }): Promise<TimelineEntry> {
  if (data.id) {
    const rows = await sql<TimelineRow[]>`
      UPDATE timeline SET
        role        = ${data.role},
        company     = ${data.company},
        start_date  = ${data.startDate},
        end_date    = ${data.endDate ?? null},
        description = ${data.description},
        bullets     = ${sql.array(data.bullets)},
        skills      = ${sql.array(data.skills)},
        "order"     = ${data.order},
        current     = ${data.current}
      WHERE id = ${data.id}
      RETURNING *
    `
    return rowToEntry(rows[0])
  }

  const [{ max }] = await sql<{ max: number }[]>`SELECT COALESCE(MAX("order"), -1) + 1 AS max FROM timeline`
  const rows = await sql<TimelineRow[]>`
    INSERT INTO timeline (role, company, start_date, end_date, description, bullets, skills, "order", current)
    VALUES (${data.role}, ${data.company}, ${data.startDate}, ${data.endDate ?? null},
            ${data.description}, ${sql.array(data.bullets)}, ${sql.array(data.skills)}, ${max}, ${data.current})
    RETURNING *
  `
  return rowToEntry(rows[0])
}

export async function updateTimelineOrder(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, i) => sql`UPDATE timeline SET "order" = ${i} WHERE id = ${id}`))
}

export async function deleteTimelineEntry(id: string): Promise<void> {
  await sql`DELETE FROM timeline WHERE id = ${id}`
}

export async function clearAboutPhoto(): Promise<void> {
  await sql`UPDATE about_profile SET photo_url = NULL, photo_path = NULL, updated_at = NOW() WHERE id = 'main'`
}

// ── Links ─────────────────────────────────────────────────────────────────────

export async function getAboutLinks(): Promise<AboutLink[]> {
  const rows = await sql<{ id: string; label: string; url: string; order: number }[]>`
    SELECT id, label, url, "order" FROM about_links ORDER BY "order" ASC
  `
  return rows.map((r) => ({ id: r.id, label: r.label, url: r.url, order: r.order }))
}

export async function upsertAboutLink(data: { id?: string; label: string; url: string; order: number }): Promise<AboutLink> {
  if (data.id) {
    const rows = await sql<{ id: string; label: string; url: string; order: number }[]>`
      UPDATE about_links SET label = ${data.label}, url = ${data.url}, "order" = ${data.order}
      WHERE id = ${data.id} RETURNING id, label, url, "order"
    `
    return { ...rows[0] }
  }
  const [{ max }] = await sql<{ max: number }[]>`SELECT COALESCE(MAX("order"), -1) + 1 AS max FROM about_links`
  const rows = await sql<{ id: string; label: string; url: string; order: number }[]>`
    INSERT INTO about_links (label, url, "order") VALUES (${data.label}, ${data.url}, ${max})
    RETURNING id, label, url, "order"
  `
  return { ...rows[0] }
}

export async function deleteAboutLink(id: string): Promise<void> {
  await sql`DELETE FROM about_links WHERE id = ${id}`
}

export async function reorderAboutLinks(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, i) => sql`UPDATE about_links SET "order" = ${i} WHERE id = ${id}`))
}
