'use client'

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/** Toolbar button that never steals the editor's selection. */
export function TB({
  title, onClick, disabled, active, children, className,
}: {
  title: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg px-1.5 text-xs font-semibold transition-colors shrink-0',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Divider() {
  return <span className="mx-1 h-5 w-0.5 shrink-0 rounded bg-border/20" />
}

/** Click-outside / Escape dismissable panel anchored under its trigger. */
export function Popover({
  open, onClose, children, className, align = 'left',
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div
      ref={ref}
      className={cn(
        'absolute top-full z-40 mt-2 rounded-xl border-2 border-border bg-card p-2 shadow-brutal',
        align === 'right' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border-2 border-border bg-card px-1.5 py-0.5 font-mono text-[11px] font-semibold shadow-brutal-sm">
      {children}
    </kbd>
  )
}
