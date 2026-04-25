import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 text-xs font-bold border-2 border-border transition-all',
  {
    variants: {
      variant: {
        default:   'bg-foreground text-background border-border',
        primary:   'bg-primary text-primary-foreground border-border shadow-brutal-sm',
        secondary: 'bg-secondary text-secondary-foreground border-border shadow-brutal-sm',
        accent:    'bg-accent text-accent-foreground border-border shadow-brutal-sm',
        outline:   'bg-card text-foreground border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
