import { PhotoManager } from '@/components/admin/PhotoManager'
import { getPhotos } from '@/lib/db/photos'

export const dynamic = 'force-dynamic'

export default async function AdminPhotographyPage() {
  const photos = await getPhotos()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Photography</h1>
      <PhotoManager initialPhotos={photos} />
    </div>
  )
}
