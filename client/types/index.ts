export interface BlogPost {
  id?: string
  slug: string
  title: string
  excerpt: string
  content: string
  publishedAt: string
  createdAt?: string
  updatedAt?: string
  readingTime?: number
  tags: string[]
  coverImage?: string
  coverImagePath?: string
  imagePaths: string[]
  published: boolean
  author?: string
}

export type LivingContentType = 'music' | 'movies' | 'dishes' | 'photography'

export interface LivingGroup {
  id: string
  type: LivingContentType
  name: string
  order: number
}

export interface MusicEntry {
  id: string
  groupId?: string
  artist: string
  track: string
  album: string
  listenedAt: string
  spotifyUrl?: string
  artUrl?: string
  order: number
}

export interface MovieEntry {
  id: string
  groupId?: string
  title: string
  rating: number
  watchedAt: string
  letterboxdUrl?: string
  posterUrl?: string
  posterPath?: string
  review?: string
  year?: number
  order: number
}

export interface DishEntry {
  id: string
  groupId?: string
  name: string
  cookedAt: string
  imageUrl?: string
  imagePath?: string
  notes?: string
  cuisine?: string
  order: number
}

export interface Photo {
  id: string
  groupId?: string
  title?: string
  description?: string
  camera?: string
  lens?: string
  takenAt?: string
  location?: string
  storagePath: string
  url: string
  width: number
  height: number
  order: number
}

export interface Project {
  id: string
  title: string
  description: string
  url?: string
  repoUrl?: string
  tags: string[]
  imageUrl?: string
  imagePath?: string
  featured: boolean
  order: number
}

export interface AboutLink {
  id: string
  label: string
  url: string
  order: number
}

export interface AboutProfile {
  name: string
  bio: string
  photoUrl?: string
  photoPath?: string
  skills: string[]
}

export interface GuestbookEntry {
  id: string
  name: string
  message: string
  approved: boolean
  reply?: string
  repliedAt?: string
  createdAt: string
}

export interface TimelineEntry {
  id: string
  role: string
  company: string
  startDate: string
  endDate?: string
  description: string
  bullets: string[]
  skills: string[]
  order: number
  current: boolean
}
