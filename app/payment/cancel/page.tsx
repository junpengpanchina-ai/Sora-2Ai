'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            <span className="text-gray-600 dark:text-gray-400">Payment Cancelled</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have cancelled the payment. No charges were made.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              If you need to recharge, please return to the homepage and try again.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="primary" className="w-full">
                Back to Home
              </Button>
            </Link>
            <Link href="/video" className="flex-1">
              <Button variant="secondary" className="w-full">
                Generate Video
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

