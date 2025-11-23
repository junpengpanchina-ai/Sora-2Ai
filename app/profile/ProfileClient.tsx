'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  name?: string | null
  credits?: number
  avatar_url?: string | null
  google_id?: string
  created_at?: string
  last_login_at?: string
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

interface CreditAdjustmentRecord {
  id: string
  delta: number
  adjustment_type:
    | 'manual_increase'
    | 'manual_decrease'
    | 'recharge_correction'
    | 'recharge_refund'
    | 'consumption_refund'
    | 'other'
  reason: string | null
  created_at: string
  before_credits: number | null
  after_credits: number | null
  related_recharge_id: string | null
  related_consumption_id: string | null
}

interface ProfileClientProps {
  userProfile: UserProfile | null
}

export default function ProfileClient({ userProfile }: ProfileClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [credits, setCredits] = useState<number>(userProfile?.credits || 0)
  const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([])
  const [creditAdjustments, setCreditAdjustments] = useState<CreditAdjustmentRecord[]>([])
  const [loading, setLoading] = useState(true)

  const getAuthHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`,
      }
    }
    return {}
  }, [supabase])

  const fetchData = useCallback(async () => {
    if (!userProfile) return

    try {
      // Fetch current credits
      const headers = await getAuthHeaders()
      const statsResponse = await fetch('/api/stats', { headers })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success && statsData.credits !== undefined) {
          setCredits(statsData.credits)
        }
      }

      // Fetch recharge records
      const rechargeResponse = await fetch('/api/payment/recharge-records', { headers })
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

      // Fetch manual credit adjustments
      const adjustmentsResponse = await fetch('/api/payment/credit-adjustments', { headers })
      if (adjustmentsResponse.ok) {
        const adjustmentsData = await adjustmentsResponse.json()
        if (adjustmentsData.success) {
          setCreditAdjustments(adjustmentsData.adjustments || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [userProfile, getAuthHeaders])

  useEffect(() => {
    if (!userProfile) {
      setLoading(false)
      return
    }

    fetchData()
  }, [userProfile, fetchData])

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

  function getAdjustmentBadge(type: CreditAdjustmentRecord['adjustment_type']) {
    const variants: Record<CreditAdjustmentRecord['adjustment_type'], { label: string; className: string }> = {
      manual_increase: {
        label: 'Manual Increase',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      },
      manual_decrease: {
        label: 'Manual Decrease',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      },
      recharge_correction: {
        label: 'Recharge Correction',
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      },
      recharge_refund: {
        label: 'Recharge Refund',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      },
      consumption_refund: {
        label: 'Consumption Refund',
        className: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      },
      other: {
        label: 'Adjustment',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      },
    }
    const variant = variants[type] || variants.other
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  const paymentHistory = useMemo(() => {
    const rechargeEntries = rechargeRecords.map((record) => ({
      type: 'recharge' as const,
      id: record.id,
      created_at: record.created_at,
      amount: record.amount,
      credits: record.credits,
      status: record.status,
      payment_id: record.payment_id,
      before_credits: null as number | null,
      after_credits: null as number | null,
    }))

    const adjustmentEntries = creditAdjustments.map((adjustment) => ({
      type: 'adjustment' as const,
      id: adjustment.id,
      created_at: adjustment.created_at,
      amount: null,
      credits: adjustment.delta,
      status: adjustment.adjustment_type,
      payment_id: adjustment.reason || 'Admin adjustment',
      before_credits: adjustment.before_credits,
      after_credits: adjustment.after_credits,
    }))

    return [...rechargeEntries, ...adjustmentEntries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [rechargeRecords, creditAdjustments])

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              Please login to view your profile
            </p>
            <Link href="/login" className="block">
              <Button variant="primary" className="w-full">
                Login
              </Button>
            </Link>
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
    <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Profile
            </h1>
            <Link href="/">
              <Button variant="secondary" size="sm">
                Back to Home
              </Button>
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            View your account information and payment history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProfile.avatar_url && (
                <div className="flex justify-center">
                  <Image
                    src={userProfile.avatar_url}
                    alt={userProfile.name || 'User avatar'}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-full object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userProfile.name || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userProfile.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                  {userProfile.id}
                </p>
              </div>
              {userProfile.created_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(userProfile.created_at)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Credits Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Current Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="mb-2 text-5xl font-bold text-energy-water dark:text-energy-soft">
                  {loading ? '...' : credits}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Available Credits
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Each video generation consumes 10 credits
                </p>
                <div className="mt-4 space-y-2">
                  <Link href="/" className="block">
                    <Button variant="primary" className="w-full">
                      Buy Credits
                    </Button>
                  </Link>
                  <Link href="/video" className="block">
                    <Button variant="secondary" className="w-full">
                      Generate Video
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Recharges</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {rechargeRecords.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${rechargeRecords.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Credits</span>
                <span className="text-lg font-semibold text-energy-water dark:text-energy-soft">
                  {rechargeRecords.reduce((sum, r) => sum + r.credits, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {rechargeRecords.filter(r => r.status === 'completed').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recharge Records Table */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payment History</CardTitle>
              <Badge className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft">
                {paymentHistory.length} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-energy-water"></div>
                <p className="mt-2 text-sm text-gray-500">Loading...</p>
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No payment records found</p>
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
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Type</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Credits</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {formatDate(entry.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {entry.type === 'recharge' ? 'Recharge' : 'Adjustment'}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                          {entry.type === 'recharge' ? `$${entry.amount}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-energy-water dark:text-energy-soft">
                          <span
                            className={
                              entry.credits >= 0
                                ? 'text-energy-water dark:text-energy-soft'
                                : 'text-red-600 dark:text-red-400'
                            }
                          >
                            {entry.credits > 0 ? `+${entry.credits}` : entry.credits}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {entry.type === 'recharge'
                            ? getStatusBadge(entry.status)
                            : getAdjustmentBadge(entry.status)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {entry.type === 'recharge'
                              ? entry.payment_id || 'N/A'
                              : entry.payment_id || 'Admin adjustment'}
                          </p>
                          {entry.type === 'adjustment' &&
                            entry.before_credits !== null &&
                            entry.after_credits !== null && (
                              <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                {entry.before_credits} → {entry.after_credits}
                              </p>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

