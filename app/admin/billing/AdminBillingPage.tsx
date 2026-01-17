'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Textarea,
} from '@/components/ui'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface AdminBillingPageProps {
  adminUser: {
    id: string
    username: string
    is_super_admin: boolean
  }
}

interface RechargeRecord {
  id: string
  user_id: string
  amount: number
  credits: number
  payment_method: string | null
  payment_id: string | null
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
  created_at: string
  completed_at: string | null
  admin_notes: string | null
  user_email?: string | null
  user_name?: string | null
}

interface ConsumptionRecord {
  id: string
  user_id: string
  video_task_id: string | null
  credits: number
  description: string | null
  status: 'completed' | 'refunded'
  created_at: string
  refunded_at: string | null
  user_email?: string | null
  user_name?: string | null
}

interface CreditAdjustment {
  id: string
  user_id: string
  admin_user_id: string | null
  delta: number
  adjustment_type:
    | 'manual_increase'
    | 'manual_decrease'
    | 'recharge_correction'
    | 'recharge_refund'
    | 'consumption_refund'
    | 'other'
  reason: string | null
  related_recharge_id: string | null
  related_consumption_id: string | null
  before_credits: number | null
  after_credits: number | null
  created_at: string
  user_email: string | null
  user_name: string | null
  admin_email: string | null
  admin_name: string | null
  latest_credits: number | null
}

type BannerState = { type: 'success' | 'error' | 'info'; text: string } | null

type BillingTabType = 'payments' | 'usage' | 'adjustments'

const STATUS_BADGE_VARIANTS: Record<
  string,
  { label: string; className: string }
