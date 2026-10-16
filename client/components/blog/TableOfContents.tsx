'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Heading { depth: 2 | 3; text: string; id: string }

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el)
    if (!els.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  return (
    <nav aria-label="On this page" className="rounded-2xl border-2 border-border bg-card p-4 shadow-brutal">
      <p className="mb-3 text-xs font-bold tracking-wide text-muted-foreground">On this page</p>
      <ul className="space-y-1 text-sm">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                'block rounded-lg px-2 py-1 leading-snug transition-colors hover:bg-muted',
                h.depth === 3 && 'ml-3 text-[13px]',
                active === h.id ? 'bg-primary font-semibold' : 'text-muted-foreground',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
