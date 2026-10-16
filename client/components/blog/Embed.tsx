import React from 'react'
import { ExternalLink } from 'lucide-react'
import { toEmbedUrl } from '@/lib/blog/content'

interface EmbedProps {
  url?: string
  caption?: string
}

export function Embed({ url = '', caption }: EmbedProps) {
  const embed = toEmbedUrl(url)

  if (!embed) {
    return url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="not-prose my-6 flex items-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-3 text-sm font-semibold shadow-brutal hover:shadow-brutal-lg transition-shadow"
      >
        <ExternalLink size={14} />
        <span className="truncate">{url}</span>
      </a>
    ) : null
  }

  const isSpotifyTrack = embed.kind === 'audio' && /\/(track|episode)\//.test(embed.src)

  return (
    <figure className="not-prose my-8">
      <div
        className="overflow-hidden rounded-xl border-2 border-border bg-muted shadow-brutal"
        style={embed.kind === 'video' ? { aspectRatio: '16/9' } : { height: isSpotifyTrack ? 152 : 352 }}
      >
        <iframe
          src={embed.src}
          title={caption || 'Embedded media'}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
      {caption && <figcaption className="mt-3 text-center text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  )
}