> = {
  completed: {
    label: '已完成',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  pending: {
    label: '待处理',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  failed: {
    label: '失败',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  cancelled: {
    label: '已取消',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  },
  refunded: {
    label: '已退款',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
}

const ADJUSTMENT_TYPE_LABELS: Record<CreditAdjustment['adjustment_type'], string> = {
  manual_increase: '手动增加',
  manual_decrease: '手动扣减',
  recharge_correction: '充值补发',
  recharge_refund: '充值退款扣减',
  consumption_refund: '消费退款',
  other: '其他',
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function getStatusBadge(status: string) {
  const variant = STATUS_BADGE_VARIANTS[status] ?? STATUS_BADGE_VARIANTS.pending
  return (
    <Badge className={variant.className}>
      {variant.label}
    </Badge>
  )
}

export default function AdminBillingPage({ adminUser }: AdminBillingPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams?.get('tab') || 'payments'
  
  const [activeTab, setActiveTab] = useState<BillingTabType>(
    (tabFromUrl as BillingTabType) || 'payments'
  )
  
  const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([])
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>([])
  const [creditAdjustments, setCreditAdjustments] = useState<CreditAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustmentsLoading, setAdjustmentsLoading] = useState(true)
  const [banner, setBanner] = useState<BannerState>(null)
  const bannerTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [rechargeActionId, setRechargeActionId] = useState<string | null>(null)
  const [consumptionActionId, setConsumptionActionId] = useState<string | null>(null)
  const [adjustmentActionId, setAdjustmentActionId] = useState<string | null>(null)
  const [adjustSubmitting, setAdjustSubmitting] = useState(false)
  
  const [adjustForm, setAdjustForm] = useState({
    identifierType: 'email' as 'email' | 'userId',
    identifier: '',
    amount: '',
    adjustmentType: 'manual_increase' as CreditAdjustment['adjustment_type'],
    reason: '',
    relatedRechargeId: '',
    relatedConsumptionId: '',
    creditType: 'permanent' as 'permanent' | 'bonus',
    bonusExpiresDays: '',
  })

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl as BillingTabType)
    }
  }, [tabFromUrl, activeTab])

  const showBanner = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setBanner({ type, text })
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current)
    }
    bannerTimeoutRef.current = setTimeout(() => {
      setBanner(null)
      bannerTimeoutRef.current = null
    }, 4000)
  }, [])

  const fetchRecharges = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/recharges')
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error ?? '获取充值记录失败')
      }
      setRechargeRecords(data.records ?? [])
    } catch (error) {
      console.error('获取充值记录失败:', error)
      showBanner('error', error instanceof Error ? error.message : '获取充值记录失败')
    }
  }, [showBanner])

  const fetchConsumption = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/consumption')
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error ?? '获取消耗记录失败')
      }
      setConsumptionRecords(data.records ?? [])
    } catch (error) {
      console.error('获取消耗记录失败:', error)
      showBanner('error', error instanceof Error ? error.message : '获取消耗记录失败')
    }
  }, [showBanner])

  const fetchAdjustments = useCallback(async () => {
    setAdjustmentsLoading(true)
    try {
      const response = await fetch('/api/admin/credits')
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error ?? '获取积分调整记录失败')
      }
      setCreditAdjustments(data.adjustments ?? [])
    } catch (error) {
      console.error('获取积分调整记录失败:', error)
      showBanner('error', error instanceof Error ? error.message : '获取积分调整记录失败')
    } finally {
      setAdjustmentsLoading(false)
    }
  }, [showBanner])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchRecharges(), fetchConsumption(), fetchAdjustments()]).finally(() => {
      setLoading(false)
    })
  }, [fetchRecharges, fetchConsumption, fetchAdjustments])

  // 实时订阅
  const supabaseClient = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      return createSupabaseClient()
    } catch (error) {
      console.error('[AdminBillingPage] 创建 Supabase 客户端失败:', error)
      return null
    }
  }, [])

  useEffect(() => {
    if (!supabaseClient) return

    const channel = supabaseClient
      .channel('admin-billing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recharge_records' }, fetchRecharges)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumption_records' }, fetchConsumption)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_adjustments' }, fetchAdjustments)

    channel.subscribe()

    return () => {
      if (supabaseClient) {
        supabaseClient.removeChannel(channel)
      }
    }
  }, [supabaseClient, fetchRecharges, fetchConsumption, fetchAdjustments])

  // 处理函数 (充值/消耗/调整)
  const handleRechargeStatusChange = useCallback(async (rechargeId: string, status: RechargeRecord['status']) => {
    setRechargeActionId(rechargeId)
    try {
      const response = await fetch(`/api/admin/recharges/${rechargeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error ?? '更新充值记录失败')
      }
      await fetchRecharges()
      await fetchAdjustments()
      showBanner('success', '充值记录已更新')
    } catch (error) {
      showBanner('error', error instanceof Error ? error.message : '更新充值记录失败')
    } finally {
      setRechargeActionId(null)
    }
  }, [fetchRecharges, fetchAdjustments, showBanner])

  const handleConsumptionRefund = useCallback(async (consumptionId: string) => {
    setConsumptionActionId(consumptionId)
    try {
      const response = await fetch(`/api/admin/consumption/${consumptionId}/refund`, {
        method: 'POST',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error ?? '退款失败')
      }
      await fetchConsumption()
      await fetchAdjustments()
      showBanner('success', '积分已返还给用户')
    } catch (error) {
      showBanner('error', error instanceof Error ? error.message : '退款失败')
    } finally {
      setConsumptionActionId(null)
    }
  }, [fetchConsumption, fetchAdjustments, showBanner])

  const handleAdjustmentSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!adjustForm.identifier.trim() || !adjustForm.amount.trim()) {
        showBanner('error', '请填写用户标识和积分数量')
        return
      }

      const parsedAmount = Number(adjustForm.amount)
      if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
        showBanner('error', '积分数量必须是有效的非零数字')
        return
      }

      const baseAmount = Math.trunc(parsedAmount)
      let delta = baseAmount
      if (['manual_increase', 'recharge_correction', 'consumption_refund'].includes(adjustForm.adjustmentType)) {
        delta = Math.abs(baseAmount)
      } else if (['manual_decrease', 'recharge_refund'].includes(adjustForm.adjustmentType)) {
        delta = -Math.abs(baseAmount)
      }

      setAdjustSubmitting(true)
      try {
        const payload: Record<string, unknown> = {
          delta,
          adjustmentType: adjustForm.adjustmentType,
          reason: adjustForm.reason.trim() || null,
          creditType: adjustForm.creditType,
        }

        if (adjustForm.identifierType === 'email') {
          payload.userEmail = adjustForm.identifier.trim()
        } else {
          payload.userId = adjustForm.identifier.trim()
        }

        if (adjustForm.relatedRechargeId.trim()) {
          payload.relatedRechargeId = adjustForm.relatedRechargeId.trim()
        }
        if (adjustForm.relatedConsumptionId.trim()) {
          payload.relatedConsumptionId = adjustForm.relatedConsumptionId.trim()
        }
        if (adjustForm.creditType === 'bonus' && adjustForm.bonusExpiresDays.trim()) {
          const expiresDays = Number(adjustForm.bonusExpiresDays)
          if (Number.isFinite(expiresDays) && expiresDays > 0) {
            payload.bonusExpiresDays = Math.trunc(expiresDays)
          }
        }

        const response = await fetch('/api/admin/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          const errorMessage = [
            typeof data.error === 'string' ? data.error : '',
            typeof data.details === 'string' ? data.details : '',
          ]
            .map((part) => part.trim())
            .filter(Boolean)
            .join('：')
          throw new Error(errorMessage || '积分调整失败')
        }

        showBanner('success', '积分调整已完成')
        setAdjustForm({
          identifierType: 'email',
          identifier: '',
          amount: '',
          adjustmentType: 'manual_increase',
          reason: '',
          relatedRechargeId: '',
          relatedConsumptionId: '',
          creditType: 'permanent',
          bonusExpiresDays: '',
        })
        await fetchAdjustments()
      } catch (error) {
        console.error('积分调整失败:', error)
        showBanner('error', error instanceof Error ? error.message : '积分调整失败')
      } finally {
        setAdjustSubmitting(false)
      }
    },
    [adjustForm, fetchAdjustments, showBanner]
  )

  return (
    <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">管理员后台</h1>
              </Link>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'payments', label: '充值记录' },
                  { value: 'usage', label: '消耗记录' },
                  { value: 'adjustments', label: '积分调整' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      const newTab = tab.value as BillingTabType
                      setActiveTab(newTab)
                      router.push(`/admin/billing?tab=${newTab}`, { scroll: false })
                    }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.value
                        ? 'bg-energy-water text-white'
                        : 'text-gray-700 hover:bg-energy-water-surface dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end text-xs text-gray-500 dark:text-gray-400">
                <span>当前管理员：{adminUser.username}</span>
                {adminUser.is_super_admin && <span className="text-energy-water">超级管理员</span>}
              </div>
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  返回总览
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {banner && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              banner.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : banner.type === 'info'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {banner.text}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">充值记录</h2>
              <Badge className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft">
                共 {rechargeRecords.length} 条
              </Badge>
            </div>
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="mr-3 h-6 w-6 animate-spin rounded-full border-b-2 border-energy-water"></div>
                    加载中...
                  </div>
                ) : rechargeRecords.length === 0 ? (
                  <p className="py-8 text-center text-gray-500 dark:text-gray-400">暂无充值记录</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="py-3 px-4 text-left">时间</th>
                          <th className="py-3 px-4 text-left">用户邮箱</th>
                          <th className="py-3 px-4 text-left">金额</th>
                          <th className="py-3 px-4 text-left">积分</th>
                          <th className="py-3 px-4 text-left">状态</th>
                          <th className="py-3 px-4 text-left">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rechargeRecords.map((record) => {
                          const isProcessing = rechargeActionId === record.id
                          return (
                            <tr
                              key={record.id}
                              className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                            >
                              <td className="py-3 px-4">{formatDate(record.created_at)}</td>
                              <td className="py-3 px-4">{record.user_email || 'N/A'}</td>
                              <td className="py-3 px-4 font-medium">{formatCurrency(record.amount)}</td>
                              <td className="py-3 px-4 text-energy-water dark:text-energy-soft">
                                +{record.credits}
                              </td>
                              <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-2">
                                  {record.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleRechargeStatusChange(record.id, 'completed')}
                                      disabled={isProcessing}
                                    >
                                      {isProcessing ? '处理中...' : '标记完成'}
                                    </Button>
                                  )}
                                  {record.status === 'completed' && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleRechargeStatusChange(record.id, 'refunded')}
                                      disabled={isProcessing}
                                    >
                                      {isProcessing ? '处理中...' : '退款扣减'}
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">消耗记录</h2>
              <Badge className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft">
                共 {consumptionRecords.length} 条
              </Badge>
            </div>
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="mr-3 h-6 w-6 animate-spin rounded-full border-b-2 border-energy-water"></div>
                    加载中...
                  </div>
                ) : consumptionRecords.length === 0 ? (
                  <p className="py-8 text-center text-gray-500 dark:text-gray-400">暂无消耗记录</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="py-3 px-4 text-left">时间</th>
                          <th className="py-3 px-4 text-left">用户邮箱</th>
                          <th className="py-3 px-4 text-left">消耗积分</th>
                          <th className="py-3 px-4 text-left">描述</th>
                          <th className="py-3 px-4 text-left">状态</th>
                          <th className="py-3 px-4 text-left">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consumptionRecords.map((record) => {
                          const isProcessing = consumptionActionId === record.id
                          return (
                            <tr
                              key={record.id}
                              className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                            >
                              <td className="py-3 px-4">{formatDate(record.created_at)}</td>
                              <td className="py-3 px-4">{record.user_email || 'N/A'}</td>
                              <td className="py-3 px-4 font-medium text-red-600 dark:text-red-400">
                                -{record.credits}
                              </td>
                              <td className="py-3 px-4">{record.description || '无'}</td>
                              <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                              <td className="py-3 px-4">
                                {record.status === 'completed' ? (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleConsumptionRefund(record.id)}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? '处理中...' : '退款返还'}
                                  </Button>
                                ) : (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">已退款</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'adjustments' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">积分调整</h2>
            <Card>
              <CardHeader>
                <CardTitle>手动调整用户积分</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAdjustmentSubmit}>
                  <div className="md:col-span-1">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      用户标识
                    </label>
                    <div className="mt-2 flex gap-2">
                      <select
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        value={adjustForm.identifierType}
                        onChange={(event) =>
                          setAdjustForm((prev) => ({
                            ...prev,
                            identifierType: event.target.value as 'email' | 'userId',
                            identifier: '',
                          }))
                        }
                      >
                        <option value="email">邮箱</option>
                        <option value="userId">用户ID</option>
                      </select>
                      <Input
                        placeholder={
                          adjustForm.identifierType === 'email' ? 'user@example.com' : '用户UUID'
                        }
                        value={adjustForm.identifier}
                        onChange={(event) =>
                          setAdjustForm((prev) => ({ ...prev, identifier: event.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      积分数量
                    </label>
                    <Input
                      type="number"
                      className="mt-2"
                      placeholder="例如：100"
                      value={adjustForm.amount}
                      onChange={(event) =>
                        setAdjustForm((prev) => ({ ...prev, amount: event.target.value }))
                      }
                      required
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={adjustForm.adjustmentType === 'manual_increase' ? 'primary' : 'secondary'}
                        onClick={() =>
                          setAdjustForm((prev) => ({
                            ...prev,
                            adjustmentType: 'manual_increase',
                          }))
                        }
                      >
                        加积分
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={adjustForm.adjustmentType === 'manual_decrease' ? 'primary' : 'secondary'}
                        onClick={() =>
                          setAdjustForm((prev) => ({
                            ...prev,
                            adjustmentType: 'manual_decrease',
                          }))
                        }
                      >
                        扣积分
                      </Button>
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      调整类型
                    </label>
                    <select
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                      value={adjustForm.adjustmentType}
                      onChange={(event) =>
                        setAdjustForm((prev) => ({
                          ...prev,
                          adjustmentType: event.target.value as CreditAdjustment['adjustment_type'],
                        }))
                      }
                    >
                      {Object.entries(ADJUSTMENT_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      积分类型
                    </label>
                    <select
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                      value={adjustForm.creditType}
                      onChange={(event) =>
                        setAdjustForm((prev) => ({
                          ...prev,
                          creditType: event.target.value as 'permanent' | 'bonus',
                        }))
                      }
                    >
                      <option value="permanent">永久积分</option>
                      <option value="bonus">临时积分（零时积分）</option>
                    </select>
                    {adjustForm.creditType === 'bonus' && (
                      <div className="mt-2">
                        <Input
                          type="number"
                          className="mt-1"
                          placeholder="过期天数（默认7天）"
                          value={adjustForm.bonusExpiresDays}
                          onChange={(event) =>
                            setAdjustForm((prev) => ({ ...prev, bonusExpiresDays: event.target.value }))
                          }
                          min="1"
                          step="1"
                        />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      备注说明（可选）
                    </label>
                    <Textarea
                      className="mt-2"
                      rows={3}
                      placeholder="记录本次调整的原因"
                      value={adjustForm.reason}
                      onChange={(event) =>
                        setAdjustForm((prev) => ({ ...prev, reason: event.target.value }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" disabled={adjustSubmitting}>
                      {adjustSubmitting ? '提交中...' : '提交调整'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>最近积分调整记录</CardTitle>
              </CardHeader>
              <CardContent>
                {adjustmentsLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="mr-3 h-6 w-6 animate-spin rounded-full border-b-2 border-energy-water"></div>
                    正在加载积分记录...
                  </div>
                ) : creditAdjustments.length === 0 ? (
                  <p className="py-8 text-center text-gray-500 dark:text-gray-400">暂无手动积分调整记录</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="py-3 px-4 text-left">时间</th>
                          <th className="py-3 px-4 text-left">用户</th>
                          <th className="py-3 px-4 text-left">变动</th>
                          <th className="py-3 px-4 text-left">类型</th>
                          <th className="py-3 px-4 text-left">原因</th>
                          <th className="py-3 px-4 text-left">前后积分</th>
                        </tr>
                      </thead>
                      <tbody>
                        {creditAdjustments.map((adjustment) => (
                          <tr
                            key={adjustment.id}
                            className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                          >
                            <td className="py-3 px-4">{formatDate(adjustment.created_at)}</td>
                            <td className="py-3 px-4">
                              {adjustment.user_email || adjustment.user_id.substring(0, 8)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={
                                  adjustment.delta >= 0
                                    ? 'font-semibold text-green-600 dark:text-green-400'
                                    : 'font-semibold text-red-600 dark:text-red-400'
                                }
                              >
                                {adjustment.delta >= 0 ? '+' : ''}
                                {adjustment.delta}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {ADJUSTMENT_TYPE_LABELS[adjustment.adjustment_type]}
                            </td>
                            <td className="max-w-xs py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                              {adjustment.reason || '—'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                              {adjustment.before_credits ?? '—'} → {adjustment.after_credits ?? '—'}
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
        )}
      </main>
    </div>
  )
}
