import React from 'react'
import { Film, Star } from 'lucide-react'
import { type MovieEntry } from '@/types'
import { formatDate } from '@/lib/utils'

function StarRating({ rating }: { rating: number }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<Star key={i} size={12} className="fill-[#ffe500] text-black" />)
    } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
      stars.push(<Star key={i} size={12} className="fill-[#ffe500]/50 text-black" />)
    } else {
      stars.push(<Star key={i} size={12} className="fill-transparent text-black" />)
    }
  }
  return <div className="flex gap-0.5">{stars}</div>
}

export function MovieCard({ entry }: { entry: MovieEntry }) {
  return (
    <div className="bg-white border-2 border-black shadow-brutal overflow-hidden hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all">
      {entry.posterUrl ? (
        <div className="h-48 border-b-2 border-black overflow-hidden">
          <img src={entry.posterUrl} alt={entry.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-48 border-b-2 border-black bg-[#e8e0d0] flex items-center justify-center">
          <Film size={32} className="opacity-30" />
        </div>
      )}
      <div className="p-4">
        <p className="font-black text-sm mb-1 leading-tight">{entry.title}</p>
        {entry.year && <p className="text-xs text-[#888] mb-2">{entry.year}</p>}
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={entry.rating} />
          <span className="text-xs font-bold">{entry.rating}/5</span>
        </div>
        {entry.review && (
          <p className="text-xs text-[#555] line-clamp-2 italic">&ldquo;{entry.review}&rdquo;</p>
        )}
        <time className="text-[10px] font-bold tracking-wider opacity-50 mt-2 block">
          {formatDate(entry.watchedAt)}
        </time>
      </div>
    </div>
  )
}
