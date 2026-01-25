import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createChatCompletion } from '@/lib/grsai/client'
import { validateAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getInternalToken() {
  const token = process.env.PROMPT_GEN_INTERNAL_TOKEN
  return typeof token === 'string' && token.trim().length > 0 ? token.trim() : null
}

function hasValidInternalToken(request: NextRequest): boolean {
  const token = getInternalToken()
  if (!token) return false
  const provided = request.headers.get('x-internal-token')
  return typeof provided === 'string' && provided === token
}

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (siteUrl) return siteUrl
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

type GeneratedItem = {
  content: string
  variables?: Record<string, unknown>
  notes?: string
}

function safeJsonParseArray(raw: string): unknown[] {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // ignore
  }
  const match = cleaned.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('无法找到 JSON 数组')
  const parsed = JSON.parse(match[0])
  if (!Array.isArray(parsed)) throw new Error('JSON 解析结果不是数组')
  return parsed
}

function normalizeItems(raw: unknown[]): GeneratedItem[] {
  const items: GeneratedItem[] = []
  for (const it of raw) {
    if (!it || typeof it !== 'object') continue
    const obj = it as Record<string, unknown>
    const content = typeof obj.content === 'string' ? obj.content.trim() : ''
    if (!content) continue
    items.push({
      content,
      variables: typeof obj.variables === 'object' && obj.variables !== null ? (obj.variables as Record<string, unknown>) : undefined,
      notes: typeof obj.notes === 'string' ? obj.notes : undefined,
    })
  }
  return items
}

function buildPrompt(opts: {
  industry: string
  scene: string
  locale: string
  n: number
  modelId: string
  role: string
}) {
  return `
You are generating PRODUCT prompt templates for an AI video generator.
These prompts are NOT SEO content. Do NOT write SEO titles, meta, or blog copy.
Output MUST be valid JSON only. No markdown.

Generate ${opts.n} prompt templates for:
- industry: ${opts.industry}
- scene: ${opts.scene}
- locale: ${opts.locale}
- model_id: ${opts.modelId}
- role: ${opts.role}

HARD RULES:
1) Output JSON array only. Example:
[
  {"content":"...","variables":{"brand":{"example":"Acme"},"goal":{"example":"increase CTR"},"duration":{"example":"10s"},"aspect_ratio":{"example":"9:16"}},"notes":"optional"},
  ...
]
2) Each content must be copy-paste usable as a generation prompt.
3) Keep content concise (80–220 words), executable, with clear constraints.
4) Include placeholders: {{brand}}, {{goal}}, {{duration}}, {{aspect_ratio}}.
5) Include safety constraints in the prompt body: no copyrighted characters, no violence, no real brand logos unless provided.
6) No duplicates.

Return JSON array only.
`.trim()
}

