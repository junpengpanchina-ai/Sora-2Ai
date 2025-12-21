import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    // 检查是否暂停（如果暂停，等待恢复）
    if (task.is_paused) {
      // 如果任务暂停，等待恢复（最多等待 5 秒，然后返回，让前端继续轮询）
      let waitCount = 0
      while (task.is_paused && waitCount < 5) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const { data: checkTask } = await tasksTable()
          .select('is_paused, should_stop')
          .eq('id', taskId)
          .single()
        
        if (checkTask && !checkTask.is_paused) {
          break
        }
        waitCount++
      }
      
      // 如果仍然暂停，返回让前端继续轮询
      const { data: finalCheck } = await tasksTable()
        .select('is_paused')
        .eq('id', taskId)
        .single()
      
      if (finalCheck?.is_paused) {
        return NextResponse.json({ success: true, message: '任务已暂停，等待恢复' })
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
    const useCaseType = task.use_case_type || 'social-media'

    // 处理当前行业
    try {
      // 导入生成和保存函数
      const { generateIndustryScenes } = await import('./generate-scenes')
      const { saveSceneToDatabase } = await import('./save-scene')

      // 导入检测函数
      const { isColdIndustry, needsProModel } = await import('./detect-cold-industry')
      
      // 生成场景词
      console.log(`[${industry}] 开始生成 ${scenesPerIndustry} 条场景词...`)
      console.log(`[${industry}] 检测行业类型: 冷门=${isColdIndustry(industry)}, 极端专业=${needsProModel(industry)}`)
      
      const scenes = await generateIndustryScenes(industry, scenesPerIndustry, useCaseType)
      console.log(`[${industry}] 生成完成: 获得 ${scenes.length} 条场景词`)
      
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
          const processUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/api/admin/batch-generation/process`
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
      
      // 保存场景词（带重试机制和详细错误日志）
      let savedCount = 0
      let failedCount = 0
      const errors: string[] = []
      
      for (let j = 0; j < scenes.length; j++) {
        const scene = scenes[j]
        
        // 检查是否应该停止
        const { data: checkTask } = await tasksTable()
          .select('should_stop, status')
          .eq('id', taskId)
          .single()
        
        if (checkTask?.should_stop || checkTask?.status === 'cancelled') {
          console.log(`[${industry}] 任务已停止，停止保存场景词`)
          break
        }

        // 重试机制
        let retryCount = 0
        const maxRetries = 3
        let saved = false
        
        while (retryCount <= maxRetries && !saved) {
          try {
            await saveSceneToDatabase(industry, scene, useCaseType, supabase)
            savedCount++
            saved = true
            if (retryCount > 0) {
              console.log(`[${industry}] 场景词 ${j + 1} 重试成功 (${retryCount}/${maxRetries})`)
            }
          } catch (error) {
            retryCount++
            const errorMessage = error instanceof Error ? error.message : String(error)
            
            if (retryCount > maxRetries) {
              failedCount++
              const fullError = `场景词 ${j + 1}: ${errorMessage}`
              errors.push(fullError)
              console.error(`[${industry}] 保存场景词 ${j + 1} 最终失败 (${retryCount}/${maxRetries}):`, errorMessage)
            } else {
              // 延迟后重试
              const retryDelay = 1000 * retryCount
              console.warn(`[${industry}] 保存场景词 ${j + 1} 失败，${retryDelay}ms 后重试 (${retryCount}/${maxRetries}):`, errorMessage)
              await new Promise((resolve) => setTimeout(resolve, retryDelay))
            }
          }
        }
        
        // 避免请求过快
        if (j < scenes.length - 1) {
          const delay = j < 10 ? 200 : j < 50 ? 150 : 100
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
        
        // 每保存 10 条更新一次进度（避免丢失进度）
        if ((j + 1) % 10 === 0) {
          await tasksTable()
            .update({
              total_scenes_saved: (task.total_scenes_saved || 0) + savedCount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', taskId)
        }
      }
      
      // 记录保存结果
      console.log(`[${industry}] 保存完成: 成功 ${savedCount} 条, 失败 ${failedCount} 条, 总计 ${scenes.length} 条`)
      if (errors.length > 0 && errors.length <= 5) {
        console.error(`[${industry}] 保存错误详情:`, errors)
      } else if (errors.length > 5) {
        console.error(`[${industry}] 保存错误详情 (前5条):`, errors.slice(0, 5))
      }

      // 更新进度
      const progress = Math.round(((currentIndex + 1) / industries.length) * 100)
      const lastError = failedCount > 0 
        ? `${industry}: ${failedCount} 条场景词保存失败${errors.length > 0 ? ` (${errors[0]})` : ''}`
        : null
      
      await tasksTable()
        .update({
          current_industry_index: currentIndex + 1,
          total_scenes_generated: (task.total_scenes_generated || 0) + scenes.length,
          total_scenes_saved: (task.total_scenes_saved || 0) + savedCount,
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
        const processUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/batch-generation/process`
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

