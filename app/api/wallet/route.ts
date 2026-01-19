import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // Get user profile by auth.uid() (users.id 应与 auth.uid 一致；RLS 只允许 id=auth.uid() 的行)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle<{ id: string }>()

    if (profileError || !profile) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // Get wallet info
    const { data: wallet, error: walletError } = await supabase
      .from('credit_wallet')
      .select('permanent_credits, bonus_credits, bonus_expires_at')
      .eq('user_id', profile.id)
      .maybeSingle<{
        permanent_credits: number | null
        bonus_credits: number | null
        bonus_expires_at: string | null
      }>()

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('获取钱包信息失败:', walletError)
      return NextResponse.json({ error: '获取钱包信息失败' }, { status: 500 })
    }

    // Calculate valid bonus credits
    const now = new Date()
    const expiresAt = wallet?.bonus_expires_at ? new Date(wallet.bonus_expires_at) : null
    const validBonusCredits =
      expiresAt && expiresAt > now ? (wallet?.bonus_credits || 0) : 0

    const permanentCredits = wallet?.permanent_credits || 0
    const totalAvailable = permanentCredits + validBonusCredits

    return NextResponse.json({
      success: true,
      wallet: {
        permanentCredits,
        bonusCredits: validBonusCredits,
        bonusExpiresAt: wallet?.bonus_expires_at || null,
        totalAvailable,
      },
    })
  } catch (error) {
    console.error('获取钱包信息失败:', error)
    return NextResponse.json(
      { error: '获取钱包信息失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
