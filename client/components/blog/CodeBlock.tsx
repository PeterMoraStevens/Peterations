import React from 'react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  return (
    <div className={cn('my-6 border-2 border-border shadow-brutal overflow-hidden', className)}>
      {/* Window title bar */}
      <div className="bg-muted border-b-2 border-border px-3 py-1.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 border-2 border-border bg-foreground/20" />
          <div className="w-3 h-3 border-2 border-border bg-foreground/20" />
          <div className="w-3 h-3 border-2 border-border bg-foreground/20" />
        </div>
        <span className="text-xs font-black tracking-widest opacity-60 ml-1">CODE</span>
      </div>
      <pre className={cn('overflow-x-auto p-4 text-sm m-0 bg-[#1e1e1e] text-[#d4d4d4]')}>
        {children}
      </pre>
    </div>
  )
}
