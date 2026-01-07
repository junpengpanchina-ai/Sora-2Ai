// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { deductCreditsFromWallet, addCreditsToWallet } from '@/lib/credit-wallet'

type SupabaseServerClient = SupabaseClient<Database>
type ConsumptionRecordRow = Database['public']['Tables']['consumption_records']['Row']
type ConsumptionRecordInsert = Database['public']['Tables']['consumption_records']['Insert']
type RechargeRecordInsert = Database['public']['Tables']['recharge_records']['Insert']
// 视频生成消耗的积分（按模型类型）
// Sora: 10 credits = 1 video（永久积分，日常高频）
export const CREDITS_PER_SORA_VIDEO = 10

// Veo Flash: 50 credits = 1 video（≈ 5×Sora，质量升级）
export const CREDITS_PER_VEO_FLASH_VIDEO = 50

// Veo Pro: 250 credits = 1 video（≈ 25×Sora，最终成片）
export const CREDITS_PER_VEO_PRO_VIDEO = 250

// 兼容旧代码
export const CREDITS_PER_VIDEO = CREDITS_PER_SORA_VIDEO

// 新用户注册赠送的积分（30积分 = 3美金 = 3次 Sora 视频生成机会）
// 1美金 = 10积分，所以30积分 = 3美金
export const WELCOME_BONUS_CREDITS = 30

// 模型类型定义
export type ModelType = 'sora-2' | 'veo-flash' | 'veo-pro'

/**
 * 根据模型类型获取所需积分
 */
export function getCreditsForModel(model: ModelType): number {
  switch (model) {
    case 'sora-2':
      return CREDITS_PER_SORA_VIDEO
    case 'veo-flash':
      return CREDITS_PER_VEO_FLASH_VIDEO
    case 'veo-pro':
      return CREDITS_PER_VEO_PRO_VIDEO
    default:
      return CREDITS_PER_SORA_VIDEO
  }
}

/**
 * 扣除用户积分并创建消费记录（支持按模型类型）
 *
 * 新实现：使用 credit_wallet 表和数据库函数，优先消耗 Bonus，再消耗永久积分。
 */
