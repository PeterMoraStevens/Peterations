'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const LABELS: Record<string, string> = {
  admin: 'Dashboard',
  blog: 'Blog',
  new: 'New Post',
  'living-life': 'Living Life',
  photography: 'Photography',
  about: 'About',
  login: 'Login',
}

export function AdminBreadcrumb() {
  const pathname = usePathname()
  if (pathname === '/admin/login') return null

  const segments = pathname.split('/').filter(Boolean)

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm mb-6 text-muted-foreground flex-wrap">
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/')
        const isLast = i === segments.length - 1
        const isUUID = /^[0-9a-f-]{8,}$/i.test(seg)
        const label = LABELS[seg] ?? (isUUID ? 'Edit Post' : seg)

        return (
          <React.Fragment key={href}>
            {i > 0 && <ChevronRight size={13} className="shrink-0" />}
            {isLast ? (
              <span className="font-semibold text-foreground">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
