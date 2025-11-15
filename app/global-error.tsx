'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-energy-hero dark:bg-energy-hero-dark p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Something went wrong!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="primary"
                onClick={reset}
              >
                Try again
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.href = '/'}
              >
                Go home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

