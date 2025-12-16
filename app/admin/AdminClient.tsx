'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import Link from 'next/link'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AdminPromptsManager from './AdminPromptsManager'
import AdminKeywordsManager from './AdminKeywordsManager'
import AdminGrsaiChatManager from './AdminGrsaiChatManager'
import AdminHomepageManager from './AdminHomepageManager'
import AdminBlogManager from './AdminBlogManager'

interface UserStats {
  total_users: number
  total_credits: number
  total_recharges: number
  total_consumption: number
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

interface VideoTask {
  id: string
  user_id: string
  grsai_task_id: string | null
  model: string
  prompt: string
  status: string
  progress: number
  video_url: string | null
  created_at: string
  completed_at: string | null
  user_email?: string | null
  user_name?: string | null
}

interface AfterSalesIssue {
  id: string
  user_name: string
  contact_phone: string
  contact_email: string | null
  issue_category: string | null
  issue_description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
  admin_notes: string | null
  handled_by: string | null
  resolved_at: string | null
  handler_email: string | null
  handler_name: string | null
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

type BannerState = { type: 'success' | 'error'; text: string } | null

const ISSUE_STATUS_LABELS: Record<AfterSalesIssue['status'], string> = {
  open: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
}

const ISSUE_STATUS_OPTIONS: Array<{ value: AfterSalesIssue['status']; label: string }> = [
  { value: 'open', label: ISSUE_STATUS_LABELS.open },
  { value: 'in_progress', label: ISSUE_STATUS_LABELS.in_progress },
  { value: 'resolved', label: ISSUE_STATUS_LABELS.resolved },
  { value: 'closed', label: ISSUE_STATUS_LABELS.closed },
]

const ADJUSTMENT_TYPE_LABELS: Record<CreditAdjustment['adjustment_type'], string> = {
  manual_increase: '手动增加',
  manual_decrease: '手动扣减',
  recharge_correction: '充值补发',
  recharge_refund: '充值退款扣减',
  consumption_refund: '消费退款',
  other: '其他',
}

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
  succeeded: {
    label: '成功',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  processing: {
    label: '处理中',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  refunded: {
    label: '已退款',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  open: {
    label: ISSUE_STATUS_LABELS.open,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  in_progress: {
    label: ISSUE_STATUS_LABELS.in_progress,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  resolved: {
    label: ISSUE_STATUS_LABELS.resolved,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  closed: {
    label: ISSUE_STATUS_LABELS.closed,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  },
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

interface AdminClientProps {
  adminUser: {
    id: string
    username: string
    is_super_admin: boolean
  }
}

export default function AdminClient({ adminUser }: AdminClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([])
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>([])
  const [videoTasks, setVideoTasks] = useState<VideoTask[]>([])
  const [issues, setIssues] = useState<AfterSalesIssue[]>([])
  const [issueStatusCounts, setIssueStatusCounts] = useState<Record<string, number>>({})
  const [creditAdjustments, setCreditAdjustments] = useState<CreditAdjustment[]>([])
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'recharges'
    | 'consumption'
    | 'videos'
    | 'issues'
    | 'adjustments'
    | 'prompts'
    | 'keywords'
    | 'grsai-chat'
    | 'homepage'
    | 'blog'
  >('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [issuesLoading, setIssuesLoading] = useState(true)
  const [adjustmentsLoading, setAdjustmentsLoading] = useState(true)
  const [issueNotesDrafts, setIssueNotesDrafts] = useState<Record<string, string>>({})
  const [issueActionId, setIssueActionId] = useState<string | null>(null)
  const [rechargeActionId, setRechargeActionId] = useState<string | null>(null)
  const [consumptionActionId, setConsumptionActionId] = useState<string | null>(null)
  const [videoActionId, setVideoActionId] = useState<string | null>(null)
  const [adjustmentActionId, setAdjustmentActionId] = useState<string | null>(null)
  const [adjustSubmitting, setAdjustSubmitting] = useState(false)
  const [banner, setBanner] = useState<BannerState>(null)
  const bannerTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [adjustForm, setAdjustForm] = useState({
    identifierType: 'email' as 'email' | 'userId',
    identifier: '',
    amount: '',
    adjustmentType: 'manual_increase' as CreditAdjustment['adjustment_type'],
    reason: '',
    relatedRechargeId: '',
    relatedConsumptionId: '',
  })

  const supabaseClient = useMemo(() => createSupabaseClient(), [])

  const showBanner = useCallback((type: 'success' | 'error', text: string) => {
    setBanner({ type, text })
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current)
    }
    bannerTimeoutRef.current = setTimeout(() => {
      setBanner(null)
      bannerTimeoutRef.current = null
    }, 4000)
  }, [])

  const fetchData = useCallback(
    async (withLoader = false) => {
      if (withLoader) {
        setLoading(true)
      }

      const parseResponse = async <T,>(response: Response, fallbackMessage: string): Promise<T | null> => {
        try {
          const payload = await response.json()
          if (!response.ok) {
            const messageParts = [
              typeof payload?.error === 'string' ? payload.error : '',
              typeof payload?.details === 'string' ? payload.details : '',
            ]
              .map((part) => part.trim())
              .filter(Boolean)
            const message = messageParts.length > 0 ? messageParts.join('：') : fallbackMessage
            showBanner('error', message)
            return null
          }
          return payload as T
        } catch (error) {
          console.error(fallbackMessage, error)
          showBanner('error', fallbackMessage)
          return null
        }
      }

      try {
        const [statsResponse, rechargeResponse, consumptionResponse, videosResponse] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/recharges'),
          fetch('/api/admin/consumption'),
          fetch('/api/admin/videos'),
        ])

        const statsData = await parseResponse<{ success: boolean; stats: UserStats }>(
          statsResponse,
          '获取统计数据失败，请稍后再试'
        )
        if (statsData?.success) {
          setStats(statsData.stats)
        }

        const rechargeData = await parseResponse<{ success: boolean; records: RechargeRecord[] }>(
          rechargeResponse,
          '获取充值记录失败，请稍后再试'
        )
        if (rechargeData?.success) {
          setRechargeRecords(rechargeData.records || [])
        }

        const consumptionData = await parseResponse<{ success: boolean; records: ConsumptionRecord[] }>(
          consumptionResponse,
          '获取消耗记录失败，请稍后再试'
        )
        if (consumptionData?.success) {
          setConsumptionRecords(consumptionData.records || [])
        }

        const videosData = await parseResponse<{ success: boolean; tasks: VideoTask[] }>(
          videosResponse,
          '获取视频任务失败，请稍后再试'
        )
        if (videosData?.success) {
          setVideoTasks(videosData.tasks || [])
        }
      } catch (error) {
        console.error('获取数据失败:', error)
        showBanner('error', '获取统计数据失败，请稍后再试')
      } finally {
        setLoading(false)
      }
    },
    [showBanner]
  )

  const fetchIssues = useCallback(async () => {
    setIssuesLoading(true)
    try {
      const response = await fetch('/api/admin/issues')
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? '获取售后列表失败')
      }
      const data = await response.json()
      setIssues(data.issues ?? [])
      setIssueStatusCounts(data.statusCounts ?? {})
    } catch (error) {
      console.error('获取售后反馈失败:', error)
      showBanner('error', error instanceof Error ? error.message : '获取售后反馈失败')
    } finally {
      setIssuesLoading(false)
    }
  }, [showBanner])

  const fetchAdjustments = useCallback(async () => {
    setAdjustmentsLoading(true)
    try {
      const response = await fetch('/api/admin/credits')
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? '获取积分调整记录失败')
      }
      const data = await response.json()
      setCreditAdjustments(data.adjustments ?? [])
    } catch (error) {
      console.error('获取积分调整记录失败:', error)
      showBanner('error', error instanceof Error ? error.message : '获取积分调整记录失败')
    } finally {
      setAdjustmentsLoading(false)
    }
  }, [showBanner])

