'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'

type PaymentStatus = 'checking' | 'processing' | 'completed' | 'failed' | 'error'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const rechargeId = searchParams.get('recharge_id')
  const [status, setStatus] = useState<PaymentStatus>('checking')
  const [credits, setCredits] = useState<number | null>(null)
  const [rechargeInfo, setRechargeInfo] = useState<{
    amount?: number
    credits?: number
    status?: string
  } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    // Support both session_id (Checkout Session) and recharge_id (Payment Link)
    if (!sessionId && !rechargeId) {
      setStatus('error')
      setErrorMessage('Missing payment information')
      return
    }

    // If we have recharge_id (Payment Link), check recharge status directly
    if (rechargeId && !sessionId) {
      checkRechargeStatus()
      return
    }

    // Check payment status
    async function checkPaymentStatus() {
      try {
        const response = await fetch(`/api/payment/check-session?session_id=${sessionId}`)
        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setErrorMessage(data.error || 'Failed to check payment status')
          return
        }

        if (!data.success) {
          setStatus('failed')
          setErrorMessage(data.message || 'Payment not completed')
          return
        }

        // Update recharge information
        setRechargeInfo({
          amount: data.recharge_record?.amount,
          credits: data.recharge_record?.credits,
          status: data.recharge_record?.status,
        })

        // Update credits
        setCredits(data.user_credits)

        // Update UI status based on recharge record status
        if (data.recharge_status === 'completed') {
          setStatus('completed')
        } else if (data.recharge_status === 'pending') {
          setStatus('processing')
          // If still processing, continue polling (max 30 times, 2 seconds each, 60 seconds total)
          if (pollCount < 30) {
            setTimeout(() => {
              setPollCount(prev => prev + 1)
              checkPaymentStatus()
            }, 2000)
          } else {
            // Timeout, but payment succeeded, webhook may be delayed
            setStatus('completed')
            setErrorMessage('Payment successful, but credits may be delayed. Please refresh the page later.')
          }
        } else {
          setStatus('error')
          setErrorMessage('Recharge status abnormal')
        }
      } catch (error) {
        console.error('Failed to check payment status:', error)
        setStatus('error')
        setErrorMessage('Error occurred while checking payment status')
      }
    }

    if (sessionId) {
      checkPaymentStatus()
    }
  }, [sessionId, rechargeId, pollCount])

  // Check recharge status directly (for Payment Link)
  async function checkRechargeStatus() {
    try {
      const response = await fetch(`/api/payment/check-recharge?recharge_id=${rechargeId}`)
      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setErrorMessage(data.error || 'Failed to check recharge status')
        return
      }

      if (data.success) {
        setRechargeInfo({
          amount: data.recharge_record?.amount,
          credits: data.recharge_record?.credits,
          status: data.recharge_record?.status,
        })
        setCredits(data.user_credits)

        if (data.recharge_status === 'completed') {
          setStatus('completed')
        } else if (data.recharge_status === 'pending') {
          setStatus('processing')
          // Poll for status update (max 30 times, 2 seconds each)
          if (pollCount < 30) {
            setTimeout(() => {
              setPollCount(prev => prev + 1)
              checkRechargeStatus()
            }, 2000)
          } else {
            setStatus('completed')
            setErrorMessage('Payment successful, but credits may be delayed. Please refresh the page later.')
          }
        } else {
          setStatus('error')
          setErrorMessage('Recharge status abnormal')
        }
      }
    } catch (error) {
      console.error('Failed to check recharge status:', error)
      setStatus('error')
      setErrorMessage('Error occurred while checking recharge status')
    }
  }

  // Manually refresh status
  const handleRefresh = () => {
    setPollCount(0)
    setStatus('checking')
    setErrorMessage(null)
    // Re-check based on available parameters
    if (rechargeId && !sessionId) {
      checkRechargeStatus()
    } else if (sessionId) {
      checkPaymentStatus()
    }
  }

  // Auto-refresh credits when status changes to completed
  useEffect(() => {
    if (status === 'completed' && credits !== null) {
      // Trigger a page refresh to update credits in navbar
      // Or dispatch a custom event that the homepage can listen to
      window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits } }))
    }
  }, [status, credits])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {status === 'completed' && (
              <span className="text-green-600 dark:text-green-400">✓</span>
            )}
            {status === 'processing' && (
              <span className="text-yellow-600 dark:text-yellow-400 animate-pulse">⏳</span>
            )}
            {status === 'checking' && (
              <span className="text-blue-600 dark:text-blue-400 animate-pulse">⏳</span>
            )}
            {status === 'failed' && (
              <span className="text-red-600 dark:text-red-400">✗</span>
            )}
            {status === 'error' && (
              <span className="text-red-600 dark:text-red-400">⚠</span>
            )}
            {' '}
            {status === 'completed' && 'Payment Successful'}
            {status === 'processing' && 'Processing...'}
            {status === 'checking' && 'Verifying...'}
            {status === 'failed' && 'Payment Failed'}
            {status === 'error' && 'Error Occurred'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {status === 'completed' && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your recharge has been successfully processed, credits have been added to your account.
              </p>
            )}
            {status === 'processing' && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Payment confirmed, processing credits, please wait...
              </p>
            )}
            {status === 'checking' && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Verifying payment status...
              </p>
            )}
            {(status === 'failed' || status === 'error') && errorMessage && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              </div>
            )}

            {rechargeInfo && (
              <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Recharge Information</p>
                <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                  ${rechargeInfo.amount} → {rechargeInfo.credits} Credits
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Status: {rechargeInfo.status === 'completed' ? 'Completed' : 
                         rechargeInfo.status === 'pending' ? 'Processing' : 
                         rechargeInfo.status || 'Unknown'}
                </p>
              </div>
            )}

            {credits !== null && (
              <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Credits Balance</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {credits} Credits
                </p>
              </div>
            )}

            {sessionId && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                Order ID: {sessionId.substring(0, 20)}...
              </p>
            )}

            {status === 'processing' && (
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span>Waiting for credits... ({pollCount}/30)</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            {(status === 'error' || status === 'processing') && (
              <Button 
                variant="default" 
                className="flex-1"
                onClick={handleRefresh}
              >
                Refresh Status
              </Button>
            )}
            <Link href="/" className="flex-1">
              <Button variant="primary" className="w-full">
                Back to Home
              </Button>
            </Link>
            {status === 'completed' && (
              <Link href="/video" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Generate Video
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

