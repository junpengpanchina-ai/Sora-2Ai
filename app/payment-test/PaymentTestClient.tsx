'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import Link from 'next/link'
import LoginButton from '@/components/LoginButton'

interface UserProfile {
  id: string
  email: string
  name?: string | null
  credits?: number
}

interface RechargeRecord {
  id: string
  user_id: string
  amount: number
  credits: number
  payment_method: string
  payment_id: string | null
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  completed_at: string | null
}

interface PaymentTestClientProps {
  userProfile: UserProfile | null
}

export default function PaymentTestClient({ userProfile }: PaymentTestClientProps) {
  const [credits, setCredits] = useState<number>(userProfile?.credits || 0)
  const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchData = useCallback(async () => {
    if (!userProfile) return

    try {
      // Fetch current credits
      const statsResponse = await fetch('/api/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success && statsData.credits !== undefined) {
          setCredits(statsData.credits)
        }
      }

      // Fetch recharge records
      const rechargeResponse = await fetch('/api/payment/recharge-records')
      if (rechargeResponse.ok) {
        const rechargeData = await rechargeResponse.json()
        if (rechargeData.success) {
          setRechargeRecords(rechargeData.records || rechargeData.recharge_records || [])
          // Update credits from recharge data if available
          if (rechargeData.user_credits !== undefined) {
            setCredits(rechargeData.user_credits)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [userProfile])

  useEffect(() => {
    if (!userProfile) {
      setLoading(false)
      return
    }

    fetchData()
    
    // Auto refresh every 5 seconds if enabled
    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(fetchData, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [userProfile, autoRefresh, fetchData])

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
    }
    const variant = variants[status] || variants.pending
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Payment Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              Please login to view payment and credit information
            </p>
            <LoginButton />
            <div className="mt-4 text-center">
              <Link href="/">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Payment Test Dashboard
            </h1>
            <Link href="/">
              <Button variant="secondary" size="sm">
                Back to Home
              </Button>
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor payment status and credit balance in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Credits Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Current Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  {loading ? '...' : credits}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Available Credits
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="autoRefresh" className="text-sm text-gray-600 dark:text-gray-400">
                    Auto Refresh (5s)
                  </label>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchData}
                  className="mt-2 w-full"
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh Now'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userProfile.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userProfile.name || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                  {userProfile.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="https://buy.stripe.com/dRm4gzaIiaIrgJJ6eA0kE04"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="primary" className="w-full">
                  Test Payment Link
                </Button>
              </a>
              <Link href="/" className="block">
                <Button variant="secondary" className="w-full">
                  Buy Plan
                </Button>
              </Link>
              <Link href="/video" className="block">
                <Button variant="secondary" className="w-full">
                  Generate Video
                </Button>
              </Link>
              <Link href="/api/debug/video-records" className="block" target="_blank">
                <Button variant="ghost" className="w-full">
                  View All Records
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full"
                onClick={async () => {
                  setSyncing(true)
                  try {
                    const response = await fetch('/api/payment/sync-payments', {
                      method: 'POST',
                    })
                    const data = await response.json()
                    if (data.success) {
                      alert(`Synced ${data.synced_payments?.length || 0} payment(s)`)
                      fetchData() // Refresh data
                    } else {
                      alert(`Sync failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Failed to sync payments:', error)
                    alert('Failed to sync payments')
                  } finally {
                    setSyncing(false)
                  }
                }}
                disabled={syncing}
              >
                {syncing ? 'Syncing...' : 'Sync Payments'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recharge Records Table */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recharge Records</CardTitle>
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                {rechargeRecords.length} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading...</p>
              </div>
            ) : rechargeRecords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No recharge records found</p>
                <Link href="/" className="mt-4 inline-block">
                  <Button variant="primary" size="sm">
                    Make First Purchase
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Credits</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Payment ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rechargeRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {formatDate(record.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                          ${record.amount}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          +{record.credits}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {record.payment_id || 'N/A'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Summary */}
        {rechargeRecords.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Recharges</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {rechargeRecords.length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${rechargeRecords.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Credits</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {rechargeRecords.reduce((sum, r) => sum + r.credits, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {rechargeRecords.filter(r => r.status === 'completed').length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

