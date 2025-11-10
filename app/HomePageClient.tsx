'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui'
import LogoutButton from '@/components/LogoutButton'
import R2Image from '@/components/R2Image'

interface Stats {
  total: number
  succeeded: number
  processing: number
  failed: number
}

interface RecentTask {
  id: string
  prompt: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  created_at: string
  video_url: string | null
}

interface HomePageClientProps {
  userProfile: {
    name?: string | null
    email: string
    avatar_url?: string | null
    created_at: string
    last_login_at?: string | null
    credits?: number
  }
}

export default function HomePageClient({ userProfile }: HomePageClientProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<number>(userProfile.credits || 0)
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [recharging, setRecharging] = useState(false)
  const [addingTestCredits, setAddingTestCredits] = useState(false)
  
  // 检查是否为开发环境
  const isDevelopment = process.env.NODE_ENV === 'development'

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStats(data.stats)
            setRecentTasks(data.recentTasks || [])
            if (data.credits !== undefined) {
              setCredits(data.credits)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    // 每30秒刷新一次积分
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  // 处理充值
  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount)
    if (!amount || amount <= 0) {
      alert('请输入有效的充值金额')
      return
    }

    setRecharging(true)
    try {
      const response = await fetch('/api/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
        }),
      })

      const data = await response.json()

      if (data.success && data.checkout_url) {
        // 重定向到 Stripe Checkout
        window.location.href = data.checkout_url
      } else {
        alert(`创建支付失败: ${data.error || 'Unknown error'}`)
        setRecharging(false)
      }
    } catch (error) {
      console.error('Failed to recharge:', error)
      alert('充值失败，请稍后重试')
      setRecharging(false)
    }
  }

  // 添加测试积分（仅开发环境）
  const handleAddTestCredits = async (testCredits: number = 100) => {
    if (!isDevelopment) {
      alert('此功能仅在开发环境可用')
      return
    }

    setAddingTestCredits(true)
    try {
      const response = await fetch('/api/debug/add-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits: testCredits,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`✅ ${data.message}\n积分: ${data.credits.before} → ${data.credits.after}`)
        // 刷新积分
        const statsResponse = await fetch('/api/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          if (statsData.success && statsData.credits !== undefined) {
            setCredits(statsData.credits)
          }
        }
      } else {
        // 显示详细错误信息
        const errorMsg = data.error || 'Unknown error'
        const details = data.details || ''
        const hint = data.hint || ''
        
        let fullErrorMsg = `添加积分失败: ${errorMsg}`
        if (details) {
          fullErrorMsg += `\n\n详情: ${details}`
        }
        if (hint) {
          fullErrorMsg += `\n\n提示: ${hint}`
        }
        
        // 如果是credits字段不存在，提供修复建议
        if (errorMsg.includes('Credits字段不存在') || errorMsg.includes('column') || errorMsg.includes('credits')) {
          fullErrorMsg += `\n\n🔧 快速修复:\n1. 访问 Supabase Dashboard\n2. 进入 SQL Editor\n3. 执行以下SQL:\n\nALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0 CHECK (credits >= 0);`
        }
        
        alert(fullErrorMsg)
      }
    } catch (error) {
      console.error('Failed to add test credits:', error)
      alert('添加积分失败，请稍后重试')
    } finally {
      setAddingTestCredits(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge variant="success">Success</Badge>
      case 'processing':
      case 'pending':
        return <Badge variant="info">Processing</Badge>
      case 'failed':
        return <Badge variant="error">Failed</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Sora-2Ai
              </h1>
              <Link
                href="/video"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors"
              >
                Video Generation
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  积分: {credits}
                </span>
              </div>
              {userProfile.avatar_url && (
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.name || 'User avatar'}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                {userProfile.name || userProfile.email}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowRechargeModal(true)}
              >
                充值
              </Button>
              {isDevelopment && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleAddTestCredits(100)}
                  disabled={addingTestCredits}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {addingTestCredits ? '添加中...' : '+100测试积分'}
                </Button>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8 text-center animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Welcome back, {userProfile.name || 'User'}!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Transform your creativity into amazing videos with OpenAI Sora 2.0
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/video">
              <Button variant="primary" size="lg">
                Start Generating Video
              </Button>
            </Link>
            <Button
              variant="default"
              size="lg"
              onClick={() => setShowRechargeModal(true)}
            >
              充值积分
            </Button>
          </div>
        </div>

        {/* Pricing and Recharge Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>价格说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong className="text-gray-900 dark:text-white">视频生成价格：</strong>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold"> 10积分/次</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    【无水印】OpenAI 最新发布的 Sora 模型 2.0，OpenAI官方内测，价格暂定，后续价格可能会有变动
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong className="text-gray-900 dark:text-white">充值比例：</strong>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold"> 1元 = 100积分</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[10, 50, 100, 200].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() => {
                          setRechargeAmount(amount.toString())
                          setShowRechargeModal(true)
                        }}
                        className="flex flex-col items-center py-3"
                      >
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          ¥{amount}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {amount * 100}积分
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Carousel - Always visible */}
        <div className="mb-8 space-y-6">
          {/* Top row: slide from right to left */}
          <div className="overflow-hidden">
            <div className="flex gap-6 animate-slide-right" style={{ width: '300%' }}>
              {/* First set */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="2b827a33e43a48b2b583ed428977712c.png"
                    alt="Image 1"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="460bef39f6e34f82912a27e357827963.png"
                    alt="Image 2"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="5995d3bfdb674ecebaccc581ed8940b3.png"
                    alt="Image 3"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="7b0be82bb2134fca87519cbecf30aca9.png"
                    alt="Image 4"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
              {/* Second set - duplicate for seamless loop */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="2b827a33e43a48b2b583ed428977712c.png"
                    alt="Image 1"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="460bef39f6e34f82912a27e357827963.png"
                    alt="Image 2"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="5995d3bfdb674ecebaccc581ed8940b3.png"
                    alt="Image 3"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="7b0be82bb2134fca87519cbecf30aca9.png"
                    alt="Image 4"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
              {/* Third set - extra duplicate for seamless loop */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="2b827a33e43a48b2b583ed428977712c.png"
                    alt="Image 1"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="460bef39f6e34f82912a27e357827963.png"
                    alt="Image 2"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="5995d3bfdb674ecebaccc581ed8940b3.png"
                    alt="Image 3"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="7b0be82bb2134fca87519cbecf30aca9.png"
                    alt="Image 4"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom row: slide from left to right */}
          <div className="overflow-hidden">
            <div className="flex gap-6 animate-slide-left" style={{ width: '300%' }}>
              {/* First set */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="80dc75a06d0b49c29bdb78eb45dc70a0.png"
                    alt="Image 5"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="b451ac136a474a9f91398a403af2d2a6.png"
                    alt="Image 6"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="e6e1ebc8cea34e83a106009a485b1cbb.png"
                    alt="Image 7"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="f566981bc27549b7a2389a6887e9c840.png"
                    alt="Image 8"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
              {/* Second set - duplicate for seamless loop */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="80dc75a06d0b49c29bdb78eb45dc70a0.png"
                    alt="Image 5"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="b451ac136a474a9f91398a403af2d2a6.png"
                    alt="Image 6"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="e6e1ebc8cea34e83a106009a485b1cbb.png"
                    alt="Image 7"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="f566981bc27549b7a2389a6887e9c840.png"
                    alt="Image 8"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
              {/* Third set - extra duplicate for seamless loop */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="80dc75a06d0b49c29bdb78eb45dc70a0.png"
                    alt="Image 5"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="b451ac136a474a9f91398a403af2d2a6.png"
                    alt="Image 6"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="e6e1ebc8cea34e83a106009a485b1cbb.png"
                    alt="Image 7"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="f566981bc27549b7a2389a6887e9c840.png"
                    alt="Image 8"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Carousel - Below image carousel */}
        <div className="mb-8">
          <div className="overflow-hidden">
            <div className="flex gap-6 animate-slide-right" style={{ width: '300%' }}>
              {/* First set */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/b8edbf0aa26b4afa85b7095b91414f3d.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_223443_366.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_223856_981.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_224357_417.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              </div>
              {/* Second set - duplicate for seamless loop */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_224947_118.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_223443_366.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_223856_981.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_224357_417.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              </div>
              {/* Third set - extra duplicate for seamless loop */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/b8edbf0aa26b4afa85b7095b91414f3d.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_224947_118.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_223856_981.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_224357_417.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mb-8 space-y-6">
            {/* Top row: slide from right to left */}
            <div className="overflow-hidden">
              <div className="flex gap-6 animate-slide-right-to-left" style={{ width: '200%' }}>
                {/* First set */}
                <div className="flex gap-6 flex-shrink-0" style={{ width: '50%' }}>
                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Total Tasks
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.total}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Succeeded
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {stats.succeeded}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Processing
                      </p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.processing}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Failed
                      </p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {stats.failed}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Duplicate for seamless loop */}
                <div className="flex gap-6 flex-shrink-0" style={{ width: '50%' }}>
                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Total Tasks
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.total}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Succeeded
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {stats.succeeded}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Processing
                      </p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.processing}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Failed
                      </p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {stats.failed}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            
            {/* Bottom row: slide from left to right */}
            <div className="overflow-hidden">
              <div className="flex gap-6 animate-slide-left-to-right" style={{ width: '200%' }}>
                {/* First set (reversed order) */}
                <div className="flex gap-6 flex-shrink-0" style={{ width: '50%' }}>
                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Failed
                      </p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {stats.failed}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Processing
                      </p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.processing}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Succeeded
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {stats.succeeded}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Total Tasks
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.total}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Duplicate for seamless loop */}
                <div className="flex gap-6 flex-shrink-0" style={{ width: '50%' }}>
                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Failed
                      </p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {stats.failed}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Processing
                      </p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.processing}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Succeeded
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {stats.succeeded}
                      </p>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                    <CardContent className="p-6">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Total Tasks
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.total}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Tasks */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentTasks.length > 0 ? (
                  <div className="space-y-4">
                    {recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-2">
                              {task.prompt}
                            </p>
                            <div className="flex items-center gap-3 flex-wrap">
                              {getStatusBadge(task.status)}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(task.created_at)}
                              </span>
                            </div>
                          </div>
                          {task.video_url && (
                            <Link
                              href={task.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-4 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 whitespace-nowrap"
                            >
                              Open
                            </Link>
                          )}
                        </div>
                        {task.video_url && task.status === 'succeeded' && (
                          <div className="mt-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <video
                              src={task.video_url}
                              controls
                              className="w-full max-h-64 object-contain"
                              preload="metadata"
                              playsInline
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No tasks created yet
                    </p>
                    <Link href="/video">
                      <Button variant="primary">Create First Task</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Features and User Info */}
          <div className="space-y-6">
            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    🎬 AI Video Generation
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Use advanced Sora 2.0 model to generate high-quality videos from text descriptions
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    🖼️ Reference Images
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Upload reference images to help AI better understand your creativity
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    ⚙️ Flexible Configuration
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Customize video aspect ratio, duration, and quality to meet different needs
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    📊 Real-time Tracking
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Monitor task progress in real-time with automatic notifications on completion
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Email
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {userProfile.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Username
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {userProfile.name || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Created At
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDate(userProfile.created_at)}
                  </p>
                </div>
                {userProfile.last_login_at && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Last Login
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(userProfile.last_login_at)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>充值积分</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  充值金额（元）
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="请输入充值金额"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {rechargeAmount && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    将获得 <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {Math.floor(parseFloat(rechargeAmount) * 100) || 0}
                    </span> 积分
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="default"
                  onClick={() => {
                    setShowRechargeModal(false)
                    setRechargeAmount('')
                  }}
                  className="flex-1"
                  disabled={recharging}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRecharge}
                  className="flex-1"
                  disabled={recharging || !rechargeAmount}
                >
                  {recharging ? '充值中...' : '确认充值'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