async function generateWithFallback(models: string[], system: string, user: string): Promise<GeneratedItem[]> {
  let lastErr: unknown = null
  for (const model of models) {
    try {
      const res = await createChatCompletion({
        model,
        stream: false,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      })

      const content = res.choices?.[0]?.message?.content || ''
      if (!content.trim()) {
        throw new Error(`模型 ${model} 返回空内容`)
      }
      const arr = safeJsonParseArray(content)
      const items = normalizeItems(arr)
      if (items.length === 0) {
        throw new Error(`模型 ${model} 返回 0 条有效 items`)
      }
      return items
    } catch (e) {
      lastErr = e
      continue
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('所有模型生成失败')
}

/**
 * POST /api/admin/prompt-templates/batch-generate/process
 * 处理一个 cell（industry x scene），链式调用，避免超时。
 */
export async function POST(request: NextRequest) {
  try {
    // Either an admin session OR an internal token is required.
    // Reason: chain calls (server-to-server) do not carry browser cookies.
    const adminUser = await validateAdminSession()
    const internalOk = hasValidInternalToken(request)
    if (!adminUser && !internalOk) {
      return NextResponse.json(
        { error: '未授权（需要管理员会话或内部 token）' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => null)
    const taskId = body?.taskId as string | undefined
    if (!taskId) {
      return NextResponse.json({ error: '缺少 taskId' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasksTable = () => supabase.from('prompt_generation_tasks') as any

    const { data: task, error: fetchErr } = await tasksTable().select('*').eq('id', taskId).single()
    if (fetchErr || !task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    if (task.should_stop || task.status === 'cancelled') {
      return NextResponse.json({ success: true, message: '任务已取消' })
    }

    if (task.is_paused) {
      return NextResponse.json({ success: true, message: '任务已暂停' })
    }

    if (task.status === 'pending') {
      await tasksTable()
        .update({ status: 'processing', started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', taskId)
    }

    const industries: string[] = task.industries || []
    const scenes: string[] = task.scenes || []
    const totalCells = industries.length * scenes.length
    const currentIdx = Number(task.current_cell_index || 0)

    if (currentIdx >= totalCells) {
      await tasksTable()
        .update({
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
      return NextResponse.json({ success: true, message: '任务已完成' })
    }

    const industry = industries[Math.floor(currentIdx / scenes.length)]
    const scene = scenes[currentIdx % scenes.length]
    const perCellCount = Number(task.per_cell_count || 10)

    const models = [task.primary_model, task.secondary_model, task.fallback_model].filter(Boolean) as string[]
    const systemPrompt = `You are an expert prompt engineer. Output strictly valid JSON.`
    const userPrompt = buildPrompt({
      industry,
      scene,
      locale: task.locale || 'en',
      n: perCellCount,
      modelId: task.model_id || 'sora',
      role: task.role || 'default',
    })

    let items: GeneratedItem[] = []
    let lastError: string | null = null

    for (let attempt = 0; attempt < Number(task.max_retries_per_cell || 2); attempt++) {
      try {
        items = await generateWithFallback(models, systemPrompt, userPrompt)
        lastError = null
        break
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
      }
    }

    if (items.length === 0) {
      // record error and continue next cell (do not block entire batch)
      await tasksTable()
        .update({
          current_cell_index: currentIdx + 1,
          last_error: `${industry}/${scene}: ${lastError || 'unknown error'}`,
          progress: Math.round(((currentIdx + 1) / Math.max(totalCells, 1)) * 100),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
    } else {
      // Resolve scene_id (optional)
      let resolvedSceneId: string | null = null
      if (Array.isArray(task.scene_ids) && task.scene_ids.length > 0) {
        resolvedSceneId = task.scene_ids[currentIdx % task.scene_ids.length] ?? null
      }

      // Insert into prompt_templates
      const insertRows = items.map((it) => ({
        owner_scope: task.owner_scope || 'scene',
        scene_id: resolvedSceneId,
        model_id: task.model_id || 'sora',
        role: task.role || 'default',
        content: it.content,
        variables: it.variables ?? {},
        version: 1,
        status: 'draft',
        is_published: false,
        weight: 100,
        rollout_pct: 100,
        locale: task.locale || 'en',
        notes: it.notes ?? `auto-generated: ${industry} / ${scene}`,
        created_by: adminUser?.id ?? null,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertErr } = await (supabase as any).from('prompt_templates').insert(insertRows)
      if (insertErr) {
        lastError = insertErr.message || String(insertErr)
      }

      const createdCount = insertErr ? 0 : insertRows.length
      const newTotalCreated = Number(task.total_created || 0) + createdCount

      await tasksTable()
        .update({
          current_cell_index: currentIdx + 1,
          total_created: newTotalCreated,
          last_error: insertErr ? `${industry}/${scene}: insert failed: ${lastError}` : null,
          progress: Math.round(((currentIdx + 1) / Math.max(totalCells, 1)) * 100),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
    }

    // chain next cell
    const processUrl = `${getSiteUrl()}/api/admin/prompt-templates/batch-generate/process`
    const token = getInternalToken()
    fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-internal-token': token } : {}),
      },
      body: JSON.stringify({ taskId }),
    }).catch((err) => {
      console.error('[prompt-gen process] chain call failed:', err)
    })

    return NextResponse.json({
      success: true,
      message: `processed ${industry} / ${scene}`,
      currentIndex: currentIdx + 1,
      totalCells,
    })
  } catch (error) {
    console.error('[admin/prompt-templates/batch-generate/process] failed:', error)
    return NextResponse.json(
      { error: '处理失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

