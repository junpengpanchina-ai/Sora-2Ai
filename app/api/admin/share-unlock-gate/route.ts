import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ShareUnlockGateMetrics {
  share_unlock_claim_rate: number | null
  share_unlock_to_download_rate: number | null
  share_unlock_to_paid_rate: number | null
  paid_without_share_rate: number | null
  download_nowm_via_share_ratio: number | null
}

interface ShareUnlockGateResponse {
  success: boolean
  gate: 'GREEN' | 'YELLOW' | 'RED' | 'LOCKDOWN'
  metrics: ShareUnlockGateMetrics
  recommendedAction: string
  cannibalizationRisk: 'Low' | 'Medium' | 'High'
}

export async function GET() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServiceClient()

    // 调用 Gate RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: gateData, error: gateError } = await (supabase as any).rpc('rpc_share_unlock_conversion_gate')

    if (gateError || !gateData || !Array.isArray(gateData) || gateData.length === 0) {
      return NextResponse.json({
        success: false,
        gate: 'LOCKDOWN',
        metrics: {
          share_unlock_claim_rate: null,
          share_unlock_to_download_rate: null,
          share_unlock_to_paid_rate: null,
          paid_without_share_rate: null,
          download_nowm_via_share_ratio: null,
        },
        recommendedAction: 'Insufficient data. Wait for more share-unlock activity.',
        cannibalizationRisk: 'Low',
      })
    }

    const row = gateData[0] as {
      gate: string
      share_unlock_claim_rate: number | null
      share_unlock_to_download_rate: number | null
      share_unlock_to_paid_rate: number | null
      paid_without_share_rate: number | null
      download_nowm_via_share_ratio: number | null
      recommended_action: string
    }

    const gate = (row.gate === 'GREEN' || row.gate === 'YELLOW' || row.gate === 'RED' ? row.gate : 'LOCKDOWN') as 'GREEN' | 'YELLOW' | 'RED' | 'LOCKDOWN'

    const cannibalizationRisk: 'Low' | 'Medium' | 'High' =
      gate === 'RED' ? 'High' : gate === 'YELLOW' ? 'Medium' : 'Low'

    return NextResponse.json({
      success: true,
      gate,
      metrics: {
        share_unlock_claim_rate: row.share_unlock_claim_rate,
        share_unlock_to_download_rate: row.share_unlock_to_download_rate,
        share_unlock_to_paid_rate: row.share_unlock_to_paid_rate,
        paid_without_share_rate: row.paid_without_share_rate,
        download_nowm_via_share_ratio: row.download_nowm_via_share_ratio,
      },
      recommendedAction: row.recommended_action || 'No action required.',
      cannibalizationRisk,
    } as ShareUnlockGateResponse)
  } catch (e) {
    console.error('[share-unlock-gate]', e)
    return NextResponse.json(
      { error: 'Failed to compute share-unlock gate', message: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 }
    )
  }
}
