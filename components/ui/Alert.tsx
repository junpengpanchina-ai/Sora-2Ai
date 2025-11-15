'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  children: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, children, ...props }, ref) => {
    const variants = {
      success: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      error: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      warning: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      info: 'bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft',
    }
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'rounded-lg p-4 text-sm',
          variants[variant],
          className
        )}
        {...props}
      >
        {title && (
          <p className="font-semibold mb-1">{title}</p>
        )}
        <div>{children}</div>
      </div>
    )
  }
)

Alert.displayName = 'Alert'

export default Alert

