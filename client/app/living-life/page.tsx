import React from 'react'
import type { Metadata } from 'next'
import { MusicCard } from '@/components/living-life/MusicCard'
import { MovieCard } from '@/components/living-life/MovieCard'
import { DishCard } from '@/components/living-life/DishCard'
import { getGroups, getMusicEntries, getMovieEntries, getDishEntries, getPhotosWithGroups } from '@/lib/db/living'
import type { LivingGroup, MusicEntry, MovieEntry, DishEntry, Photo } from '@/types'

export const metadata: Metadata = {
  title: 'Living Life',
  description: "Music, movies, meals, and photos — what I've been up to.",
}

function SectionHeader({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <h2 className="text-3xl font-black">{children}</h2>
      <div className="flex-1 h-0.5 bg-border" />
    </div>
  )
}

function GroupHeader({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h3 className="text-lg font-bold">{name}</h3>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function grouped<T extends { groupId?: string }>(items: T[], groups: LivingGroup[]) {
  const byGroup: { group: LivingGroup | null; items: T[] }[] = groups.map((g) => ({
    group: g,
    items: items.filter((i) => i.groupId === g.id),
  })).filter((s) => s.items.length > 0)
  const ungrouped = items.filter((i) => !i.groupId)
  if (ungrouped.length > 0) byGroup.push({ group: null, items: ungrouped })
  return byGroup
}

export default async function LivingLifePage() {
  const [
    musicGroups, movieGroups, dishGroups, photoGroups,
    musicEntries, movieEntries, dishEntries, photos,
  ] = await Promise.all([
    getGroups('music').catch(() => [] as LivingGroup[]),
    getGroups('movies').catch(() => [] as LivingGroup[]),
    getGroups('dishes').catch(() => [] as LivingGroup[]),
    getGroups('photography').catch(() => [] as LivingGroup[]),
    getMusicEntries().catch(() => [] as MusicEntry[]),
    getMovieEntries().catch(() => [] as MovieEntry[]),
    getDishEntries().catch(() => [] as DishEntry[]),
    getPhotosWithGroups().catch(() => [] as Photo[]),
  ])

  const musicSections = grouped(musicEntries, musicGroups)
  const movieSections = grouped(movieEntries, movieGroups)
  const dishSections = grouped(dishEntries, dishGroups)
  const photoSections = grouped(photos, photoGroups)

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <header className="mb-16">
        <h1 className="text-5xl md:text-6xl font-black mb-4">LIVING LIFE</h1>
        <p className="text-base font-bold text-muted-foreground max-w-lg">
          A running log of what I&apos;ve been listening to, watching, cooking, and capturing.
        </p>
      </header>

      {/* Music */}
      {musicEntries.length > 0 && (
        <section className="mb-16">
          <SectionHeader>MUSIC</SectionHeader>
          {musicSections.map(({ group, items }) => (
            <div key={group?.id ?? 'ungrouped'} className="mb-8">
              {group && <GroupHeader name={group.name} />}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((entry) => <MusicCard key={entry.id} entry={entry} />)}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Movies */}
      {movieEntries.length > 0 && (
        <section className="mb-16">
          <SectionHeader>MOVIES</SectionHeader>
          {movieSections.map(({ group, items }) => (
            <div key={group?.id ?? 'ungrouped'} className="mb-8">
              {group && <GroupHeader name={group.name} />}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {items.map((entry) => <MovieCard key={entry.id} entry={entry} />)}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Dishes */}
      {dishEntries.length > 0 && (
        <section className="mb-16">
          <SectionHeader>FOOD</SectionHeader>
          {dishSections.map(({ group, items }) => (
            <div key={group?.id ?? 'ungrouped'} className="mb-8">
              {group && <GroupHeader name={group.name} />}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((entry) => <DishCard key={entry.id} entry={entry} />)}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Photography */}
      {photos.length > 0 && (
        <section className="mb-16">
          <SectionHeader>PHOTOGRAPHY</SectionHeader>
          {photoSections.map(({ group, items }) => (
            <div key={group?.id ?? 'ungrouped'} className="mb-8">
              {group && <GroupHeader name={group.name} />}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((photo) => (
                  <div key={photo.id} className="border-2 border-border shadow-brutal rounded-xl overflow-hidden" style={{ aspectRatio: `${photo.width}/${photo.height}` }}>
                    <img src={photo.url} alt={photo.title ?? ''} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
