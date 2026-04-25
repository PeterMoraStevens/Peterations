import React from 'react'
import { Music } from 'lucide-react'
import { type MusicEntry } from '@/types'
import { formatDate } from '@/lib/utils'

export function MusicCard({ entry }: { entry: MusicEntry }) {
  return (
    <div className="flex gap-3 bg-white border-2 border-black shadow-brutal p-4 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all">
      {entry.artUrl ? (
        <img
          src={entry.artUrl}
          alt={entry.album}
          className="w-14 h-14 object-cover border-2 border-black shrink-0"
        />
      ) : (
        <div className="w-14 h-14 border-2 border-black bg-[#e8e0d0] flex items-center justify-center shrink-0">
          <Music size={20} className="opacity-40" />
        </div>
      )}
      <div className="min-w-0">
        <p className="font-black text-sm truncate">{entry.track}</p>
        <p className="text-xs text-[#555] truncate">{entry.artist}</p>
        <p className="text-xs text-[#888] truncate">{entry.album}</p>
        <time className="text-[10px] font-bold tracking-wider opacity-50 mt-1 block">
          {formatDate(entry.listenedAt)}
        </time>
      </div>
    </div>
  )
}