export async function deductCredits(
  supabase: SupabaseServerClient,
  userId: string,
  videoTaskId: string | null,
  description?: string,
  model?: ModelType
): Promise<{ success: boolean; error?: string; consumptionId?: string }> {
  try {
    const modelType = model || 'sora-2'
    const requiredCredits = getCreditsForModel(modelType)

    // 使用钱包系统扣除积分（优先 Bonus）
    const walletResult = await deductCreditsFromWallet(
      supabase,
      userId,
      requiredCredits,
      modelType
    )

    if (!walletResult.success) {
      return {
        success: false,
        error: walletResult.error || 'Insufficient credits',
      }
    }

    // 创建消费记录（用于追踪与退款）
    const consumptionPayload: ConsumptionRecordInsert = {
      user_id: userId,
      video_task_id: videoTaskId,
      credits: requiredCredits,
      description: description || `Video generation (${modelType})`,
      status: 'completed',
      model_type: modelType,
    }

    const { data: consumptionRecord, error: consumptionError } = await supabase
      .from<'consumption_records', ConsumptionRecordRow>('consumption_records')
      .insert<ConsumptionRecordInsert>(consumptionPayload)
      .select()
      .single()

    if (consumptionError) {
      console.error('Failed to create consumption record after wallet deduction:', consumptionError)
      // 钱包已经扣除积分，这里仅记录日志；如有需要可在未来补充对账逻辑
      return { success: true }
    }

    return { success: true, consumptionId: consumptionRecord.id }
  } catch (error) {
    console.error('Error in deductCredits:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * 返还用户积分（当视频生成失败时）
 *
 * 新实现：通过钱包系统返还积分（作为永久积分），并更新消费记录状态。
 */
export async function refundCredits(
  supabase: SupabaseServerClient,
  userId: string,
  consumptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 获取消费记录
    const { data: consumptionRecord, error: consumptionError } = await supabase
      .from<'consumption_records', ConsumptionRecordRow>('consumption_records')
      .select('*')
      .eq('id', consumptionId)
      .single()

    if (consumptionError || !consumptionRecord) {
      return { success: false, error: 'Consumption record not found' }
    }

    // 检查是否已经退款
    if (consumptionRecord.status === 'refunded') {
      return { success: false, error: 'Credits already refunded' }
    }

    const creditsToRefund = consumptionRecord.credits || 0
    if (creditsToRefund <= 0) {
      return { success: false, error: 'Invalid credits amount to refund' }
    }

    // 使用钱包系统返还积分（作为永久积分）
    const walletResult = await addCreditsToWallet(
      supabase,
      userId,
      creditsToRefund,
      0,
      null,
      false
    )

    if (!walletResult.success) {
      console.error('Failed to refund credits to wallet:', walletResult.error)
      return { success: false, error: walletResult.error || 'Failed to refund credits' }
    }

    // 更新消费记录状态
    const { error: recordUpdateError } = await supabase
      .from<'consumption_records', ConsumptionRecordRow>('consumption_records')
      .update({ 
        status: 'refunded',
        refunded_at: new Date().toISOString()
      })
      .eq('id', consumptionId)

    if (recordUpdateError) {
      console.error('Failed to update consumption record:', recordUpdateError)
      // 即使更新记录失败，积分已经返还，所以返回成功
    }

    return { success: true }
  } catch (error) {
    console.error('Error in refundCredits:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * 通过视频任务ID查找消费记录并返还积分
 */
export async function refundCreditsByVideoTaskId(
  supabase: SupabaseServerClient,
  userId: string,
  videoTaskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 查找消费记录
    const { data: consumptionRecord, error: findError } = await supabase
      .from<'consumption_records', ConsumptionRecordRow>('consumption_records')
      .select('*')
      .eq('user_id', userId)
      .eq('video_task_id', videoTaskId)
      .eq('status', 'completed')
      .single()

    if (findError || !consumptionRecord) {
      return { success: false, error: 'Consumption record not found' }
    }

    // 调用返还函数
    return await refundCredits(supabase, userId, consumptionRecord.id)
  } catch (error) {
    console.error('Error in refundCreditsByVideoTaskId:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * 给新用户赠送欢迎积分（注册奖励）
 *
 * 新实现：通过钱包系统添加积分，并记录一条充值记录（方便审计）。
 */
export async function addWelcomeBonus(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ success: boolean; error?: string; rechargeRecordId?: string }> {
  try {
    // 创建充值记录（记录新用户注册赠送）
    const rechargePayload: RechargeRecordInsert = {
      user_id: userId,
      amount: WELCOME_BONUS_CREDITS / 10, // 30积分 ÷ 10 = 3美金（1美金 = 10积分）
      credits: WELCOME_BONUS_CREDITS,
      payment_method: 'system',
      status: 'completed',
      metadata: {
        type: 'welcome_bonus',
      } as Record<string, unknown>,
    }

    const { data: rechargeRecord, error: rechargeError } = await supabase
      .from<'recharge_records', Database['public']['Tables']['recharge_records']['Row']>('recharge_records')
      .insert<RechargeRecordInsert>(rechargePayload)
      .select()
      .single()

    if (rechargeError || !rechargeRecord) {
      console.error('Failed to create welcome bonus recharge record:', rechargeError)
      return { success: false, error: 'Failed to create welcome bonus recharge record' }
    }

    // 通过钱包系统添加积分（作为永久积分）
    const walletResult = await addCreditsToWallet(
      supabase,
      userId,
      WELCOME_BONUS_CREDITS,
      0,
      null,
      false
    )

    if (!walletResult.success) {
      console.error('Failed to add welcome bonus to wallet:', walletResult.error)
      return { success: false, error: walletResult.error || 'Failed to add welcome bonus to wallet' }
    }

    console.log(
      `[addWelcomeBonus] Successfully added ${WELCOME_BONUS_CREDITS} credits to wallet for user ${userId}`
    )

    return { success: true, rechargeRecordId: rechargeRecord.id }
  } catch (error) {
    console.error('Error in addWelcomeBonus:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// 下面保留旧实现的导出签名（避免其他文件引用报错），但实际逻辑已经迁移到钱包系统
// refundCreditsByVideoTaskId / addWelcomeBonus 已在上方重新实现

/*
  旧实现中，这里还包含直接操作 users.credits 的逻辑。
  现在已经完全由 credit_wallet 表 + RPC 函数接管。
*/

