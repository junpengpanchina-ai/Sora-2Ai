/**
 * 批量检查并标记包含错误视频时长的使用场景内容
 * 
 * 错误时长：2分钟、1分钟、3分钟等（应该是 10 秒或 15 秒）
 */

import { createClient } from '@supabase/supabase-js'

// 从环境变量读取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量')
  console.error('请确保设置了 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 错误时长模式
const incorrectDurationPatterns = [
  /\b2\s*分钟?\b/i,
  /\b1\s*分钟?\b/i,
  /\b3\s*分钟?\b/i,
  /\b4\s*分钟?\b/i,
  /\b5\s*分钟?\b/i,
  /\b\d+\s*分钟?\b/i, // 任何分钟数
  /\b2\s*minute/i,
  /\b\d+\s*minute/i, // 任何分钟数（英文）
]

// 检查内容是否包含错误时长
function hasIncorrectDuration(text: string): boolean {
  if (!text) return false
  
  const textLower = text.toLowerCase()
  
  // 检查是否包含错误时长模式
  const hasIncorrect = incorrectDurationPatterns.some(pattern => 
    pattern.test(textLower)
  )
  
  // 如果包含错误时长，但同时也包含正确的时长（10秒或15秒），可能是误报
  // 但为了安全起见，我们仍然标记它
  return hasIncorrect
}

// 查找错误时长的具体位置
function findIncorrectDurations(text: string): string[] {
  if (!text) return []
  
  const found: string[] = []
  const textLower = text.toLowerCase()
  
  // 匹配所有分钟数
  const minuteMatches = text.match(/\b\d+\s*分钟?\b/gi) || []
  const minuteMatchesEn = text.match(/\b\d+\s*minute/i) || []
  
  minuteMatches.forEach(match => {
    const num = parseInt(match.match(/\d+/)?.[0] || '0')
    if (num > 0 && num <= 60) { // 1-60 分钟都算错误
      found.push(match)
    }
  })
  
  minuteMatchesEn.forEach(match => {
    const num = parseInt(match.match(/\d+/)?.[0] || '0')
    if (num > 0 && num <= 60) {
      found.push(match)
    }
  })
  
  return [...new Set(found)] // 去重
}

async function checkAndMarkIncorrectDurations() {
  console.log('🔍 开始检查使用场景内容中的错误视频时长...\n')

  try {
    // 获取所有使用场景
    const { data: useCases, error: fetchError } = await supabase
      .from('use_cases')
      .select('id, slug, title, description, content, quality_status, quality_issues, quality_score')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ 获取使用场景失败:', fetchError)
      process.exit(1)
    }

    if (!useCases || useCases.length === 0) {
      console.log('ℹ️  没有找到使用场景')
      return
    }

    console.log(`📊 总共找到 ${useCases.length} 个使用场景\n`)

    const issues: Array<{
      id: string
      slug: string
      title: string
      incorrectDurations: string[]
      fields: string[]
    }> = []

    // 检查每个使用场景
    for (const useCase of useCases) {
      const problems: string[] = []
      const fields: string[] = []

      // 检查标题
      if (useCase.title && hasIncorrectDuration(useCase.title)) {
        const found = findIncorrectDurations(useCase.title)
        problems.push(...found)
        fields.push('title')
      }

      // 检查描述
      if (useCase.description && hasIncorrectDuration(useCase.description)) {
        const found = findIncorrectDurations(useCase.description)
        problems.push(...found)
        fields.push('description')
      }

      // 检查内容
      if (useCase.content && hasIncorrectDuration(useCase.content)) {
        const found = findIncorrectDurations(useCase.content)
        problems.push(...found)
        fields.push('content')
      }

      if (problems.length > 0) {
        issues.push({
          id: useCase.id,
          slug: useCase.slug || '',
          title: useCase.title || '',
          incorrectDurations: [...new Set(problems)],
          fields: [...new Set(fields)],
        })
      }
    }

    console.log(`⚠️  发现 ${issues.length} 个包含错误时长的使用场景\n`)

    if (issues.length === 0) {
      console.log('✅ 所有内容都没有错误时长问题！')
      return
    }

    // 显示问题列表
    console.log('📋 问题列表：\n')
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.slug}]`)
      console.log(`   标题: ${issue.title.substring(0, 60)}...`)
      console.log(`   错误时长: ${issue.incorrectDurations.join(', ')}`)
      console.log(`   涉及字段: ${issue.fields.join(', ')}`)
      console.log('')
    })

    // 询问是否更新
    console.log('\n❓ 是否要更新这些记录的 quality_status 和 quality_issues？')
    console.log('   这将：')
    console.log('   - 将 quality_status 设置为 "needs_review"')
    console.log('   - 在 quality_issues 中添加 "incorrect_video_duration"')
    console.log('   - 降低 quality_score（如果存在）')
    console.log('\n   输入 "yes" 继续，其他任意键取消：')

    // 在 Node.js 中，我们需要使用 readline 来获取用户输入
    // 但为了简化，我们可以通过命令行参数来控制
    const shouldUpdate = process.argv.includes('--update')

    if (!shouldUpdate) {
      console.log('\n💡 提示: 使用 --update 参数来实际更新数据库')
      console.log('   例如: npm run check-duration -- --update')
      return
    }

    // 更新数据库
    console.log('\n🔄 开始更新数据库...\n')

    let successCount = 0
    let errorCount = 0

    for (const issue of issues) {
      try {
        // 获取现有的 quality_issues
        const existingIssues = Array.isArray(useCases.find(uc => uc.id === issue.id)?.quality_issues)
          ? (useCases.find(uc => uc.id === issue.id)?.quality_issues as string[])
          : []

        // 添加新的问题
        const updatedIssues = [...new Set([...existingIssues, 'incorrect_video_duration'])]

        // 计算新的质量分数（降低 20 分）
        const existingScore = useCases.find(uc => uc.id === issue.id)?.quality_score
        const newScore = existingScore ? Math.max(0, existingScore - 20) : 60

        const { error: updateError } = await supabase
          .from('use_cases')
          .update({
            quality_status: 'needs_review',
            quality_issues: updatedIssues,
            quality_score: newScore,
          })
          .eq('id', issue.id)

        if (updateError) {
          console.error(`❌ 更新失败 [${issue.slug}]:`, updateError.message)
          errorCount++
        } else {
          console.log(`✅ 已更新 [${issue.slug}]`)
          successCount++
        }
      } catch (error) {
        console.error(`❌ 更新异常 [${issue.slug}]:`, error)
        errorCount++
      }
    }

    console.log('\n📊 更新完成：')
    console.log(`   ✅ 成功: ${successCount}`)
    console.log(`   ❌ 失败: ${errorCount}`)
    console.log(`   📝 总计: ${issues.length}`)

  } catch (error) {
    console.error('❌ 检查过程出错:', error)
    process.exit(1)
  }
}

// 运行检查
checkAndMarkIncorrectDurations()
  .then(() => {
    console.log('\n✅ 检查完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
  })

