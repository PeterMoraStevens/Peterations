import 'server-only'
import sql from './postgres'
import type { GuestbookEntry } from '@/types'

type Row = {
  id: string
  name: string
  message: string
  approved: boolean
  reply: string | null
  replied_at: Date | null
  created_at: Date
}

function rowToEntry(r: Row): GuestbookEntry {
  return {
    id: r.id,
    name: r.name,
    message: r.message,
    approved: r.approved,
    reply: r.reply ?? undefined,
    repliedAt: r.replied_at?.toISOString() ?? undefined,
    createdAt: r.created_at.toISOString(),
  }
}

export async function getApprovedEntries(): Promise<GuestbookEntry[]> {
  const rows = await sql<Row[]>`
    SELECT * FROM guestbook_entries
    WHERE approved = true
    ORDER BY created_at DESC
  `
  return rows.map(rowToEntry)
}

export async function getPendingEntries(): Promise<GuestbookEntry[]> {
  const rows = await sql<Row[]>`
    SELECT * FROM guestbook_entries
    WHERE approved = false
    ORDER BY created_at ASC
  `
  return rows.map(rowToEntry)
}

export async function getAllEntries(): Promise<GuestbookEntry[]> {
  const rows = await sql<Row[]>`
    SELECT * FROM guestbook_entries
    ORDER BY created_at DESC
  `
  return rows.map(rowToEntry)
}

export async function createEntry(name: string, message: string): Promise<GuestbookEntry> {
  const rows = await sql<Row[]>`
    INSERT INTO guestbook_entries (name, message)
    VALUES (${name}, ${message})
    RETURNING *
  `
  return rowToEntry(rows[0])
}

export async function approveEntry(id: string): Promise<void> {
  await sql`UPDATE guestbook_entries SET approved = true WHERE id = ${id}`
}

export async function replyToEntry(id: string, reply: string): Promise<void> {
  if (reply) {
    await sql`UPDATE guestbook_entries SET reply = ${reply}, replied_at = NOW() WHERE id = ${id}`
  } else {
    await sql`UPDATE guestbook_entries SET reply = NULL, replied_at = NULL WHERE id = ${id}`
  }
}

export async function deleteEntry(id: string): Promise<void> {
  await sql`DELETE FROM guestbook_entries WHERE id = ${id}`
}
