'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import Link from 'next/link'

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
  payment_method: string
  payment_id: string | null
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  completed_at: string | null
  user_email?: string
  user_name?: string
}

interface ConsumptionRecord {
  id: string
  user_id: string
  video_task_id: string | null
  credits: number
  description: string
  status: 'completed' | 'refunded'
  created_at: string
  refunded_at: string | null
  user_email?: string
  user_name?: string
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
  user_email?: string
  user_name?: string
}

export default function AdminClient() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([])
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>([])
  const [videoTasks, setVideoTasks] = useState<VideoTask[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'recharges' | 'consumption' | 'videos'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)

      // 获取统计数据
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats(statsData.stats)
        }
      }

      // 获取充值记录
      const rechargeResponse = await fetch('/api/admin/recharges')
      if (rechargeResponse.ok) {
        const rechargeData = await rechargeResponse.json()
        if (rechargeData.success) {
          setRechargeRecords(rechargeData.records || [])
        }
      }

      // 获取消耗记录
      const consumptionResponse = await fetch('/api/admin/consumption')
      if (consumptionResponse.ok) {
        const consumptionData = await consumptionResponse.json()
        if (consumptionData.success) {
          setConsumptionRecords(consumptionData.records || [])
        }
      }

      // 获取视频任务
      const videosResponse = await fetch('/api/admin/videos')
      if (videosResponse.ok) {
        const videosData = await videosResponse.json()
        if (videosData.success) {
          setVideoTasks(videosData.tasks || [])
        }
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // 自动刷新
    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(fetchData, 10000) // 每10秒刷新一次
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

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
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: '已完成', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      failed: { label: '失败', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
      succeeded: { label: '成功', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      processing: { label: '处理中', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      refunded: { label: '已退款', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    }
    const variant = variants[status] || variants.pending
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark">
      {/* 导航栏 */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                管理员后台
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-energy-water text-white'
                      : 'text-gray-700 hover:bg-energy-water-surface dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  总览
                </button>
                <button
                  onClick={() => setActiveTab('recharges')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'recharges'
                      ? 'bg-energy-water text-white'
                      : 'text-gray-700 hover:bg-energy-water-surface dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  充值记录
                </button>
                <button
                  onClick={() => setActiveTab('consumption')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'consumption'
                      ? 'bg-energy-water text-white'
                      : 'text-gray-700 hover:bg-energy-water-surface dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  消耗记录
                </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'videos'
                      ? 'bg-energy-water text-white'
                      : 'text-gray-700 hover:bg-energy-water-surface dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  视频任务
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                自动刷新 (10秒)
              </label>
              <Button variant="secondary" size="sm" onClick={fetchData} disabled={loading}>
                {loading ? '刷新中...' : '手动刷新'}
              </Button>
              <Link href="/admin?logout=true">
                <Button variant="ghost" size="sm">
                  退出管理员
                </Button>
              </Link>
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
        {loading && !stats ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-energy-water"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">加载中...</span>
          </div>
        ) : (
          <>
            {/* 总览页面 */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">数据总览</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        总用户数
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.total_users}
                      </div>
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

                {/* 最近充值记录 */}
                <Card>
                  <CardHeader>
                    <CardTitle>最近充值记录</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rechargeRecords.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">暂无充值记录</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-2 px-3">时间</th>
                              <th className="text-left py-2 px-3">用户</th>
                              <th className="text-left py-2 px-3">金额</th>
                              <th className="text-left py-2 px-3">积分</th>
                              <th className="text-left py-2 px-3">状态</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rechargeRecords.slice(0, 10).map((record) => (
                              <tr key={record.id} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-2 px-3">{formatDate(record.created_at)}</td>
                                <td className="py-2 px-3">{record.user_email || record.user_id.substring(0, 8)}</td>
                                <td className="py-2 px-3 font-medium">{formatCurrency(record.amount)}</td>
                                <td className="py-2 px-3 text-energy-water dark:text-energy-soft">+{record.credits}</td>
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

            {/* 充值记录页面 */}
            {activeTab === 'recharges' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">充值记录</h2>
                  <Badge className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft">
                    共 {rechargeRecords.length} 条
                  </Badge>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {rechargeRecords.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">暂无充值记录</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-3 px-4">时间</th>
                              <th className="text-left py-3 px-4">用户邮箱</th>
                              <th className="text-left py-3 px-4">金额</th>
                              <th className="text-left py-3 px-4">积分</th>
                              <th className="text-left py-3 px-4">支付方式</th>
                              <th className="text-left py-3 px-4">状态</th>
                              <th className="text-left py-3 px-4">支付ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rechargeRecords.map((record) => (
                              <tr
                                key={record.id}
                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              >
                                <td className="py-3 px-4">{formatDate(record.created_at)}</td>
                                <td className="py-3 px-4">{record.user_email || 'N/A'}</td>
                                <td className="py-3 px-4 font-medium">{formatCurrency(record.amount)}</td>
                                <td className="py-3 px-4 text-energy-water dark:text-energy-soft">+{record.credits}</td>
                                <td className="py-3 px-4">{record.payment_method}</td>
                                <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
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
              </div>
            )}

            {/* 消耗记录页面 */}
            {activeTab === 'consumption' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">消耗记录</h2>
                  <Badge className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft">
                    共 {consumptionRecords.length} 条
                  </Badge>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {consumptionRecords.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">暂无消耗记录</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-3 px-4">时间</th>
                              <th className="text-left py-3 px-4">用户邮箱</th>
                              <th className="text-left py-3 px-4">消耗积分</th>
                              <th className="text-left py-3 px-4">描述</th>
                              <th className="text-left py-3 px-4">状态</th>
                              <th className="text-left py-3 px-4">任务ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {consumptionRecords.map((record) => (
                              <tr
                                key={record.id}
                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              >
                                <td className="py-3 px-4">{formatDate(record.created_at)}</td>
                                <td className="py-3 px-4">{record.user_email || 'N/A'}</td>
                                <td className="py-3 px-4 font-medium text-red-600 dark:text-red-400">
                                  -{record.credits}
                                </td>
                                <td className="py-3 px-4">{record.description}</td>
                                <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                                <td className="py-3 px-4">
                                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                    {record.video_task_id || 'N/A'}
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
              </div>
            )}

            {/* 视频任务页面 */}
            {activeTab === 'videos' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">视频任务</h2>
                  <Badge className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft">
                    共 {videoTasks.length} 条
                  </Badge>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {videoTasks.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">暂无视频任务</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-3 px-4">时间</th>
                              <th className="text-left py-3 px-4">用户邮箱</th>
                              <th className="text-left py-3 px-4">提示词</th>
                              <th className="text-left py-3 px-4">状态</th>
                              <th className="text-left py-3 px-4">进度</th>
                              <th className="text-left py-3 px-4">Grsai任务ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {videoTasks.map((task) => (
                              <tr
                                key={task.id}
                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              >
                                <td className="py-3 px-4">{formatDate(task.created_at)}</td>
                                <td className="py-3 px-4">{task.user_email || 'N/A'}</td>
                                <td className="py-3 px-4 max-w-xs truncate" title={task.prompt}>
                                  {task.prompt}
                                </td>
                                <td className="py-3 px-4">{getStatusBadge(task.status)}</td>
                                <td className="py-3 px-4">{task.progress}%</td>
                                <td className="py-3 px-4">
                                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                    {task.grsai_task_id || 'N/A'}
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
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

