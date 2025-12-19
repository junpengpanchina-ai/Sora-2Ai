/**
 * 批量检查并标记包含错误视频时长的使用场景内容
 * 
 * 错误时长：2分钟、1分钟、3分钟等（应该是 10 秒或 15 秒）
 * 
 * 使用方法:
 *   node scripts/check-incorrect-video-duration.js          # 仅检查，不更新
 *   node scripts/check-incorrect-video-duration.js --update  # 检查并更新数据库
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// 从环境变量读取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量')
  console.error('请确保设置了 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  console.error('提示: 这些变量应该在 .env.local 文件中')
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
function hasIncorrectDuration(text) {
  if (!text) return false
  
  const textLower = text.toLowerCase()
  
  // 检查是否包含错误时长模式
  const hasIncorrect = incorrectDurationPatterns.some(pattern => 
    pattern.test(textLower)
  )
  
  return hasIncorrect
}

// 查找错误时长的具体位置
function findIncorrectDurations(text) {
  if (!text) return []
  
  const found = []
  
  // 匹配所有分钟数（中文）
  const minuteMatches = text.match(/\b\d+\s*分钟?\b/gi) || []
  minuteMatches.forEach(match => {
    const num = parseInt(match.match(/\d+/)?.[0] || '0')
    if (num > 0 && num <= 60) { // 1-60 分钟都算错误
      found.push(match)
    }
  })
  
  // 匹配所有分钟数（英文）
  const minuteMatchesEn = text.match(/\b\d+\s*minute/i) || []
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

    const issues = []

    // 检查每个使用场景
    for (const useCase of useCases) {
      const problems = []
      const fields = []

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
          currentStatus: useCase.quality_status,
          currentScore: useCase.quality_score,
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
      console.log(`   标题: ${(issue.title || '').substring(0, 60)}${issue.title && issue.title.length > 60 ? '...' : ''}`)
      console.log(`   错误时长: ${issue.incorrectDurations.join(', ')}`)
      console.log(`   涉及字段: ${issue.fields.join(', ')}`)
      console.log(`   当前状态: ${issue.currentStatus || 'null'}`)
      console.log(`   当前分数: ${issue.currentScore || 'null'}`)
      console.log('')
    })

    // 检查是否要更新
    const shouldUpdate = process.argv.includes('--update')

    if (!shouldUpdate) {
      console.log('\n💡 提示: 使用 --update 参数来实际更新数据库')
      console.log('   例如: node scripts/check-incorrect-video-duration.js --update')
      console.log('\n   这将：')
      console.log('   - 将 quality_status 设置为 "needs_review"')
      console.log('   - 在 quality_issues 中添加 "incorrect_video_duration"')
      console.log('   - 降低 quality_score（如果存在，减 20 分）')
      return
    }

    // 更新数据库
    console.log('\n🔄 开始更新数据库...\n')

    let successCount = 0
    let errorCount = 0

    for (const issue of issues) {
      try {
        // 获取现有的 quality_issues
        const existingUseCase = useCases.find(uc => uc.id === issue.id)
        const existingIssues = Array.isArray(existingUseCase?.quality_issues)
          ? existingUseCase.quality_issues
          : []

        // 添加新的问题
        const updatedIssues = [...new Set([...existingIssues, 'incorrect_video_duration'])]

        // 计算新的质量分数（降低 20 分）
        const existingScore = existingUseCase?.quality_score
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
        console.error(`❌ 更新异常 [${issue.slug}]:`, error.message || error)
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

