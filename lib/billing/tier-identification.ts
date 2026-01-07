/**
 * 充值档位识别与配置
 * 
 * 根据支付金额识别用户购买的档位，并返回对应的永久积分、Bonus 积分和过期时间
 */

export type PlanId = 'starter' | 'creator' | 'studio' | 'pro'

export interface TierConfig {
  planId: PlanId
  permanentCredits: number
  bonusCredits: number
  bonusExpiresDays: number
  isStarter: boolean
}

/**
 * 根据支付金额（USD）识别充值档位
 * 
 * 档位定义（海外市场）：
 * - Starter Access: $4.90 → 200 bonus credits (7 days), 0 permanent
 * - Creator: $39 → 2,000 permanent + 600 bonus (14 days)
 * - Studio: $99 → 6,000 permanent + 1,500 bonus (30 days)
 * - Pro: $299 → 20,000 permanent + 4,000 bonus (60 days)
 */
export function identifyTierFromAmount(amountUsd: number): TierConfig | null {
  // 允许 ±$0.50 的误差（支付手续费、汇率波动等）
  const tolerance = 0.5

  if (Math.abs(amountUsd - 4.9) <= tolerance) {
    // Starter Access (7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    return {
      planId: 'starter',
      permanentCredits: 0,
      bonusCredits: 200,
      bonusExpiresDays: 7,
      isStarter: true,
    }
  }

  if (Math.abs(amountUsd - 39) <= tolerance) {
    // Creator Pack
    return {
      planId: 'creator',
      permanentCredits: 2000,
      bonusCredits: 600,
      bonusExpiresDays: 14,
      isStarter: false,
    }
  }

  if (Math.abs(amountUsd - 99) <= tolerance) {
    // Studio Pack
    return {
      planId: 'studio',
      permanentCredits: 6000,
      bonusCredits: 1500,
      bonusExpiresDays: 30,
      isStarter: false,
    }
  }

  if (Math.abs(amountUsd - 299) <= tolerance) {
    // Pro Pack
    return {
      planId: 'pro',
      permanentCredits: 20000,
      bonusCredits: 4000,
      bonusExpiresDays: 60,
      isStarter: false,
    }
  }

  // 未识别的金额，返回 null（可能需要手动处理）
  return null
}

/**
 * 计算 Bonus 积分的过期时间（ISO 字符串）
 */
export function calculateBonusExpiresAt(daysFromNow: number): string {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + daysFromNow)
  return expiresAt.toISOString()
}

