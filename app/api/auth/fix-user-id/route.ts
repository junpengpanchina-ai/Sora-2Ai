/**
 * 修复 users.id 与 auth.uid() 不一致的问题（如由旧 trigger 创建导致）
 * 当 users.id !== auth.uid() 时，调用 DB RPC fix_user_id_sync 在事务内迁移 id 及 FK。
 * 需先执行迁移 089_fix_user_id_sync_rpc.sql；否则 RPC 不存在会 500。
 */
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getGoogleId } from '@/lib/user'

export async function POST() {
  try {
    const supabase = await createClient()
    // 回调阶段 session 可能尚未写入 cookie，优先用 Authorization: Bearer 的 access_token 取 user
    const authHeader = (await headers()).get('authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
    const { data: { user }, error: userError } = bearer
      ? await supabase.auth.getUser(bearer)
      : await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const googleId = getGoogleId(user)
    const newId = user.id
    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.display_name ||
      null
    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      user.user_metadata?.avatar ||
      null

    const service = await createServiceClient()

    const { data: row, error: findErr } = await service
      .from('users')
      .select('id')
      .eq('google_id', googleId)
      .maybeSingle<{ id: string }>()

    if (findErr || !row) {
      return NextResponse.json({ error: 'User not found', fixed: false }, { status: 404 })
    }

    const oldId = row.id
    if (oldId === newId) {
      return NextResponse.json({ ok: true, fixed: false, message: 'Already in sync' })
    }

    // 调用 RPC：在事务内用 DEFERRED 约束先改子表 user_id，再改 users.id（迁移 089）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fix_user_id_sync 未纳入 Database 类型
    const { error: rpcErr } = await (service as any).rpc('fix_user_id_sync', {
      p_old_id: oldId,
      p_new_id: newId,
    })

    if (rpcErr) {
      console.error('[fix-user-id] fix_user_id_sync RPC failed:', rpcErr)
      return NextResponse.json(
        { error: 'Failed to fix user id', details: rpcErr.message },
        { status: 500 }
      )
    }

    // 刷新 name / avatar_url（RPC 已设 last_login_at）
    const profileUpdate: { name?: string | null; avatar_url?: string | null } = {}
    if (name != null) profileUpdate.name = name
    if (avatarUrl != null) profileUpdate.avatar_url = avatarUrl
    if (Object.keys(profileUpdate).length > 0) {
      // @ts-expect-error -- Supabase 泛型对 users 的 update 推断为 never 时的兼容写法
      await service.from('users').update(profileUpdate).eq('id', newId)
    }

    return NextResponse.json({ ok: true, fixed: true })
  } catch (e) {
    console.error('[fix-user-id]', e)
    return NextResponse.json(
      { error: 'Internal error', details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
