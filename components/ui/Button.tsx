'use client'

import React from 'react'
import { cn } from '@/lib/utils'

const baseStyles =
  'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed'

const variants = {
  primary:
    'bg-energy-water text-white hover:bg-energy-water-deep dark:bg-energy-water dark:hover:bg-energy-water-deep',
  secondary:
    'bg-white text-energy-deep shadow-sm ring-1 ring-inset ring-energy-gold-outline hover:bg-energy-water-surface dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700',
  danger:
    'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
  ghost:
    'text-energy-deep hover:bg-energy-water-surface dark:text-gray-300 dark:hover:bg-gray-800',
  outline:
    'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700',
} as const

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
} as const

type ButtonVariant = keyof typeof variants
type ButtonSize = keyof typeof sizes

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button