  useEffect(() => {
    fetchData(true)
    fetchIssues()
    fetchAdjustments()

    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchData()
        fetchIssues()
        fetchAdjustments()
      }, 10000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchData, fetchIssues, fetchAdjustments])

  useEffect(() => {
    const channel = supabaseClient
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recharge_records' },
        () => {
          fetchData()
          fetchAdjustments()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'consumption_records' },
        () => {
          fetchData()
          fetchAdjustments()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'credit_adjustments' },
        fetchAdjustments
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'after_sales_issues' },
        fetchIssues
      )

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('订阅实时更新失败')
      }
    })

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [supabaseClient, fetchData, fetchIssues, fetchAdjustments])

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setIssueNotesDrafts((prev) => {
      const next = { ...prev }
      issues.forEach((issue) => {
        if (prev[issue.id] === undefined) {
          next[issue.id] = issue.admin_notes ?? ''
        }
      })
      return next
    })
  }, [issues])

  const handleIssueStatusChange = useCallback(
    async (issueId: string, status: AfterSalesIssue['status']) => {
      setIssueActionId(issueId)
      try {
        const response = await fetch(`/api/admin/issues/${issueId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload.error ?? '更新售后状态失败')
        }

        await fetchIssues()
        showBanner('success', '售后状态已更新')
      } catch (error) {
        console.error('更新售后问题失败:', error)
        showBanner('error', error instanceof Error ? error.message : '更新售后问题失败')
      } finally {
        setIssueActionId(null)
      }
    },
    [fetchIssues, showBanner]
  )

  const handleIssueNotesSave = useCallback(
    async (issueId: string) => {
      setIssueActionId(issueId)
      try {
        const response = await fetch(`/api/admin/issues/${issueId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminNotes: issueNotesDrafts[issueId] ?? '' }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload.error ?? '保存备注失败')
        }

        await fetchIssues()
        showBanner('success', '备注已保存')
      } catch (error) {
        console.error('保存售后备注失败:', error)
        showBanner('error', error instanceof Error ? error.message : '保存售后备注失败')
      } finally {
        setIssueActionId(null)
      }
    },
    [fetchIssues, issueNotesDrafts, showBanner]
  )

  const updateRechargeRecord = useCallback(
    async (rechargeId: string, payload: { status?: RechargeRecord['status']; adminNotes?: string | null }) => {
      setRechargeActionId(rechargeId)
      try {
        const response = await fetch(`/api/admin/recharges/${rechargeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error ?? '更新充值记录失败')
        }

        const updated = data.recharge as RechargeRecord | undefined
        const adjustment = data.adjustment as CreditAdjustment | undefined

        if (updated) {
          setRechargeRecords((prev) =>
            prev.map((record) =>
              record.id === rechargeId
                ? {
                    ...record,
                    ...updated,
                    user_email: record.user_email,
                    user_name: record.user_name,
                  }
                : record
            )
          )
        }

        if (adjustment) {
          fetchAdjustments()
        }

        fetchData()
        showBanner('success', '充值记录已更新')
      } catch (error) {
        console.error('更新充值记录失败:', error)
        showBanner('error', error instanceof Error ? error.message : '更新充值记录失败')
      } finally {
        setRechargeActionId(null)
      }
    },
    [fetchAdjustments, fetchData, showBanner]
  )

  const handleRechargeStatusChange = useCallback(
    async (rechargeId: string, status: RechargeRecord['status']) => {
      await updateRechargeRecord(rechargeId, { status })
    },
    [updateRechargeRecord]
  )

  const handleRechargeNotesEdit = useCallback(
    async (record: RechargeRecord) => {
      const nextNotes = window.prompt('请输入管理员备注（留空清除）', record.admin_notes ?? '')
      if (nextNotes === null) return
      await updateRechargeRecord(record.id, { adminNotes: nextNotes.trim() === '' ? null : nextNotes })
    },
    [updateRechargeRecord]
  )

  const handleConsumptionRefund = useCallback(
    async (consumptionId: string) => {
      setConsumptionActionId(consumptionId)
      try {
        const response = await fetch(`/api/admin/consumption/${consumptionId}/refund`, {
          method: 'POST',
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload.error ?? '退款失败')
        }

        const updated = payload.consumption as ConsumptionRecord | undefined
        if (updated) {
          setConsumptionRecords((prev) =>
            prev.map((record) =>
              record.id === consumptionId
                ? {
                    ...record,
                    ...updated,
                    user_email: record.user_email,
                    user_name: record.user_name,
                  }
                : record
            )
          )
        }

        fetchAdjustments()
        fetchData()
        showBanner('success', '积分已返还给用户')
      } catch (error) {
        console.error('退款失败:', error)
        showBanner('error', error instanceof Error ? error.message : '退款失败，请检查是否已经退款')
      } finally {
        setConsumptionActionId(null)
      }
    },
    [fetchAdjustments, fetchData, showBanner]
  )

  const handleConsumptionEdit = useCallback(
    async (consumptionId: string, updates: { description?: string | null; status?: string }) => {
      setConsumptionActionId(consumptionId)
      try {
        const response = await fetch(`/api/admin/consumption/${consumptionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? '更新失败')
        }
        const updated = payload.consumption as ConsumptionRecord | undefined
        if (updated) {
          setConsumptionRecords((prev) =>
            prev.map((record) =>
              record.id === consumptionId
                ? {
                    ...record,
                    ...updated,
                    user_email: record.user_email,
                    user_name: record.user_name,
                  }
                : record
            )
          )
        }
        fetchData()
        showBanner('success', '消耗记录已更新')
      } catch (error) {
        console.error('更新消耗记录失败:', error)
        showBanner('error', error instanceof Error ? error.message : '更新消耗记录失败')
      } finally {
        setConsumptionActionId(null)
      }
    },
    [fetchData, showBanner]
  )

  const handleRechargeDelete = useCallback(
    async (rechargeId: string) => {
      if (!window.confirm('确定要删除这条充值记录吗？此操作不可恢复。')) {
        return
      }
      setRechargeActionId(rechargeId)
      try {
        const response = await fetch(`/api/admin/recharges/${rechargeId}`, {
          method: 'DELETE',
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? '删除失败')
        }
        setRechargeRecords((prev) => prev.filter((record) => record.id !== rechargeId))
        fetchData()
        showBanner('success', '充值记录已删除')
      } catch (error) {
        console.error('删除充值记录失败:', error)
        showBanner('error', error instanceof Error ? error.message : '删除充值记录失败')
      } finally {
        setRechargeActionId(null)
      }
    },
    [fetchData, showBanner]
  )

  const handleConsumptionDelete = useCallback(
    async (consumptionId: string) => {
      if (!window.confirm('确定要删除这条消耗记录吗？此操作不可恢复。')) {
        return
      }
      setConsumptionActionId(consumptionId)
      try {
        const response = await fetch(`/api/admin/consumption/${consumptionId}`, {
          method: 'DELETE',
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? '删除失败')
        }
        setConsumptionRecords((prev) => prev.filter((record) => record.id !== consumptionId))
        fetchData()
        showBanner('success', '消耗记录已删除')
      } catch (error) {
        console.error('删除消耗记录失败:', error)
        showBanner('error', error instanceof Error ? error.message : '删除消耗记录失败')
      } finally {
        setConsumptionActionId(null)
      }
    },
    [fetchData, showBanner]
  )

  const handleVideoEdit = useCallback(
    async (taskId: string, updates: { status?: string; progress?: number; video_url?: string | null }) => {
      setVideoActionId(taskId)
      try {
        const response = await fetch(`/api/admin/videos/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? '更新失败')
        }
        const updated = payload.task as VideoTask | undefined
        if (updated) {
          setVideoTasks((prev) =>
            prev.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    ...updated,
                    user_email: task.user_email,
                    user_name: task.user_name,
                  }
                : task
            )
          )
        }
        fetchData()
        showBanner('success', '视频任务已更新')
      } catch (error) {
        console.error('更新视频任务失败:', error)
        showBanner('error', error instanceof Error ? error.message : '更新视频任务失败')
      } finally {
        setVideoActionId(null)
      }
    },
    [fetchData, showBanner]
  )

  const handleVideoDelete = useCallback(
    async (taskId: string) => {
      if (!window.confirm('确定要删除这个视频任务吗？此操作不可恢复。')) {
        return
      }
      setVideoActionId(taskId)
      try {
        const response = await fetch(`/api/admin/videos/${taskId}`, {
          method: 'DELETE',
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? '删除失败')
        }
        setVideoTasks((prev) => prev.filter((task) => task.id !== taskId))
        fetchData()
        showBanner('success', '视频任务已删除')
      } catch (error) {
        console.error('删除视频任务失败:', error)
        showBanner('error', error instanceof Error ? error.message : '删除视频任务失败')
      } finally {
        setVideoActionId(null)
      }
    },
    [fetchData, showBanner]
  )

  const handleIssueDelete = useCallback(
    async (issueId: string) => {
      if (!window.confirm('确定要删除这个售后反馈吗？此操作不可恢复。')) {
        return
      }
      setIssueActionId(issueId)
      try {
        const response = await fetch(`/api/admin/issues/${issueId}`, {
          method: 'DELETE',
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? '删除失败')
        }
        setIssues((prev) => prev.filter((issue) => issue.id !== issueId))
        fetchIssues()
        showBanner('success', '售后反馈已删除')
      } catch (error) {
        console.error('删除售后反馈失败:', error)
        showBanner('error', error instanceof Error ? error.message : '删除售后反馈失败')
      } finally {
        setIssueActionId(null)
      }
    },
    [fetchIssues, showBanner]
  )

  const handleAdjustmentEdit = useCallback(
    async (adjustmentId: string, updates: { reason?: string | null; adjustment_type?: string }) => {
      setAdjustmentActionId(adjustmentId)
      try {
        const response = await fetch(`/api/admin/credits/${adjustmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? '更新失败')
        }
        fetchAdjustments()
        showBanner('success', '积分调整记录已更新')
      } catch (error) {
        console.error('更新积分调整记录失败:', error)
        showBanner('error', error instanceof Error ? error.message : '更新积分调整记录失败')
      } finally {
        setAdjustmentActionId(null)
      }
    },
    [fetchAdjustments, showBanner]
  )

  const handleAdjustmentDelete = useCallback(
    async (adjustmentId: string) => {
      if (!window.confirm('确定要删除这条积分调整记录吗？此操作不可恢复。注意：删除记录不会自动恢复用户积分。')) {
        return
      }
      setAdjustmentActionId(adjustmentId)
      try {
        const response = await fetch(`/api/admin/credits/${adjustmentId}`, {
          method: 'DELETE',
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? '删除失败')
        }
        setCreditAdjustments((prev) => prev.filter((adj) => adj.id !== adjustmentId))
        fetchAdjustments()
        showBanner('success', '积分调整记录已删除')
      } catch (error) {
        console.error('删除积分调整记录失败:', error)
        showBanner('error', error instanceof Error ? error.message : '删除积分调整记录失败')
      } finally {
        setAdjustmentActionId(null)
      }
    },
    [fetchAdjustments, showBanner]
  )

  const handleAdjustmentSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!adjustForm.identifier.trim()) {
        showBanner('error', '请填写用户标识信息')
        return
      }
      if (!adjustForm.amount.trim()) {
        showBanner('error', '请填写调整积分数量')
        return
      }

      const parsedAmount = Number(adjustForm.amount)
      if (!Number.isFinite(parsedAmount)) {
        showBanner('error', '积分数量必须是数字')
        return
      }

      const baseAmount = Math.trunc(parsedAmount)
      if (baseAmount === 0) {
        showBanner('error', '积分数量不能为0')
        return
      }

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
        setAdjustForm((prev) => ({
          ...prev,
          amount: '',
          reason: '',
          relatedRechargeId: '',
          relatedConsumptionId: '',
        }))
        fetchAdjustments()
        fetchData()
      } catch (error) {
        console.error('积分调整失败:', error)
        showBanner('error', error instanceof Error ? error.message : '积分调整失败，请稍后重试')
      } finally {
        setAdjustSubmitting(false)
      }
    },
    [adjustForm, fetchAdjustments, fetchData, showBanner]
  )

  return (
    <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">管理员后台</h1>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'overview', label: '总览' },
                  { value: 'recharges', label: '充值记录' },
                  { value: 'consumption', label: '消耗记录' },
                  { value: 'videos', label: '视频任务' },
                  { value: 'issues', label: '售后反馈' },
                  { value: 'adjustments', label: '积分调整' },
                  { value: 'prompts', label: '提示词库' },
                  { value: 'keywords', label: '长尾词' },
                  { value: 'blog', label: '博客文章' },
                  { value: 'grsai-chat', label: 'GRSAI Chat' },
                  { value: 'homepage', label: '首页管理' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() =>
                      setActiveTab(
                        tab.value as typeof activeTab
                      )
                    }
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
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(event) => setAutoRefresh(event.target.checked)}
                  className="rounded"
                />
                自动刷新 (10秒)
              </label>
              <Button variant="secondary" size="sm" onClick={() => fetchData(true)} disabled={loading}>
                {loading ? '刷新中...' : '手动刷新'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await fetch('/api/auth/admin-logout', {
                      method: 'POST',
                    })
                  } finally {
                    router.push('/admin')
                    router.refresh()
                  }
                }}
              >
                退出管理员
              </Button>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  返回首页
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
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {banner.text}
          </div>
        )}

        {loading && !stats ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-energy-water"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">加载中...</span>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">数据总览</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        总用户数
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_users}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        总积分余额
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-energy-water dark:text-energy-soft">
                        {stats.total_credits.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        总充值金额
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(stats.total_recharges)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        总消耗积分
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {stats.total_consumption.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>最近充值记录</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rechargeRecords.length === 0 ? (
                      <p className="py-4 text-center text-gray-500 dark:text-gray-400">暂无充值记录</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="py-2 px-3 text-left">时间</th>
                              <th className="py-2 px-3 text-left">用户</th>
                              <th className="py-2 px-3 text-left">金额</th>
                              <th className="py-2 px-3 text-left">积分</th>
                              <th className="py-2 px-3 text-left">状态</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rechargeRecords.slice(0, 10).map((record) => (
                              <tr key={record.id} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-2 px-3">{formatDate(record.created_at)}</td>
                                <td className="py-2 px-3">
                                  {record.user_email || record.user_id.substring(0, 8)}
                                </td>
                                <td className="py-2 px-3 font-medium">{formatCurrency(record.amount)}</td>
                                <td className="py-2 px-3 text-energy-water dark:text-energy-soft">
                                  +{record.credits}
                                </td>
                                <td className="py-2 px-3">{getStatusBadge(record.status)}</td>
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

            {activeTab === 'recharges' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">充值记录</h2>
                  <Badge className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft">
                    共 {rechargeRecords.length} 条
                  </Badge>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {rechargeRecords.length === 0 ? (
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
                              <th className="py-3 px-4 text-left">支付方式</th>
                              <th className="py-3 px-4 text-left">状态</th>
                              <th className="py-3 px-4 text-left">备注</th>
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
                                  <td className="py-3 px-4">{record.payment_method ?? 'N/A'}</td>
                                  <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                                  <td className="py-3 px-4">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {record.admin_notes || '无'}
                                    </p>
                                  </td>
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
                                      {record.status !== 'cancelled' && record.status !== 'refunded' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleRechargeStatusChange(record.id, 'cancelled')}
                                          disabled={isProcessing}
                                        >
                                          {isProcessing ? '处理中...' : '取消'}
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRechargeNotesEdit(record)}
                                        disabled={isProcessing}
                                      >
                                        编辑备注
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleRechargeDelete(record.id)}
                                        disabled={isProcessing}
                                      >
                                        {isProcessing ? '处理中...' : '删除'}
                                      </Button>
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

            {activeTab === 'consumption' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">消耗记录</h2>
                  <Badge className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft">
                    共 {consumptionRecords.length} 条
                  </Badge>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {consumptionRecords.length === 0 ? (
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
                              <th className="py-3 px-4 text-left">任务ID</th>
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
                                    <p className="max-w-[200px] truncate text-xs font-mono text-gray-500 dark:text-gray-400">
                                      {record.video_task_id || 'N/A'}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-wrap gap-2">
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
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          const newDesc = window.prompt('编辑描述', record.description || '')
                                          if (newDesc !== null) {
                                            handleConsumptionEdit(record.id, { description: newDesc })
                                          }
                                        }}
                                        disabled={isProcessing}
                                      >
                                        编辑
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleConsumptionDelete(record.id)}
                                        disabled={isProcessing}
                                      >
                                        {isProcessing ? '处理中...' : '删除'}
                                      </Button>
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

            {activeTab === 'videos' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">视频任务</h2>
                  <Badge className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft">
                    共 {videoTasks.length} 条
                  </Badge>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {videoTasks.length === 0 ? (
                      <p className="py-8 text-center text-gray-500 dark:text-gray-400">暂无视频任务</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="py-3 px-4 text-left">时间</th>
                              <th className="py-3 px-4 text-left">用户邮箱</th>
                              <th className="py-3 px-4 text-left">提示词</th>
                              <th className="py-3 px-4 text-left">状态</th>
                              <th className="py-3 px-4 text-left">进度</th>
                              <th className="py-3 px-4 text-left">Grsai任务ID</th>
                              <th className="py-3 px-4 text-left">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {videoTasks.map((task) => {
                              const isProcessing = videoActionId === task.id
                              return (
                                <tr
                                  key={task.id}
                                  className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                                >
                                  <td className="py-3 px-4">{formatDate(task.created_at)}</td>
                                  <td className="py-3 px-4">{task.user_email || 'N/A'}</td>
                                  <td className="max-w-xs py-3 px-4 truncate" title={task.prompt}>
                                    {task.prompt}
                                  </td>
                                  <td className="py-3 px-4">{getStatusBadge(task.status)}</td>
                                  <td className="py-3 px-4">{task.progress}%</td>
                                  <td className="py-3 px-4">
                                    <p className="max-w-[200px] truncate text-xs font-mono text-gray-500 dark:text-gray-400">
                                      {task.grsai_task_id || 'N/A'}
                                    </p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          const newStatus = window.prompt(
                                            '编辑状态 (pending/processing/succeeded/failed)',
                                            task.status
                                          )
                                          if (newStatus && ['pending', 'processing', 'succeeded', 'failed'].includes(newStatus)) {
                                            handleVideoEdit(task.id, { status: newStatus })
                                          }
                                        }}
                                        disabled={isProcessing}
                                      >
                                        编辑状态
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleVideoDelete(task.id)}
                                        disabled={isProcessing}
                                      >
                                        {isProcessing ? '处理中...' : '删除'}
                                      </Button>
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

            {activeTab === 'issues' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">售后反馈</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      处理用户充值、退款及其他售后问题，更新状态并记录处理备注。
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ISSUE_STATUS_OPTIONS.map((status) => (
                      <Badge
                        key={status.value}
                        className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft"
                      >
                        {status.label}: {issueStatusCounts[status.value] ?? 0}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Card>
                  <CardContent className="space-y-4">
                    {issuesLoading ? (
                      <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                        <div className="mr-3 h-6 w-6 animate-spin rounded-full border-b-2 border-energy-water"></div>
                        正在加载售后数据...
                      </div>
                    ) : issues.length === 0 ? (
                      <p className="py-8 text-center text-gray-500 dark:text-gray-400">暂无售后反馈</p>
                    ) : (
                      issues.map((issue) => {
                        const isProcessing = issueActionId === issue.id
                        return (
                          <div
                            key={issue.id}
                            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900/70"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {issue.user_name}
                                  </h3>
                                  {getStatusBadge(issue.status)}
                                </div>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  创建时间：{formatDate(issue.created_at)}
                                  {issue.resolved_at ? ` · 完成时间：${formatDate(issue.resolved_at)}` : ''}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {issue.status !== 'in_progress' && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleIssueStatusChange(issue.id, 'in_progress')}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? '处理中...' : '标记处理中'}
                                  </Button>
                                )}
                                {issue.status !== 'resolved' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleIssueStatusChange(issue.id, 'resolved')}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? '处理中...' : '标记已解决'}
                                  </Button>
                                )}
                                {issue.status !== 'closed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleIssueStatusChange(issue.id, 'closed')}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? '处理中...' : '关闭工单'}
                                  </Button>
                                )}
                                {issue.status !== 'open' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleIssueStatusChange(issue.id, 'open')}
                                    disabled={isProcessing}
                                  >
                                    重新打开
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleIssueDelete(issue.id)}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? '处理中...' : '删除'}
                                </Button>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-3">
                              <div>
                                <p className="font-medium text-gray-500 dark:text-gray-400">联系方式</p>
                                <p className="mt-1">电话：{issue.contact_phone}</p>
                                <p className="mt-1">邮箱：{issue.contact_email || '未填写'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500 dark:text-gray-400">问题类型</p>
                                <p className="mt-1">{issue.issue_category || '未分类'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500 dark:text-gray-400">处理人</p>
                                <p className="mt-1">
                                  {issue.handler_name || issue.handler_email || '未分配'}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">问题描述</p>
                              <p className="mt-2 whitespace-pre-line rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800/70 dark:text-gray-200">
                                {issue.issue_description}
                              </p>
                            </div>

                            <div className="mt-4">
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                处理备注
                              </label>
                              <Textarea
                                className="mt-2"
                                rows={3}
                                value={issueNotesDrafts[issue.id] ?? ''}
                                onChange={(event) =>
                                  setIssueNotesDrafts((prev) => ({
                                    ...prev,
                                    [issue.id]: event.target.value,
                                  }))
                                }
                              />
                              <div className="mt-2 flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleIssueNotesSave(issue.id)}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? '保存中...' : '保存备注'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setIssueNotesDrafts((prev) => ({
                                      ...prev,
                                      [issue.id]: issue.admin_notes ?? '',
                                    }))
                                  }
                                  disabled={isProcessing}
                                >
                                  重置
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })
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
                          step="1"
                          inputMode="numeric"
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
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          也可以直接输入带符号的数字；上方快捷按钮会自动切换“加积分 / 扣积分”类型。
                        </p>
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
                          关联充值记录（可选）
                        </label>
                        <Input
                          className="mt-2"
                          placeholder="recharge record UUID"
                          value={adjustForm.relatedRechargeId}
                          onChange={(event) =>
                            setAdjustForm((prev) => ({
                              ...prev,
                              relatedRechargeId: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          关联消耗记录（可选）
                        </label>
                        <Input
                          className="mt-2"
                          placeholder="consumption record UUID"
                          value={adjustForm.relatedConsumptionId}
                          onChange={(event) =>
                            setAdjustForm((prev) => ({
                              ...prev,
                              relatedConsumptionId: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          备注说明（可选）
                        </label>
                        <Textarea
                          className="mt-2"
                          rows={3}
                          placeholder="记录本次调整的原因（将写入数据库，便于追踪）"
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
                              <th className="py-3 px-4 text-left">管理员</th>
                              <th className="py-3 px-4 text-left">前后积分</th>
                              <th className="py-3 px-4 text-left">关联记录</th>
                              <th className="py-3 px-4 text-left">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {creditAdjustments.map((adjustment) => {
                              const isProcessing = adjustmentActionId === adjustment.id
                              return (
                                <tr
                                  key={adjustment.id}
                                  className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                                >
                                  <td className="py-3 px-4">{formatDate(adjustment.created_at)}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col">
                                      <span>{adjustment.user_email || adjustment.user_id.substring(0, 8)}</span>
                                      <span className="text-xs text-gray-500">{adjustment.user_id}</span>
                                    </div>
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
                                  <td className="py-3 px-4">
                                    {adjustment.admin_email || adjustment.admin_user_id?.substring(0, 8) || '系统'}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                                    {adjustment.before_credits ?? '—'} → {adjustment.after_credits ?? '—'}
                                  </td>
                                  <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                                    {adjustment.related_recharge_id && (
                                      <div>充值：{adjustment.related_recharge_id}</div>
                                    )}
                                    {adjustment.related_consumption_id && (
                                      <div>消耗：{adjustment.related_consumption_id}</div>
                                    )}
                                    {!adjustment.related_recharge_id && !adjustment.related_consumption_id && '—'}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          const newReason = window.prompt('编辑原因', adjustment.reason || '')
                                          if (newReason !== null) {
                                            handleAdjustmentEdit(adjustment.id, { reason: newReason })
                                          }
                                        }}
                                        disabled={isProcessing}
                                      >
                                        编辑
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleAdjustmentDelete(adjustment.id)}
                                        disabled={isProcessing}
                                      >
                                        {isProcessing ? '处理中...' : '删除'}
                                      </Button>
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

            {activeTab === 'prompts' && <AdminPromptsManager onShowBanner={showBanner} />}
            {activeTab === 'keywords' && <AdminKeywordsManager onShowBanner={showBanner} />}
            {activeTab === 'blog' && <AdminBlogManager onShowBanner={showBanner} />}
            {activeTab === 'grsai-chat' && <AdminGrsaiChatManager onShowBanner={showBanner} />}
            {activeTab === 'homepage' && <AdminHomepageManager onShowBanner={showBanner} />}
          </>
        )}
      </main>
    </div>
  )
}


