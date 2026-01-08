// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { addCreditsToWallet } from '@/lib/credit-wallet'
import { identifyTierFromAmount, calculateBonusExpiresAt } from '@/lib/billing/tier-identification'
// IP utils removed - not used in current version

// 禁用 Next.js 的 body 解析，因为我们需要原始 body 来验证签名
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Webhook signature secret (obtained from Stripe Dashboard)
// Lazy access to avoid build-time errors
function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }
  return secret
}

// Credits exchange rate (legacy, for fallback)
const CREDITS_PER_USD = 100 // 1 USD = 100 credits

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // 验证 Webhook 签名
    const stripe = getStripe()
    const webhookSecret = getWebhookSecret()
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // 处理支付成功事件
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      console.log('[webhook] checkout.session.completed', {
        session_id: session.id,
        payment_status: session.payment_status,
        metadata: session.metadata,
        amount_total: session.amount_total,
      });

      const supabase = await createClient()

      // 幂等性检查：检查 purchases 表是否已处理过此 session
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('provider', 'stripe')
        .eq('provider_payment_id', session.id)
        .limit(1)
        .maybeSingle();

      if (existingPurchase) {
        console.log('[webhook] Payment already processed (idempotency):', session.id);
        return NextResponse.json({ 
          success: true, 
          message: 'Already processed',
          alreadyApplied: true 
        });
      }

      // 统一识别策略：1) metadata.plan_id 2) payment_link_id → planFromPaymentLink
      // ❌ 不使用金额兜底（容易误判）
      let planId: string | undefined = session.metadata?.plan_id as string | undefined;
      let userId = session.metadata?.user_id;

      // 回退：从 payment_link 识别
      if (!planId) {
        const paymentLinkId = typeof session.payment_link === 'string' 
          ? session.payment_link 
          : null;
        if (paymentLinkId) {
          const { planFromPaymentLink } = await import('@/lib/billing/planConfig');
          const plan = planFromPaymentLink(paymentLinkId);
          if (plan) {
            planId = plan.planId;
          }
        }
      }

      // 如果还是没有识别到 plan，返回错误（不使用金额兜底）
      if (!planId || !(planId === 'starter' || planId === 'creator' || planId === 'studio' || planId === 'pro')) {
        console.error('[webhook] Cannot identify plan:', {
          session_id: session.id,
          metadata_plan_id: session.metadata?.plan_id,
          payment_link: session.payment_link,
        });
        return NextResponse.json(
          { 
            error: 'Cannot identify plan. Missing metadata.plan_id or payment_link',
            details: 'Plan identification requires either metadata.plan_id or a valid payment_link_id'
          },
          { status: 400 }
        );
      }

      let amountUsd = session.metadata?.amount_usd 
        ? parseFloat(session.metadata.amount_usd)
        : (session.amount_total ? session.amount_total / 100 : 0);

      // 使用新钱包系统
      if (planId) {
        console.log('[webhook] Using Checkout Session metadata:', { planId, userId, amountUsd });

        // 如果没有 userId，尝试从 customer_email 查找
        if (!userId && session.customer_email) {
          const { data: userRecord } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.customer_email)
            .single();

          if (userRecord) {
            userId = userRecord.id;
          }
        }

        if (!userId) {
          console.error('[webhook] Cannot find user for Checkout Session:', session.id);
          return NextResponse.json(
            { error: 'User not found' },
            { status: 400 }
          );
        }

        // 使用 grant_credits_for_purchase RPC 函数（原子性 + 幂等性）
        // 注意：这个函数会自动根据 plan_id 计算积分并插入 purchases 记录
        const paymentLinkId = typeof session.payment_link === 'string' 
          ? session.payment_link 
          : (session.metadata?.payment_link_id as string | undefined) || '';
        
        // @ts-expect-error - Supabase RPC type inference issue
        const { error: grantErr } = await supabase.rpc('grant_credits_for_purchase', {
          p_user_id: userId,
          p_plan_id: planId,
          p_payment_link_id: paymentLinkId,
          p_stripe_event_id: event.id,
          p_stripe_session_id: session.id,
          p_stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          p_email: session.customer_email || null,
          p_amount_total: session.amount_total || null,
          p_currency: session.currency || 'usd',
        });

        if (grantErr) {
          console.error('[webhook] Failed to grant credits:', grantErr);
          return NextResponse.json(
            { error: 'Failed to grant credits', details: grantErr.message },
            { status: 500 }
          );
        }

        console.log('[webhook] Purchase applied successfully:', {
          planId,
          userId,
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Payment processed successfully',
          planId,
        });
      }

      // 回退到旧逻辑（Payment Link 方式）
      // 从 metadata 中获取充值信息（Payment Link）
      let rechargeId = session.metadata?.recharge_id
      userId = session.metadata?.user_id
      let amount = parseFloat(session.metadata?.amount || '0')
      let credits = parseInt(session.metadata?.credits || '0')

      // 如果没有 metadata，可能是 Payment Link 支付，尝试通过 client_reference_id 查找
      if (!rechargeId && session.client_reference_id) {
        const { data: rechargeRecord } = await supabase
          .from('recharge_records')
          .select('*')
          .eq('id', session.client_reference_id)
          .single()

        if (rechargeRecord) {
          rechargeId = rechargeRecord.id
          userId = rechargeRecord.user_id
          amount = parseFloat(rechargeRecord.amount.toString())
          credits = rechargeRecord.credits
        }
      }

      // 如果还是没有找到，尝试通过 customer_email 查找最近的 pending 充值记录
      if (!rechargeId && session.customer_email) {
        const { data: userRecord } = await supabase
          .from('users')
          .select('id')
          .eq('email', session.customer_email)
          .single()

        if (userRecord) {
          // 查找最近的 pending 充值记录（Payment Link）
          const { data: recentRecharge } = await supabase
            .from('recharge_records')
            .select('*')
            .eq('user_id', userRecord.id)
            .eq('status', 'pending')
            .eq('payment_method', 'stripe_payment_link')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (recentRecharge) {
            rechargeId = recentRecharge.id
            userId = recentRecharge.user_id
            amount = parseFloat(recentRecharge.amount.toString())
            credits = recentRecharge.credits
          }
        }
      }

      // If still no recharge record found, try to create one from session data
      // This handles direct Payment Link payments without pre-created records
      if (!rechargeId || !userId) {
        console.log('No recharge record found, attempting to create from session data:', {
          session_id: session.id,
          client_reference_id: session.client_reference_id,
          customer_email: session.customer_email,
          amount_total: session.amount_total,
          currency: session.currency,
        })

        // Try to find user by email
        if (session.customer_email) {
          const { data: userRecord } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.customer_email)
            .single()

          if (userRecord) {
            userId = userRecord.id
            // Calculate amount and credits from session
            amount = session.amount_total ? session.amount_total / 100 : 0 // Convert from cents
            credits = Math.round(amount * CREDITS_PER_USD) // 1 USD = 100 credits

            // Create recharge record retroactively
            const { data: newRechargeRecord, error: createError } = await supabase
              .from('recharge_records')
              .insert({
                user_id: userId,
                amount: amount,
                credits: credits,
                payment_method: 'stripe_payment_link',
                payment_id: session.id,
                status: 'pending', // Will be updated to completed below
              })
              .select()
              .single()

            if (newRechargeRecord && !createError) {
              rechargeId = newRechargeRecord.id
              console.log('Created recharge record retroactively:', rechargeId)
            } else {
              console.error('Failed to create recharge record:', createError)
            }
          }
        }

        // If still no recharge record, log error but don't fail
        if (!rechargeId || !userId) {
          console.error('Cannot process payment: missing recharge information', {
            session_id: session.id,
            customer_email: session.customer_email,
          })
          return NextResponse.json(
            { error: 'Missing required recharge information and cannot create record' },
            { status: 400 }
          )
        }
      }

      // 查找充值记录
      const { data: rechargeRecord, error: findError } = await supabase
        .from('recharge_records')
        .select('*')
        .eq('id', rechargeId)
        .single()

      if (findError || !rechargeRecord) {
        console.error('Recharge record not found:', rechargeId, findError)
        return NextResponse.json(
          { error: 'Recharge record not found' },
          { status: 404 }
        )
      }

      // 检查是否已经处理过
      if (rechargeRecord.status === 'completed') {
        console.log('Recharge already completed:', rechargeId)
        return NextResponse.json({ success: true, message: 'Already processed' })
      }

      // 识别充值档位（根据金额）
      amountUsd = amount
      const tierConfig = identifyTierFromAmount(amountUsd)

      if (!tierConfig) {
        // 未识别的金额，使用旧逻辑（全部作为永久积分）
        console.warn(`[webhook] Unrecognized payment amount: $${amountUsd}, using fallback logic`)
        const walletResult = await addCreditsToWallet(
          supabase,
          userId,
          credits, // 全部作为永久积分
          0,
          null,
          false
        )

        if (!walletResult.success) {
          console.error('Failed to add credits to wallet (fallback):', walletResult.error)
          return NextResponse.json(
            { error: 'Failed to add credits to wallet', details: walletResult.error },
            { status: 500 }
          )
        }
      } else {
        // 使用新钱包系统：永久积分 + Bonus 积分
        const bonusExpiresAt = calculateBonusExpiresAt(tierConfig.bonusExpiresDays)

        const walletResult = await addCreditsToWallet(
          supabase,
          userId,
          tierConfig.permanentCredits,
          tierConfig.bonusCredits,
          bonusExpiresAt,
          tierConfig.isStarter
        )

        if (!walletResult.success) {
          console.error('Failed to add credits to wallet:', walletResult.error)
          return NextResponse.json(
            { error: 'Failed to add credits to wallet', details: walletResult.error },
            { status: 500 }
          )
        }

        console.log(`[webhook] Added credits for tier ${tierConfig.planId}:`, {
          permanent: tierConfig.permanentCredits,
          bonus: tierConfig.bonusCredits,
          expiresDays: tierConfig.bonusExpiresDays,
          isStarter: tierConfig.isStarter,
        })
      }

      // 更新充值记录状态
      const { error: recordUpdateError } = await supabase
        .from('recharge_records')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          payment_id: session.id,
        })
        .eq('id', rechargeId)

      if (recordUpdateError) {
        console.error('Failed to update recharge record:', recordUpdateError)
        // 即使更新记录失败，积分已经添加，所以返回成功
      }

      console.log(`Payment successful: Recharge ${rechargeId}, User ${userId}, Credits ${credits}`)
      return NextResponse.json({ success: true, message: 'Payment processed successfully' })
    }

    // 处理支付失败事件
    if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object as Stripe.Checkout.Session
      const rechargeId = session.metadata?.recharge_id

      if (rechargeId) {
        const supabase = await createClient()
        await supabase
          .from('recharge_records')
          .update({ status: 'failed' })
          .eq('id', rechargeId)
      }

      return NextResponse.json({ success: true, message: 'Payment failure recorded' })
    }

    // 其他事件类型，返回成功但不处理
    return NextResponse.json({ success: true, message: 'Event received but not processed' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

