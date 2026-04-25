import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full border-2 border-border bg-input text-foreground px-3 py-2 text-sm font-medium shadow-brutal-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-brutal focus-visible:-translate-x-px focus-visible:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
