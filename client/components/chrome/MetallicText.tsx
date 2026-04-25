import React from 'react'
import { cn } from '@/lib/utils'

interface MetallicTextProps {
  children: React.ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
  /** @deprecated - variant is ignored, kept for API compatibility */
  variant?: string
}

export function MetallicText({
  children,
  className,
  as: Tag = 'span',
}: MetallicTextProps) {
  return (
    <Tag className={cn('font-black tracking-tight', className)}>
      {children}
    </Tag>
  )
}
