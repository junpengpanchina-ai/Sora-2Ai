import { NextResponse } from 'next/server'
import { PRICING_CONFIG } from '@/lib/billing/config'
import type { PlanId } from '@/lib/billing/config'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 60 // 缓存60秒

// GET - 获取激活的支付计划（公开访问）
// 现在使用统一的 PRICING_CONFIG 而不是数据库
export async function GET() {
  try {
    // 从 PRICING_CONFIG 生成计划列表
    const plans = (['starter', 'creator', 'studio', 'pro'] as PlanId[])
      .map((planId) => {
        const config = PRICING_CONFIG.plans[planId]
        if (!config || config.priceUsd === 0) return null

        // 计算视频数量（基于永久积分）
        const videos = Math.floor(config.permanentCredits / PRICING_CONFIG.modelCosts.sora)
        const totalCredits = config.permanentCredits + config.bonusCredits

        return {
          id: planId,
          plan_name: config.ui.title,
          plan_type: planId === 'starter' ? 'starter' : 'pack',
          amount: config.priceUsd,
          currency: 'usd',
          credits: totalCredits,
          videos: videos || Math.floor(totalCredits / PRICING_CONFIG.modelCosts.sora),
          description: ('bullets' in config.ui && config.ui.bullets ? config.ui.bullets.join('. ') : config.ui.title),
          badge_text: config.ui.badge || null,
          stripe_buy_button_id: null,
          stripe_payment_link_id: null, // 使用新的 Checkout Session，不需要 Payment Link
          is_active: true,
          is_recommended: planId === 'creator', // Creator 是推荐档位
          display_order: planId === 'starter' ? 1 : planId === 'creator' ? 2 : planId === 'studio' ? 3 : 4,
        }
      })
      .filter((p) => p !== null)

    const response = NextResponse.json({
      success: true,
      plans: plans,
    })
    
    // 🔥 Pro 计划优化：添加 CDN 缓存 headers（利用 Vercel Edge Network）
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    )
    
    return response
  } catch (error) {
    console.error('获取支付计划异常:', error)
    return NextResponse.json({
      success: true,
      plans: [],
    })
  }
}

