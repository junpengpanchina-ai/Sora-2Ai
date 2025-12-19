/**
 * 自动修复包含错误视频时长的使用场景内容
 * 
 * 将内容中的错误时长（如"2分钟"、"1分钟"等）替换为正确的描述（"10 seconds"或"15 seconds"）
 * 
 * 使用方法:
 *   node scripts/fix-incorrect-video-duration.js          # 仅预览修复，不更新
 *   node scripts/fix-incorrect-video-duration.js --update  # 预览并更新数据库
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// 从环境变量读取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量')
  console.error('请确保设置了 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 错误时长模式（用于检测）
const incorrectDurationPatterns = [
  /\b(\d+)\s*分钟?\b/gi,  // 中文分钟
  /\b(\d+)\s*minute/i,     // 英文分钟
]

// 智能替换函数
function fixVideoDuration(text) {
  if (!text) return text

  let fixed = text

  // 替换中文分钟数（1-60分钟）
  fixed = fixed.replace(/\b(\d+)\s*分钟?\b/gi, (match, num) => {
    const minutes = parseInt(num)
    // 如果是视频时长相关的上下文，替换为秒数
    // 检查上下文关键词
    const context = match.toLowerCase()
    const beforeMatch = text.substring(Math.max(0, text.indexOf(match) - 50), text.indexOf(match)).toLowerCase()
    const afterMatch = text.substring(text.indexOf(match) + match.length, Math.min(text.length, text.indexOf(match) + match.length + 50)).toLowerCase()
    
    // 视频相关关键词
    const videoKeywords = ['video', '视频', 'generate', '生成', 'create', '创建', 'prompt', '提示', 'duration', '时长', 'second', '秒']
    const hasVideoContext = videoKeywords.some(keyword => 
      beforeMatch.includes(keyword) || afterMatch.includes(keyword) || context.includes(keyword)
    )
    
    // 服务相关关键词（不应该替换）
    const serviceKeywords = ['service', '服务', 'express', '快速', 'appointment', '预约', 'wait', '等待', 'time', '时间']
    const hasServiceContext = serviceKeywords.some(keyword => 
      beforeMatch.includes(keyword) || afterMatch.includes(keyword)
    )
    
    // 如果是视频时长且不是服务时长，进行替换
    if (hasVideoContext && !hasServiceContext && minutes >= 1 && minutes <= 60) {
      // 根据分钟数选择合适的秒数
      // 1-2分钟 -> 15秒，3分钟及以上 -> 15秒（因为最大只有15秒）
      return minutes <= 2 ? '15 seconds' : '15 seconds'
    }
    
    // 否则保持原样（可能是服务时长等）
    return match
  })

  // 替换英文分钟数
  fixed = fixed.replace(/\b(\d+)\s*minute/i, (match, num) => {
    const minutes = parseInt(num)
    const beforeMatch = text.substring(Math.max(0, text.indexOf(match) - 50), text.indexOf(match)).toLowerCase()
    const afterMatch = text.substring(text.indexOf(match) + match.length, Math.min(text.length, text.indexOf(match) + match.length + 50)).toLowerCase()
    
    const videoKeywords = ['video', 'generate', 'create', 'prompt', 'duration', 'second']
    const hasVideoContext = videoKeywords.some(keyword => 
      beforeMatch.includes(keyword) || afterMatch.includes(keyword)
    )
    
    const serviceKeywords = ['service', 'express', 'appointment', 'wait', 'time']
    const hasServiceContext = serviceKeywords.some(keyword => 
      beforeMatch.includes(keyword) || afterMatch.includes(keyword)
    )
    
    if (hasVideoContext && !hasServiceContext && minutes >= 1 && minutes <= 60) {
      return minutes <= 2 ? '15 seconds' : '15 seconds'
    }
    
    return match
  })

  return fixed
}

// 检查是否包含错误时长
function hasIncorrectDuration(text) {
  if (!text) return false
  const textLower = text.toLowerCase()
  
  // 检查是否包含分钟数（1-60）
  const minuteMatches = text.match(/\b\d+\s*分钟?\b/gi) || []
  const minuteMatchesEn = text.match(/\b\d+\s*minute/i) || []
  
  // 检查是否有视频上下文
  const videoKeywords = ['video', '视频', 'generate', '生成', 'create', '创建', 'prompt', '提示', 'duration', '时长']
  const hasVideoContext = videoKeywords.some(keyword => textLower.includes(keyword))
  
  if (!hasVideoContext) return false
  
  // 检查是否有服务上下文（不应该修复）
  const serviceKeywords = ['service', '服务', 'express', '快速', 'appointment', '预约']
  const hasServiceContext = serviceKeywords.some(keyword => textLower.includes(keyword))
  
  // 如果有分钟数且是视频上下文，且不是服务上下文，则需要修复
  if ((minuteMatches.length > 0 || minuteMatchesEn.length > 0) && hasVideoContext && !hasServiceContext) {
    // 检查分钟数是否在1-60范围内
    const allMatches = [...minuteMatches, ...minuteMatchesEn]
    return allMatches.some(match => {
      const num = parseInt(match.match(/\d+/)?.[0] || '0')
      return num >= 1 && num <= 60
    })
  }
  
  return false
}

async function fixIncorrectDurations() {
  console.log('🔧 开始修复使用场景内容中的错误视频时长...\n')

  try {
    // 获取所有包含错误时长的使用场景
    const { data: useCases, error: fetchError } = await supabase
      .from('use_cases')
      .select('id, slug, title, description, content, quality_status, quality_issues, quality_score')
      .eq('quality_status', 'needs_review')
      .contains('quality_issues', ['incorrect_video_duration'])
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ 获取使用场景失败:', fetchError)
      process.exit(1)
    }

    if (!useCases || useCases.length === 0) {
      console.log('ℹ️  没有找到需要修复的使用场景')
      console.log('   提示: 只修复 quality_status = "needs_review" 且 quality_issues 包含 "incorrect_video_duration" 的记录')
      return
    }

    console.log(`📊 找到 ${useCases.length} 个需要修复的使用场景\n`)

    const fixes = []

    // 检查并准备修复
    for (const useCase of useCases) {
      const changes = {
        id: useCase.id,
        slug: useCase.slug || '',
        title: useCase.title || '',
        original: {
          title: useCase.title || '',
          description: useCase.description || '',
          content: useCase.content || '',
        },
        fixed: {
          title: '',
          description: '',
          content: '',
        },
        hasChanges: false,
      }

      // 修复标题
      if (useCase.title && hasIncorrectDuration(useCase.title)) {
        changes.fixed.title = fixVideoDuration(useCase.title)
        if (changes.fixed.title !== changes.original.title) {
          changes.hasChanges = true
        }
      } else {
        changes.fixed.title = changes.original.title
      }

      // 修复描述
      if (useCase.description && hasIncorrectDuration(useCase.description)) {
        changes.fixed.description = fixVideoDuration(useCase.description)
        if (changes.fixed.description !== changes.original.description) {
          changes.hasChanges = true
        }
      } else {
        changes.fixed.description = changes.original.description
      }

      // 修复内容
      if (useCase.content && hasIncorrectDuration(useCase.content)) {
        changes.fixed.content = fixVideoDuration(useCase.content)
        if (changes.fixed.content !== changes.original.content) {
          changes.hasChanges = true
        }
      } else {
        changes.fixed.content = changes.original.content
      }

      if (changes.hasChanges) {
        fixes.push(changes)
      }
    }

    if (fixes.length === 0) {
      console.log('ℹ️  没有需要修复的内容（可能已经被修复或不需要修复）')
      return
    }

    console.log(`🔍 发现 ${fixes.length} 个需要修复的内容\n`)

    // 显示修复预览
    fixes.forEach((fix, index) => {
      console.log(`${index + 1}. [${fix.slug}]`)
      console.log(`   标题: ${fix.title.substring(0, 60)}${fix.title.length > 60 ? '...' : ''}`)
      
      if (fix.fixed.title !== fix.original.title) {
        console.log(`   📝 标题修复:`)
        console.log(`      原文: ${fix.original.title.substring(0, 80)}...`)
        console.log(`      修复: ${fix.fixed.title.substring(0, 80)}...`)
      }
      
      if (fix.fixed.description !== fix.original.description) {
        console.log(`   📝 描述修复:`)
        const descOrig = fix.original.description.substring(0, 100)
        const descFixed = fix.fixed.description.substring(0, 100)
        console.log(`      原文: ${descOrig}...`)
        console.log(`      修复: ${descFixed}...`)
      }
      
      if (fix.fixed.content !== fix.original.content) {
        console.log(`   📝 内容修复: 已修复内容中的错误时长`)
        // 显示内容中的关键变化
        const contentMatches = fix.original.content.match(/\b\d+\s*分钟?\b/gi) || []
        const fixedMatches = fix.fixed.content.match(/\b\d+\s*分钟?\b/gi) || []
        if (contentMatches.length > 0) {
          console.log(`      发现: ${contentMatches.join(', ')}`)
        }
      }
      
      console.log('')
    })

    // 检查是否要更新
    const shouldUpdate = process.argv.includes('--update')

    if (!shouldUpdate) {
      console.log('\n💡 提示: 使用 --update 参数来实际更新数据库')
      console.log('   例如: node scripts/fix-incorrect-video-duration.js --update')
      console.log('\n   这将：')
      console.log('   - 更新 title、description、content 字段')
      console.log('   - 从 quality_issues 中移除 "incorrect_video_duration"')
      console.log('   - 重新计算 quality_score')
      console.log('   - 如果修复后没有其他问题，将 quality_status 设置为 "approved"')
      return
    }

    // 更新数据库
    console.log('\n🔄 开始更新数据库...\n')

    let successCount = 0
    let errorCount = 0

    for (const fix of fixes) {
      try {
        // 重新计算质量分数（移除 incorrect_video_duration 问题）
        const existingIssues = Array.isArray(useCases.find(uc => uc.id === fix.id)?.quality_issues)
          ? useCases.find(uc => uc.id === fix.id).quality_issues.filter(issue => issue !== 'incorrect_video_duration')
          : []
        
        // 如果修复后没有其他问题，可以设置为 approved
        const newStatus = existingIssues.length === 0 ? 'approved' : 'needs_review'
        
        // 恢复质量分数（加回 20 分）
        const existingScore = useCases.find(uc => uc.id === fix.id)?.quality_score
        const newScore = existingScore ? Math.min(100, existingScore + 20) : 80

        const { error: updateError } = await supabase
          .from('use_cases')
          .update({
            title: fix.fixed.title,
            description: fix.fixed.description,
            content: fix.fixed.content,
            quality_status: newStatus,
            quality_issues: existingIssues.length > 0 ? existingIssues : null,
            quality_score: newScore,
          })
          .eq('id', fix.id)

        if (updateError) {
          console.error(`❌ 更新失败 [${fix.slug}]:`, updateError.message)
          errorCount++
        } else {
          console.log(`✅ 已修复 [${fix.slug}] (状态: ${newStatus}, 分数: ${newScore})`)
          successCount++
        }
      } catch (error) {
        console.error(`❌ 更新异常 [${fix.slug}]:`, error.message || error)
        errorCount++
      }
    }

    console.log('\n📊 修复完成：')
    console.log(`   ✅ 成功: ${successCount}`)
    console.log(`   ❌ 失败: ${errorCount}`)
    console.log(`   📝 总计: ${fixes.length}`)

  } catch (error) {
    console.error('❌ 修复过程出错:', error)
    process.exit(1)
  }
}

// 运行修复
fixIncorrectDurations()
  .then(() => {
    console.log('\n✅ 修复完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
  })

