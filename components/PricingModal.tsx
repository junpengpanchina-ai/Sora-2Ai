'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui'
import { setPostLoginRedirect } from '@/lib/auth/post-login-redirect'
import { createClient } from '@/lib/supabase/client'

interface PaymentLink {
  id: string
  url: string
  amount: number
  currency: string
  credits: number
  name: string
  videos: number
  description: string
}

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const router = useRouter()
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'starter' | 'packs'>('packs')
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null)
  const [redirectingToLogin, setRedirectingToLogin] = useState(false) // 防止无限循环
  
  // 懒加载 supabase client，只在客户端需要时创建
  const getSupabaseClient = useCallback(() => {
    if (typeof window === 'undefined') {
      return null
    }
    try {
      return createClient()
    } catch (error) {
      console.error('[PricingModal] Failed to create Supabase client:', error)
      return null
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchPaymentLinks()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const starter = getStarterLink(paymentLinks)
    // Default to starter for new users (we'll check this via localStorage or API if needed)
    // For now, default to starter if it exists
    setView(starter ? 'starter' : 'packs')
  }, [isOpen, paymentLinks])

  const getStarterLink = (links: PaymentLink[]) => {
    const sorted = [...links].sort((a, b) => a.amount - b.amount)
    return sorted.find((l) => l.amount > 0 && l.amount <= 10) ?? null
  }

  const getPackLinks = (links: PaymentLink[]) => {
    const filtered = links.filter((l) => l.amount >= 10)
    return filtered.sort((a, b) => a.amount - b.amount)
  }

  async function fetchPaymentLinks() {
    try {
      setLoading(true)
      const response = await fetch('/api/payment/payment-link?t=' + Date.now(), { cache: 'no-store' })
      const data = await response.json()
      
      if (data.success && data.payment_links) {
        // Sort by price
        const sorted = data.payment_links.sort((a: PaymentLink, b: PaymentLink) => a.amount - b.amount)
        setPaymentLinks(sorted)
      }
    } catch (error) {
      console.error('Failed to fetch payment links:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取认证 headers
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        return {
          'Content-Type': 'application/json',
        }
      }
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.access_token) {
        return {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        }
      }
    } catch (error) {
      console.error('[PricingModal] Failed to get session:', error)
    }
    return {
      'Content-Type': 'application/json',
    }
  }, [getSupabaseClient])

  const startCheckout = async (paymentLinkId: string) => {
    try {
      setCheckingOutId(paymentLinkId)
      
      console.log('[PricingModal] Starting checkout:', { paymentLinkId })
      
      // 防止无限循环：如果已经在重定向，不再重定向
      if (redirectingToLogin) {
        console.warn('[PricingModal] Already redirecting to login, skipping')
        return
      }
      
      // 获取认证 headers
      const headers = await getAuthHeaders()
      
      // Get current URL for redirect after login
      const returnTo = typeof window !== 'undefined' ? window.location.href : '/'
      
      const res = await fetch('/api/payment/payment-link', {
        method: 'POST',
        headers,
        body: JSON.stringify({ payment_link_id: paymentLinkId }),
      })
      
      console.log('[PricingModal] API response status:', res.status)
      console.log('[PricingModal] API response headers:', Object.fromEntries(res.headers.entries()))
      
      // 先读取响应文本，以便调试
      const responseText = await res.text()
      console.log('[PricingModal] API response text:', responseText)
      
      interface PaymentLinkResponse {
        success?: boolean
        payment_link_url?: string
        recharge_id?: string
        error?: string
        details?: string
      }
      
      let json: PaymentLinkResponse
      try {
        json = JSON.parse(responseText) as PaymentLinkResponse
        console.log('[PricingModal] API response data:', json)
      } catch (parseError) {
        console.error('[PricingModal] Failed to parse JSON response:', parseError)
        throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}`)
      }
      
      // Handle 401 Unauthorized - redirect to login
      if (res.status === 401) {
        console.warn('[PricingModal] 401 Unauthorized - redirecting to login')
        
        // 防止无限循环：检查是否已经重定向过
        const redirectKey = 'payment_checkout_redirect_attempt'
        const redirectAttempt = sessionStorage.getItem(redirectKey)
        const now = Date.now()
        
        if (redirectAttempt) {
          const lastAttempt = parseInt(redirectAttempt, 10)
          // 如果 5 秒内已经重定向过，不再重定向
          if (now - lastAttempt < 5000) {
            console.error('[PricingModal] 检测到无限循环，停止重定向')
            alert('登录状态异常，请刷新页面后重试')
            return
          }
        }
        
        // 记录重定向尝试
        sessionStorage.setItem(redirectKey, now.toString())
        
        setRedirectingToLogin(true)
        setPostLoginRedirect(returnTo)
        onClose() // Close modal first
        
        // 延迟重定向，避免立即触发
        setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(returnTo)}`)
        }, 100)
        return
      }
      
      // 清除重定向尝试记录（成功时）
      sessionStorage.removeItem('payment_checkout_redirect_attempt')
      
      if (!res.ok || !json?.success) {
        const errorMsg = json?.error || json?.details || 'Failed to start checkout'
        console.error('[PricingModal] Checkout failed:', {
          status: res.status,
          ok: res.ok,
          success: json?.success,
          error: errorMsg,
          fullResponse: json
        })
        throw new Error(errorMsg)
      }

      if (json?.recharge_id) {
        try {
          localStorage.setItem('pending_recharge_id', String(json.recharge_id))
          console.log('[PricingModal] Saved recharge_id:', json.recharge_id)
        } catch {
          // ignore
        }
      }

      if (json?.payment_link_url) {
        const paymentUrl = String(json.payment_link_url).trim()
        console.log('[PricingModal] Redirecting to payment link:', paymentUrl)
        console.log('[PricingModal] Payment URL validation:', {
          url: paymentUrl,
          isValid: paymentUrl.startsWith('http'),
          length: paymentUrl.length
        })
        
        // 确保 URL 有效
        if (!paymentUrl || !paymentUrl.startsWith('http')) {
          throw new Error(`Invalid payment URL: ${paymentUrl}`)
        }
        
        // 使用 window.location.href 而不是 assign，更可靠
        window.location.href = paymentUrl
        return
      }

      throw new Error('Missing payment_link_url in response')
    } catch (e) {
      console.error('[PricingModal] Checkout error:', e)
      const errorMessage = e instanceof Error ? e.message : 'Checkout failed. Please try again.'
      
      // Use a more visible error display
      alert(`Payment Error: ${errorMessage}\n\nPlease check the console for more details.`)
    } finally {
      setCheckingOutId(null)
    }
  }

  if (!isOpen) return null

  const starterLink = getStarterLink(paymentLinks)
  const packLinks = getPackLinks(paymentLinks)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Begin Your Journey, Risk-Free
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Prominent Toggle */}
          {(starterLink || packLinks.length > 0) && (
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
              {starterLink && (
                <Button
                  type="button"
                  variant={view === 'starter' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setView('starter')}
                >
                  Start for ${starterLink.amount.toFixed(2)}
                </Button>
              )}
              {packLinks.length > 0 && (
                <Button
                  type="button"
                  variant={view === 'packs' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setView('packs')}
                >
                  Upgrade Packs
                </Button>
              )}
            </div>
          )}

          {/* Path A: Free Trial */}
          <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Path A: Full Free Trial
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Click &quot;Try Sora2 Free&quot;. Receive <strong className="font-semibold">30 credits immediately</strong> — 
              no payment needed, <strong className="font-semibold">no credit card asked for at all</strong>. 
              Your email is used solely to create your account. This is your safe space to experiment.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-green-200 dark:bg-green-800"></div>
              <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
                Completely Free • No Credit Card Required
              </span>
              <div className="flex-1 h-px bg-green-200 dark:bg-green-800"></div>
            </div>
          </div>

          {/* Path B: Secure Purchase */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Path B: Secure Purchase for Permanent Creation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose a credit pack below. All transactions are protected by <strong className="font-semibold">SSL encryption</strong> 
              and processed by <strong className="font-semibold">PCI-DSS compliant partners</strong>. 
              We <strong className="font-semibold">never store your full payment details</strong>. Buy with confidence.
            </p>
          </div>

          {/* Plans List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-energy-water"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(view === 'starter' && starterLink ? [starterLink] : packLinks).map((link) => (
                <Card
                  key={link.id}
                  className={`relative ${
                    view === 'starter' || link.amount === 39
                      ? 'border-2 border-energy-gold-mid dark:border-energy-gold-soft shadow-lg'
                      : ''
                  }`}
                >
                  {(view === 'starter' || link.amount === 39) && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-energy-water text-white shadow-custom-md">
                      {view === 'starter' ? 'Starter Deal' : 'Most Popular'}
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl text-center">
                      {link.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Price */}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-energy-water dark:text-energy-soft">
                        ${link.amount}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {link.currency.toUpperCase()}
                      </div>
                    </div>

                    {/* Video Count */}
                    <div className="text-center py-4 border-t border-b border-gray-200 dark:border-gray-700">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {link.videos} Videos
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {link.credits} Credits
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      {link.description}
                    </p>

                    {/* Price per Video */}
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                      ~ ${(link.amount / link.videos).toFixed(2)} / video
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      className="w-full"
                      disabled={!!checkingOutId}
                      onClick={() => startCheckout(link.id)}
                    >
                      {checkingOutId === link.id ? 'Redirecting…' : 'Continue to Checkout'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {/* Comparison hint for upgrade packs */}
              {view === 'packs' && starterLink && packLinks.length > 0 && (
                <div className="col-span-full mt-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Or{' '}
                    <button
                      onClick={() => setView('starter')}
                      className="font-semibold text-energy-water hover:text-energy-water-deep underline"
                    >
                      start with the ${starterLink.amount.toFixed(2)} starter pack
                    </button>
                    {' '}first →
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Security Information */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security & Purchase Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700 dark:text-gray-300">
              <div>
                <p className="font-semibold mb-1 text-gray-900 dark:text-white">Payment Security:</p>
                <ul className="space-y-1">
                  <li>• SSL encryption for all transactions</li>
                  <li>• PCI-DSS compliant payment processing</li>
                  <li>• We never store your full payment details</li>
                  <li>• Supports credit cards, debit cards, and more</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1 text-gray-900 dark:text-white">Credits Information:</p>
                <ul className="space-y-1">
                  <li>• Credits automatically added after payment</li>
                  <li>• Each video generation consumes 10 credits</li>
                  <li>• Credits are permanent with no expiration</li>
                  <li>• Free trial: 30 credits, no payment required</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

