'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default' | 'secondary'
  children: React.ReactNode
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      success: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
      error: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
      warning: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
      info: 'text-energy-water bg-energy-water-surface dark:text-energy-soft dark:bg-energy-water-muted',
      default: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800',
      secondary:
        'text-energy-deep bg-energy-water-surface ring-1 ring-energy-gold-outline dark:text-white dark:bg-gray-800 dark:ring-gray-600',
    } as const
    
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge

