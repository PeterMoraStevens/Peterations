import React from 'react'
import { cn } from '@/lib/utils'

interface ChromeCardProps {
  children: React.ReactNode
  className?: string
}

export function ChromeCard({ children, className }: ChromeCardProps) {
  return (
    <div
      className={cn(
        'bg-secondary border-2 border-black shadow-brutal p-4 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg',
        className
      )}
    >
      {children}
    </div>
  )
}
