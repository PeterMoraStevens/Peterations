import React from 'react'
import { UtensilsCrossed } from 'lucide-react'
import { type DishEntry } from '@/types'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function DishCard({ entry }: { entry: DishEntry }) {
  return (
    <div className="bg-white border-2 border-black shadow-brutal overflow-hidden hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all">
      {entry.imageUrl ? (
        <div className="h-40 border-b-2 border-black overflow-hidden">
          <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-40 border-b-2 border-black bg-[#fff8e0] flex items-center justify-center">
          <UtensilsCrossed size={32} className="opacity-30" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-black text-sm leading-tight">{entry.name}</p>
          {entry.cuisine && <Badge variant="secondary" className="text-[10px] shrink-0">{entry.cuisine}</Badge>}
        </div>
        {entry.notes && <p className="text-xs text-[#555] mt-1 line-clamp-2">{entry.notes}</p>}
        <time className="text-[10px] font-bold tracking-wider opacity-50 mt-2 block">
          {formatDate(entry.cookedAt)}
        </time>
      </div>
    </div>
  )
}
