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
  }
}

export default function HomePageClient({ userProfile }: HomePageClientProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStats(data.stats)
            setRecentTasks(data.recentTasks || [])
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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
          <Link href="/video">
            <Button variant="primary" size="lg">
              Start Generating Video
            </Button>
          </Link>
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
                {recentTasks.length > 0 ? (
                  <div className="space-y-4">
                    {recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {task.prompt}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            {getStatusBadge(task.status)}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(task.created_at)}
                            </span>
                          </div>
                          {task.video_url && task.status === 'succeeded' && (
                            <div className="mt-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                              <video
                                src={task.video_url}
                                controls
                                className="w-full max-h-48"
                                preload="metadata"
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}
                        </div>
                        {task.video_url && (
                          <Link
                            href={task.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 whitespace-nowrap"
                          >
                            {task.status === 'succeeded' ? 'Open' : 'View'}
                          </Link>
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
    </div>
  )
}

