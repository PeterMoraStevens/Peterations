'use client'

import { useState, useMemo } from 'react'
import { PostCard } from './PostCard'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import type { BlogPost } from '@/types'

export function BlogList({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [posts])

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchesTag = !tag || p.tags.includes(tag)
      const matchesQuery = !query.trim() || p.title.toLowerCase().includes(query.toLowerCase())
      return matchesTag && matchesQuery
    })
  }, [posts, query, tag])

  const isFiltering = !!query.trim() || !!tag

  return (
    <div>
      {/* Search + tag filters */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            className="pl-9 pr-9"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(tag === t ? null : t)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border-2 transition-all ${
                  tag === t
                    ? 'bg-foreground text-background border-border shadow-brutal-sm'
                    : 'bg-card border-border shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="border-2 border-border shadow-brutal rounded-2xl p-12 text-center bg-card">
          <p className="font-bold text-xl mb-2">No posts found.</p>
          <p className="text-sm text-muted-foreground">
            {isFiltering ? 'Try a different search or filter.' : 'Check back soon.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
