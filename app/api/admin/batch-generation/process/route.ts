import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (siteUrl) return siteUrl
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

/**
 * POST /api/admin/batch-generation/process
 * 处理单个行业的场景词生成（链式调用，避免超时）
 * 这个 API 会被递归调用，每次处理一个行业
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json({ error: '缺少 taskId 参数' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    
    // 辅助函数：修复 Supabase 类型推断问题
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasksTable = () => supabase.from('batch_generation_tasks') as any

    // 获取任务
    const { data: task, error: fetchError } = await tasksTable()
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError || !task) {
      console.error(`[process] 获取任务失败:`, fetchError)
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    // 检查是否应该停止
    if (task.should_stop || task.status === 'cancelled') {
      return NextResponse.json({ success: true, message: '任务已取消' })
    }

    // 🔥 检查是否暂停或终止（如果暂停，等待恢复；如果终止，立即停止）
    if (task.is_paused) {
      console.log(`[process] 任务 ${taskId} 已暂停，等待恢复...`)
      // 如果任务暂停，等待恢复（最多等待 10 秒，然后返回，让前端继续轮询）
      let waitCount = 0
      while (waitCount < 10) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const { data: checkTask } = await tasksTable()
          .select('is_paused, should_stop, status')
          .eq('id', taskId)
          .single()
        
        // 如果已终止，立即返回
        if (checkTask?.should_stop || checkTask?.status === 'cancelled') {
          console.log(`[process] 任务 ${taskId} 已终止，停止处理`)
          return NextResponse.json({ success: true, message: '任务已终止' })
        }
        
        // 如果已恢复，继续处理
        if (checkTask && !checkTask.is_paused) {
          console.log(`[process] 任务 ${taskId} 已恢复，继续处理`)
          break
        }
        waitCount++
      }
      
      // 如果仍然暂停，返回让前端继续轮询
      const { data: finalCheck } = await tasksTable()
        .select('is_paused, should_stop, status')
        .eq('id', taskId)
        .single()
      
      if (finalCheck?.is_paused) {
        return NextResponse.json({ success: true, message: '任务已暂停，等待恢复' })
      }
      
      // 如果已终止，立即返回
      if (finalCheck?.should_stop || finalCheck?.status === 'cancelled') {
        return NextResponse.json({ success: true, message: '任务已终止' })
      }
    }

    // 更新状态为处理中（如果之前是 pending）
    if (task.status === 'pending') {
      await tasksTable()
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
    }

    const industries = task.industries || []
    const currentIndex = task.current_industry_index || 0

    // 如果所有行业都已处理完成
    if (currentIndex >= industries.length) {
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

    const industry = industries[currentIndex]
    const scenesPerIndustry = task.scenes_per_industry || 100
    const useCaseType = task.use_case_type || 'advertising-promotion'

    // 处理当前行业
    try {
      // 🔥 使用边生成边保存的新函数，避免数据丢失和乱码
      const { generateAndSaveScenes } = await import('./generate-and-save-scenes')
      
      console.log(`[${industry}] 开始生成 ${scenesPerIndustry} 条场景词（边生成边保存模式）...`)
      
      // 边生成边保存，每生成一批立即保存
      const result = await generateAndSaveScenes(
        industry,
        scenesPerIndustry,
        useCaseType,
        taskId,
        supabase
      )
      
      const scenes = result.scenes
      const savedCount = result.savedCount
      const failedCount = result.failedCount
      const errors = result.errors
      
      console.log(`[${industry}] 生成和保存完成: 生成 ${scenes.length} 条, 成功保存 ${savedCount} 条, 失败 ${failedCount} 条`)
      
      if (scenes.length === 0) {
        console.error(`[${industry}] ⚠️ 严重警告: 生成返回空数组！`)
        console.error(`[${industry}] 这不应该发生，因为系统应该已经自动切换到 gemini-3-flash（联网搜索）`)
        console.error(`[${industry}] 可能原因: 1) API 调用失败 2) JSON 解析失败 3) Fallback 逻辑未触发`)
        await tasksTable()
          .update({
            last_error: `${industry}: 生成返回 0 条场景词（异常情况，系统应该已自动切换到联网搜索模型）`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskId)
        
        // 即使返回空数组，也继续处理下一个行业，不中断整个任务
        const progress = Math.round(((currentIndex + 1) / industries.length) * 100)
        await tasksTable()
          .update({
            current_industry_index: currentIndex + 1,
            total_scenes_generated: (task.total_scenes_generated || 0) + 0,
            total_scenes_saved: (task.total_scenes_saved || 0) + 0,
            progress,
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskId)
        
        // 继续处理下一个行业
        if (currentIndex + 1 < industries.length) {
          const processUrl = `${getSiteUrl()}/api/admin/batch-generation/process`
          fetch(processUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId }),
          }).catch((err) => {
            console.error(`[process] 链式调用失败:`, err)
          })
        }
        
        return NextResponse.json({ success: true, message: `${industry} 生成返回空数组，继续处理下一个行业` })
      }
      
      // 🔥 场景词已经在 generateAndSaveScenes 中边生成边保存了
      // 这里只需要记录结果
      if (errors.length > 0 && errors.length <= 5) {
        console.error(`[${industry}] 保存错误详情:`, errors)
      } else if (errors.length > 5) {
        console.error(`[${industry}] 保存错误详情 (前5条):`, errors.slice(0, 5))
      }

      // 更新进度（场景词已经在 generateAndSaveScenes 中保存，这里只更新统计）
      const progress = Math.round(((currentIndex + 1) / industries.length) * 100)
      const lastError = failedCount > 0 
        ? `${industry}: ${failedCount} 条场景词保存失败${errors.length > 0 ? ` (${errors[0]})` : ''}`
        : null
      
      // 获取当前已保存的数量（因为边生成边保存，total_scenes_saved 已经在保存过程中更新了）
      const { data: currentTask } = await tasksTable()
        .select('total_scenes_saved')
        .eq('id', taskId)
        .single()
      
      const currentSaved = (currentTask as Database['public']['Tables']['batch_generation_tasks']['Row'])?.total_scenes_saved || 0
      
      await tasksTable()
        .update({
          current_industry_index: currentIndex + 1,
          total_scenes_generated: (task.total_scenes_generated || 0) + scenes.length,
          total_scenes_saved: currentSaved, // 使用已保存的数量（已经在保存过程中更新）
          progress,
          updated_at: new Date().toISOString(),
          last_error: lastError,
        })
        .eq('id', taskId)
      
      // 如果保存失败太多，记录警告
      if (savedCount === 0 && scenes.length > 0) {
        console.error(`[${industry}] ⚠️ 警告: 所有场景词保存失败！`)
        await tasksTable()
          .update({
            last_error: `${industry}: 所有 ${scenes.length} 条场景词保存失败，请检查数据库连接和错误日志`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskId)
      }

      // 如果还有更多行业需要处理，链式调用下一个 API（不等待响应，避免超时）
      if (currentIndex + 1 < industries.length) {
        // 立即触发下一个 API 调用，但不等待响应（fire and forget）
        // 这样当前函数可以快速返回，避免超过 Vercel 的 10 秒限制
        const processUrl = `${getSiteUrl()}/api/admin/batch-generation/process`
        fetch(processUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId }),
        }).catch((error) => {
          console.error(`[process] 链式调用失败:`, error)
          // 如果链式调用失败，更新任务状态为失败
          tasksTable()
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : '链式调用失败',
              updated_at: new Date().toISOString(),
            })
            .eq('id', taskId)
            .catch((updateError: unknown) => {
              console.error(`[process] 更新任务状态失败:`, updateError)
            })
        })
      } else {
        // 所有行业处理完成
        await tasksTable()
          .update({
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskId)
      }

      return NextResponse.json({
        success: true,
        message: `行业 ${industry} 处理完成`,
        currentIndex: currentIndex + 1,
        totalIndustries: industries.length,
      })
    } catch (error) {
      console.error(`[${industry}] 处理失败:`, error)
      await tasksTable()
        .update({
          last_error: error instanceof Error ? error.message : '未知错误',
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[process] 异常:', error)
    return NextResponse.json(
      {
        error: '处理失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

