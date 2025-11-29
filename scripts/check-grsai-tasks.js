#!/usr/bin/env node

/**
 * 快速检查 video_tasks 中仍在 processing 状态的任务，
 * 并直接请求 Grsai /v1/draw/result 端点，输出真实状态。
 *
 * 运行方式：
 *   node scripts/check-grsai-tasks.js [limit]
 *
 * 依赖环境变量：
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (或 SUPABASE_SERVICE_KEY)
 *   GRSAI_API_KEY
 *   （可选）GRSAI_HOST，默认 https://grsai.dakka.com.cn
 */

require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const GRSAI_API_KEY = process.env.GRSAI_API_KEY
const GRSAI_HOST = process.env.GRSAI_HOST || 'https://grsai.dakka.com.cn'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '[check-grsai-tasks] 缺少 Supabase 环境变量，请确保 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 已配置。'
  )
  process.exit(1)
}

if (!GRSAI_API_KEY) {
  console.error('[check-grsai-tasks] 缺少 GRSAI_API_KEY，无法请求 Grsai 接口。')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const limit = Number(process.argv[2]) || 20

async function fetchPendingTasks() {
  const { data, error } = await supabase
    .from('video_tasks')
    .select('id, created_at, status, progress, grsai_task_id, error_message')
    .eq('status', 'processing')
    .lt('progress', 100)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`查询 video_tasks 失败: ${error.message}`)
  }

  return data || []
}

async function fetchGrsaiStatus(taskId) {
  const response = await fetch(`${GRSAI_HOST}/v1/draw/result`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GRSAI_API_KEY}`,
    },
    body: JSON.stringify({ id: taskId }),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  try {
    return JSON.parse(text)
  } catch (err) {
    throw new Error(`解析 Grsai 响应失败: ${err.message} - ${text}`)
  }
}

async function main() {
  console.log(`[check-grsai-tasks] 查询 processing 任务（最多 ${limit} 条）...`)
  const tasks = await fetchPendingTasks()

  if (tasks.length === 0) {
    console.log('没有正在处理中的任务。')
    return
  }

  for (const task of tasks) {
    console.log('\n----------------------------------------')
    console.log(`Task ID:        ${task.id}`)
    console.log(`Created At:     ${task.created_at}`)
    console.log(`Progress(local):${task.progress}%`)
    console.log(`Grsai Task ID:  ${task.grsai_task_id || '(missing)'}`)
    if (task.error_message) {
      console.log(`Last Error:     ${task.error_message}`)
    }

    if (!task.grsai_task_id) {
      console.log('跳过：缺少 grsai_task_id。')
      continue
    }

    try {
      const result = await fetchGrsaiStatus(task.grsai_task_id)
      const code = result?.code
      const status = result?.data?.status
      const progress = result?.data?.progress
      console.log(`Grsai Response: code=${code}, status=${status}, progress=${progress}`)
      if (result?.data?.error || result?.msg) {
        console.log(
          `Grsai Message: ${result?.data?.error || result?.msg || '(no message)'}`
        )
      }
      if (status === 'succeeded' && result?.data?.results?.[0]?.url) {
        console.log(`Video URL: ${result.data.results[0].url}`)
      }
    } catch (err) {
      console.error(`Grsai 查询失败: ${err.message}`)
    }
  }
}

main()
  .catch((err) => {
    console.error('[check-grsai-tasks] 脚本执行失败:', err)
    process.exit(1)
  })
  .finally(() => {
    setTimeout(() => process.exit(0), 0)
  })


