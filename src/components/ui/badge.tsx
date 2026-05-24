import * as React from 'react'
import { cn } from '@/lib/utils'

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'outline' }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      variant === 'default' && 'border transparent bg-slate-900 text-slate-50',
      variant === 'secondary' && 'border transparent bg-slate-100 text-slate-900',
      variant === 'outline' && 'border border-slate-200 text-slate-950',
      className
    )}
    {...props}
  />
))
Badge.displayName = 'Badge'

export { Badge }
