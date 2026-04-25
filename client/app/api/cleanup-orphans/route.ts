import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { listAllGarageKeys, deleteGarageObjects } from '@/lib/storage/garage'
import sql from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.CLEANUP_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Collect all storage keys referenced in the database
  const referenced = new Set<string>()

  const [photoRows, postRows, projectRows, aboutRows, dishRows] = await Promise.all([
    sql<{ storage_path: string }[]>`
      SELECT storage_path FROM photos WHERE storage_path IS NOT NULL
    `,
    sql<{ cover_image_path: string | null; image_paths: string[] }[]>`
      SELECT cover_image_path, image_paths FROM posts
    `,
    sql<{ image_path: string | null }[]>`
      SELECT image_path FROM projects WHERE image_path IS NOT NULL
    `,
    sql<{ photo_path: string | null }[]>`
      SELECT photo_path FROM about_profile WHERE photo_path IS NOT NULL
    `,
    sql<{ image_path: string | null }[]>`
      SELECT image_path FROM dish_entries WHERE image_path IS NOT NULL
    `,
  ])

  for (const r of photoRows)   referenced.add(r.storage_path)
  for (const r of postRows) {
    if (r.cover_image_path) referenced.add(r.cover_image_path)
    for (const p of r.image_paths ?? []) referenced.add(p)
  }
  for (const r of projectRows) if (r.image_path)  referenced.add(r.image_path)
  for (const r of aboutRows)   if (r.photo_path)  referenced.add(r.photo_path)
  for (const r of dishRows)    if (r.image_path)  referenced.add(r.image_path)

  // List every key in the bucket
  const allKeys = await listAllGarageKeys()
  const orphans = allKeys.filter((k) => !referenced.has(k))

  if (orphans.length > 0) {
    await deleteGarageObjects(orphans)
  }

  return NextResponse.json({
    scanned: allKeys.length,
    referenced: referenced.size,
    deleted: orphans.length,
    orphans,
  })
}
