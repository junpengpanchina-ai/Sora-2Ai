'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    // 刷新积分余额
    async function refreshCredits() {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.credits !== undefined) {
            setCredits(data.credits)
          }
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error)
      } finally {
        setLoading(false)
      }
    }

    refreshCredits()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            <span className="text-green-600 dark:text-green-400">✓</span> 支付成功
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              您的充值已成功处理，积分已添加到您的账户。
            </p>
            {credits !== null && (
              <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">当前积分余额</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {credits} 积分
                </p>
              </div>
            )}
            {sessionId && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                订单号: {sessionId.substring(0, 20)}...
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="primary" className="w-full">
                返回首页
              </Button>
            </Link>
            <Link href="/video" className="flex-1">
              <Button variant="default" className="w-full">
                生成视频
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

