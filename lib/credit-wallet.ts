// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type SupabaseServerClient = SupabaseClient<Database>
type ModelType = 'sora-2' | 'veo-flash' | 'veo-pro'

/**
 * 获取用户总可用积分（永久 + 未过期的 Bonus）
 */
export async function getTotalAvailableCredits(
  supabase: SupabaseServerClient,
  userId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('get_total_available_credits', { user_uuid: userId })

    if (error) {
      console.error('Error getting total credits:', error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error('Error in getTotalAvailableCredits:', error)
    return 0
  }
}

/**
 * 检查是否可以购买 Starter（只能买 1 次）
 */
export async function canPurchaseStarter(
  supabase: SupabaseServerClient,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('can_purchase_starter', { user_uuid: userId })

    if (error) {
      console.error('Error checking starter purchase:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Error in canPurchaseStarter:', error)
    return false
  }
}

/**
 * 检查 Bonus 积分是否可用于指定模型
 */
export async function canUseBonusForModel(
  supabase: SupabaseServerClient,
  userId: string,
  modelType: ModelType
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('can_use_bonus_for_model', {
        user_uuid: userId,
        model_type: modelType,
      })

    if (error) {
      console.error('Error checking bonus usage:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Error in canUseBonusForModel:', error)
    return false
  }
}

/**
 * 扣除积分（优先使用 Bonus，再使用永久）
 */
export async function deductCreditsFromWallet(
  supabase: SupabaseServerClient,
  userId: string,
  creditsNeeded: number,
  modelType: ModelType
): Promise<{
  success: boolean
  bonusUsed?: number
  permanentUsed?: number
  remainingCredits?: number
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .rpc('deduct_credits_from_wallet', {
        user_uuid: userId,
        credits_needed: creditsNeeded,
        model_type: modelType,
      })

    if (error) {
      console.error('Error deducting credits:', error)
      return { success: false, error: error.message }
    }

    if (!data || !data.success) {
      return {
        success: false,
        error: data?.error || 'Failed to deduct credits',
      }
    }

    return {
      success: true,
      bonusUsed: data.bonus_used || 0,
      permanentUsed: data.permanent_used || 0,
      remainingCredits: data.remaining_credits || 0,
    }
  } catch (error) {
    console.error('Error in deductCreditsFromWallet:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 添加积分到钱包
 */
export async function addCreditsToWallet(
  supabase: SupabaseServerClient,
  userId: string,
  permanentAmount: number = 0,
  bonusAmount: number = 0,
  bonusExpiresAt?: string,
  isStarter: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('add_credits_to_wallet', {
      user_uuid: userId,
      permanent_amount: permanentAmount,
      bonus_amount: bonusAmount,
      bonus_expires_at: bonusExpiresAt || null,
      is_starter: isStarter,
    })

    if (error) {
      console.error('Error adding credits:', error)
      return { success: false, error: error.message }
    }

    if (!data || !data.success) {
      return {
        success: false,
        error: data?.error || 'Failed to add credits',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in addCreditsToWallet:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取钱包信息
 */
export async function getWalletInfo(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{
  permanentCredits: number
  bonusCredits: number
  bonusExpiresAt: string | null
  totalAvailable: number
} | null> {
  try {
    const { data, error } = await supabase
      .from('credit_wallet')
      .select('permanent_credits, bonus_credits, bonus_expires_at')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    const now = new Date()
    const expiresAt = data.bonus_expires_at
      ? new Date(data.bonus_expires_at)
      : null

    const bonusCredits =
      expiresAt && expiresAt > now ? data.bonus_credits : 0

    return {
      permanentCredits: data.permanent_credits || 0,
      bonusCredits: bonusCredits,
      bonusExpiresAt: data.bonus_expires_at,
      totalAvailable: data.permanent_credits + bonusCredits,
    }
  } catch (error) {
    console.error('Error in getWalletInfo:', error)
    return null
  }
}

