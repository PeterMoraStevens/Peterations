import { getGroups, getMusicEntries, getMovieEntries, getDishEntries, getPhotosWithGroups } from '@/lib/db/living'
import { LivingEditor } from '@/components/admin/LivingEditor'

export const dynamic = 'force-dynamic'

export default async function AdminLivingLifePage() {
  const [
    musicGroups, movieGroups, dishGroups, photoGroups,
    musicEntries, movieEntries, dishEntries, photos,
  ] = await Promise.all([
    getGroups('music').catch(() => []),
    getGroups('movies').catch(() => []),
    getGroups('dishes').catch(() => []),
    getGroups('photography').catch(() => []),
    getMusicEntries().catch(() => []),
    getMovieEntries().catch(() => []),
    getDishEntries().catch(() => []),
    getPhotosWithGroups().catch(() => []),
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Living Life</h1>
      <LivingEditor initialData={{
        music: { groups: musicGroups, entries: musicEntries },
        movies: { groups: movieGroups, entries: movieEntries },
        dishes: { groups: dishGroups, entries: dishEntries },
        photography: { groups: photoGroups, photos },
      }} />
    </div>
  )
}
