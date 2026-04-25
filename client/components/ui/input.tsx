import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full border-2 border-border bg-input text-foreground px-3 py-2 text-sm font-medium shadow-brutal-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-brutal focus-visible:-translate-x-px focus-visible:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
