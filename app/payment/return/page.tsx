'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import Link from 'next/link'

/**
 * Payment Return Page
 * This page is called when user returns from Stripe Payment Link
 * It checks for pending recharge_id and redirects to success page
 */
export default function PaymentReturnPage() {
  const router = useRouter()

  useEffect(() => {
    // Check for pending recharge_id in localStorage
    const pendingRechargeId = localStorage.getItem('pending_recharge_id')
    
    if (pendingRechargeId) {
      // Clear the stored recharge_id
      localStorage.removeItem('pending_recharge_id')
      // Redirect to success page with recharge_id
      router.push(`/payment/success?recharge_id=${pendingRechargeId}`)
    } else {
      // If no recharge_id, check URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const rechargeId = urlParams.get('recharge_id')
      
      if (rechargeId) {
        router.push(`/payment/success?recharge_id=${rechargeId}`)
      } else {
        // No recharge info, redirect to home
        router.push('/')
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            <span className="text-blue-600 dark:text-blue-400 animate-pulse">⏳</span>
            {' '}Processing Payment...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please wait while we verify your payment...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span>Redirecting...</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="secondary" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

