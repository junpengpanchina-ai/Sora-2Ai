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
    if (!sessionId) {
      setStatus('error')
      setErrorMessage('缺少支付会话ID')
      return
    }

    // 检查支付状态
    async function checkPaymentStatus() {
      try {
        const response = await fetch(`/api/payment/check-session?session_id=${sessionId}`)
        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setErrorMessage(data.error || '检查支付状态失败')
          return
        }

        if (!data.success) {
          setStatus('failed')
          setErrorMessage(data.message || '支付未完成')
          return
        }

        // 更新充值信息
        setRechargeInfo({
          amount: data.recharge_record?.amount,
          credits: data.recharge_record?.credits,
          status: data.recharge_record?.status,
        })

        // 更新积分
        setCredits(data.user_credits)

        // 根据充值记录状态更新UI状态
        if (data.recharge_status === 'completed') {
          setStatus('completed')
        } else if (data.recharge_status === 'pending') {
          setStatus('processing')
          // 如果还在处理中，继续轮询（最多30次，每次2秒，共60秒）
          if (pollCount < 30) {
            setTimeout(() => {
              setPollCount(prev => prev + 1)
              checkPaymentStatus()
            }, 2000)
          } else {
            // 超时，但支付已成功，可能是Webhook延迟
            setStatus('completed')
            setErrorMessage('支付成功，但积分到账可能延迟，请稍后刷新页面查看')
          }
        } else {
          setStatus('error')
          setErrorMessage('充值状态异常')
        }
      } catch (error) {
        console.error('Failed to check payment status:', error)
        setStatus('error')
        setErrorMessage('检查支付状态时发生错误')
      }
    }

    checkPaymentStatus()
  }, [sessionId, pollCount])

  // 手动刷新状态
  const handleRefresh = () => {
    setPollCount(0)
    setStatus('checking')
    setErrorMessage(null)
  }

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
            {status === 'completed' && '支付成功'}
            {status === 'processing' && '处理中...'}
            {status === 'checking' && '验证中...'}
            {status === 'failed' && '支付失败'}
            {status === 'error' && '发生错误'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {status === 'completed' && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                您的充值已成功处理，积分已添加到您的账户。
              </p>
            )}
            {status === 'processing' && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                支付已确认，正在处理积分到账，请稍候...
              </p>
            )}
            {status === 'checking' && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                正在验证支付状态...
              </p>
            )}
            {(status === 'failed' || status === 'error') && errorMessage && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              </div>
            )}

            {rechargeInfo && (
              <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">充值信息</p>
                <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                  ¥{rechargeInfo.amount} → {rechargeInfo.credits} 积分
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  状态: {rechargeInfo.status === 'completed' ? '已完成' : 
                         rechargeInfo.status === 'pending' ? '处理中' : 
                         rechargeInfo.status || '未知'}
                </p>
              </div>
            )}

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

            {status === 'processing' && (
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span>等待积分到账中... ({pollCount}/30)</span>
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
                刷新状态
              </Button>
            )}
            <Link href="/" className="flex-1">
              <Button variant="primary" className="w-full">
                返回首页
              </Button>
            </Link>
            {status === 'completed' && (
              <Link href="/video" className="flex-1">
                <Button variant="default" className="w-full">
                  生成视频
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

