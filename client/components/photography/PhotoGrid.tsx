'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Camera, Aperture } from 'lucide-react'
import { type Photo } from '@/types'

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState<number | null>(null)

  const close = useCallback(() => setSelected(null), [])
  const prev  = useCallback(() => setSelected((s) => (s !== null && s > 0 ? s - 1 : s)), [])
  const next  = useCallback(() => setSelected((s) => (s !== null && s < photos.length - 1 ? s + 1 : s)), [photos.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (selected === null) return
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, prev, next, close])

  const current = selected !== null ? photos[selected] : null
  const hasInfo = current && (current.title || current.description || current.camera || current.lens)

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="mb-4 break-inside-avoid border-2 border-border shadow-brutal overflow-hidden cursor-pointer group hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all"
            onClick={() => setSelected(i)}
          >
            <div className="relative">
              <img
                src={photo.url}
                alt={photo.title ?? 'Photo'}
                className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                style={{ aspectRatio: `${photo.width}/${photo.height}` }}
              />
              {photo.title && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-6 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-white text-xs font-bold truncate">{photo.title}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected !== null && current && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 z-20 p-2 border-2 border-white text-white hover:bg-white hover:text-black transition-colors"
            onClick={close}
          >
            <X size={18} />
          </button>

          {/* Prev */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 border-2 border-white text-white hover:bg-white hover:text-black transition-colors disabled:opacity-30"
            onClick={(e) => { e.stopPropagation(); prev() }}
            disabled={selected === 0}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Next */}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 border-2 border-white text-white hover:bg-white hover:text-black transition-colors disabled:opacity-30"
            onClick={(e) => { e.stopPropagation(); next() }}
            disabled={selected === photos.length - 1}
          >
            <ChevronRight size={20} />
          </button>

          {/* Image + info below */}
          <div
            className="flex flex-col max-w-[90vw] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.url}
              alt={current.title ?? 'Photo'}
              className="max-w-[90vw] w-auto border-2 border-white block shrink-0"
              style={{ maxHeight: 'calc(90vh - 120px)', objectFit: 'contain' }}
            />

            {hasInfo && (
              <div className="bg-black/90 border-2 border-t-0 border-white px-5 py-4 space-y-1.5 shrink-0">
                {current.title && (
                  <p className="text-white font-bold text-base leading-tight">{current.title}</p>
                )}
                {current.description && (
                  <p className="text-white/75 text-sm leading-relaxed">{current.description}</p>
                )}
                {(current.camera || current.lens) && (
                  <div className="flex flex-wrap gap-4 pt-1 border-t border-white/20">
                    {current.camera && (
                      <span className="flex items-center gap-1.5 text-white/55 text-xs">
                        <Camera size={11} />{current.camera}
                      </span>
                    )}
                    {current.lens && (
                      <span className="flex items-center gap-1.5 text-white/55 text-xs">
                        <Aperture size={11} />{current.lens}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Counter */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none">
            {selected + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  )
}
