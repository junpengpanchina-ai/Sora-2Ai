import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/database'

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

    // 检查是否暂停
    if (task.is_paused) {
      return NextResponse.json({ success: true, message: '任务已暂停' })
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

      // 生成场景词
      const scenes = await generateIndustryScenes(industry, scenesPerIndustry, useCaseType)
      
      // 保存场景词
      let savedCount = 0
      for (let j = 0; j < scenes.length; j++) {
        const scene = scenes[j]
        
        // 检查是否应该停止
        const { data: checkTask } = await tasksTable()
          .select('should_stop, status')
          .eq('id', taskId)
          .single()
        
        if (checkTask?.should_stop || checkTask?.status === 'cancelled') {
          break
        }

        try {
          await saveSceneToDatabase(industry, scene, useCaseType, supabase)
          savedCount++
        } catch (error) {
          console.error(`[${industry}] 保存场景词 ${j + 1} 失败:`, error)
        }
        
        // 避免请求过快
        if (j < scenes.length - 1) {
          const delay = j < 10 ? 200 : j < 50 ? 150 : 100
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }

      // 更新进度
      const progress = Math.round(((currentIndex + 1) / industries.length) * 100)
      await tasksTable()
        .update({
          current_industry_index: currentIndex + 1,
          total_scenes_generated: (task.total_scenes_generated || 0) + scenes.length,
          total_scenes_saved: (task.total_scenes_saved || 0) + savedCount,
          progress,
          updated_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', taskId)

      // 如果还有更多行业需要处理，递归调用自己
      if (currentIndex + 1 < industries.length) {
        // 使用 setTimeout 延迟调用，避免立即递归导致堆栈溢出
        setTimeout(async () => {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/batch-generation/process`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ taskId }),
            })
          } catch (error) {
            console.error(`[process] 递归调用失败:`, error)
            // 如果递归调用失败，更新任务状态为失败
            await tasksTable()
              .update({
                status: 'failed',
                error_message: error instanceof Error ? error.message : '递归调用失败',
                updated_at: new Date().toISOString(),
              })
              .eq('id', taskId)
          }
        }, 100) // 100ms 延迟
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

