'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            <span className="text-gray-700 dark:text-gray-300">Payment didn&apos;t go through</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Nothing was charged.
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              You can retry or use a different payment method.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/pricing" className="flex-1">
              <Button variant="primary" className="w-full">
                👉 Try again
              </Button>
            </Link>
            <Link href="/video" className="flex-1">
              <Button variant="secondary" className="w-full">
                Back to Video
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="ghost" className="w-full text-gray-500">
                Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

