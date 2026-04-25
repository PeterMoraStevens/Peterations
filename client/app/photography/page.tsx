import React from 'react'
import type { Metadata } from 'next'
import { PhotoGrid } from '@/components/photography/PhotoGrid'
import { listGarageObjects } from '@/lib/storage/garage'
import { getPhotos } from '@/lib/db/photos'
import type { Photo } from '@/types'

export const metadata: Metadata = {
  title: 'Photography',
  description: 'A visual log of places, light, and moments.',
}

export default async function PhotographyPage() {
  let photos: Photo[] = []

  try {
    // List everything in the photography folder from storage
    const [storageObjects, dbPhotos] = await Promise.all([
      listGarageObjects('photography/'),
      getPhotos().catch(() => [] as Photo[]),
    ])

    // Build a map of storagePath → DB record for metadata/dimensions
    const dbMap = new Map(dbPhotos.map((p) => [p.storagePath, p]))

    // Merge: prefer DB records (have ordering + dimensions), fill in S3-only ones
    const dbKeys = new Set(dbPhotos.map((p) => p.storagePath))

    // Start with DB photos in their saved order
    photos = [...dbPhotos]

    // Append any S3 objects that don't have a DB record yet
    let fallbackOrder = dbPhotos.length
    for (const obj of storageObjects) {
      if (!dbKeys.has(obj.key)) {
        photos.push({
          id: obj.key,
          storagePath: obj.key,
          url: obj.url,
          width: 3,
          height: 2, // default 3:2 landscape ratio
          order: fallbackOrder++,
        })
      }
    }
  } catch {
    photos = []
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-5xl md:text-6xl font-black mb-4">PHOTOGRAPHY</h1>
        <p className="text-base font-bold text-muted-foreground max-w-lg">
          Places, light, and moments worth keeping.
        </p>
      </header>

      {photos.length === 0 ? (
        <div className="border-2 border-black shadow-brutal p-16 text-center bg-white">
          <p className="font-black text-xl mb-2">Gallery coming soon.</p>
          <p className="text-sm text-muted-foreground">Photos will appear here once uploaded.</p>
        </div>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </div>
  )
}
