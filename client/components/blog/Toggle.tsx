import React from 'react'
import { ChevronRight } from 'lucide-react'

interface ToggleProps {
  summary?: string
  open?: boolean | string
  children?: React.ReactNode
}

export function Toggle({ summary, open, children }: ToggleProps) {
  return (
    <details
      open={open === true || open === 'true'}
      className="group not-prose my-6 rounded-xl border-2 border-border bg-card shadow-brutal overflow-hidden"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold select-none hover:bg-muted transition-colors [&::-webkit-details-marker]:hidden">
        <ChevronRight size={16} className="shrink-0 transition-transform group-open:rotate-90" />
        {summary || 'Details'}
      </summary>
      <div className="prose prose-brutal max-w-none border-t-2 border-border px-5 py-4 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {children}
      </div>
    </details>
  )
}
