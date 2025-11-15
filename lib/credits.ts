// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type SupabaseServerClient = SupabaseClient<Database>
type UserCreditsRow = Pick<Database['public']['Tables']['users']['Row'], 'credits'>
type ConsumptionRecordRow = Database['public']['Tables']['consumption_records']['Row']
type ConsumptionRecordInsert = Database['public']['Tables']['consumption_records']['Insert']
// 视频生成消耗的积分（10积分/次，对应￥0.10/次）
export const CREDITS_PER_VIDEO = 10

/**
 * 扣除用户积分并创建消费记录
 */
export async function deductCredits(
  supabase: SupabaseServerClient,
  userId: string,
  videoTaskId: string | null,
  description?: string
): Promise<{ success: boolean; error?: string; consumptionId?: string }> {
  try {
    // 获取用户当前积分
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single<UserCreditsRow>()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    const currentCredits = user.credits || 0

    // 检查积分是否足够
    if (currentCredits < CREDITS_PER_VIDEO) {
      return { 
        success: false, 
        error: `Insufficient credits. Required: ${CREDITS_PER_VIDEO}, Available: ${currentCredits}` 
      }
    }

    // 创建消费记录
    const consumptionPayload: ConsumptionRecordInsert = {
      user_id: userId,
      video_task_id: videoTaskId,
      credits: CREDITS_PER_VIDEO,
      description: description || 'Video generation',
      status: 'completed',
    }

    const { data: consumptionRecord, error: consumptionError } = await supabase
      .from<'consumption_records', ConsumptionRecordRow>('consumption_records')
      .insert<ConsumptionRecordInsert>(consumptionPayload)
      .select()
      .single()

    if (consumptionError) {
      console.error('Failed to create consumption record:', consumptionError)
      return { success: false, error: 'Failed to create consumption record' }
    }

    // 扣除积分
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: currentCredits - CREDITS_PER_VIDEO })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to deduct credits:', updateError)
      // 如果扣除失败，删除消费记录
      await supabase
        .from('consumption_records')
        .delete()
        .eq('id', consumptionRecord.id)
      return { success: false, error: 'Failed to deduct credits' }
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

    // 获取用户当前积分
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single<UserCreditsRow>()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    // 返还积分
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: (user.credits || 0) + consumptionRecord.credits })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to refund credits:', updateError)
      return { success: false, error: 'Failed to refund credits' }
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

