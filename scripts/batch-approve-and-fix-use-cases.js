/**
 * 批量批准并修复使用场景
 * 1. 将所有待审核的草稿重新进行质量检查
 * 2. 修复 quality_check_error 问题
 * 3. 如果质量检查通过，自动批准并发布
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * 检查内容质量（简化版，基于实际内容）
 */
function checkContentQuality(useCase) {
  const issues = []
  const warnings = []
  let score = 100

  // 1. 检查 H1
  if (!useCase.h1 || useCase.h1.trim().length === 0) {
    issues.push('missing_h1')
    score -= 20
  } else if (useCase.h1.length < 10) {
    warnings.push('H1 标题过短')
    score -= 5
  }

  // 2. 检查标题
  if (!useCase.title || useCase.title.trim().length === 0) {
    issues.push('missing_title')
    score -= 15
  }

  // 3. 检查描述
  if (!useCase.description || useCase.description.trim().length === 0) {
    issues.push('missing_description')
    score -= 15
  } else if (useCase.description.length < 50) {
    warnings.push('描述过短')
    score -= 5
  }

  // 4. 检查内容长度
  const contentLength = useCase.content?.length || 0
  if (contentLength === 0) {
    issues.push('content_too_short')
    score -= 30
  } else if (contentLength < 300) {
    issues.push('content_too_short')
    score -= 20
  } else if (contentLength < 500) {
    warnings.push('内容较短')
    score -= 10
  }

  // 5. 检查 SEO 关键词
  const seoKeywords = Array.isArray(useCase.seo_keywords) ? useCase.seo_keywords : []
  if (seoKeywords.length === 0) {
    issues.push('missing_keywords')
    score -= 10
  }

  // 6. 检查内容结构（H2 标题）
  if (useCase.content) {
    const h2Count = (useCase.content.match(/^##\s+/gm) || []).length
    if (h2Count === 0) {
      issues.push('poor_formatting')
      score -= 15
    }

    // 检查视频时长错误
    const contentLower = useCase.content.toLowerCase()
    const incorrectDurationPatterns = [
      /\b(?:20|30|45|60|90|120)\s*秒?\b/i,
      /\b(?:20|30|45|60|90|120)\s*second/i,
      /\b\d+\s*分钟?\b/i,
      /\b\d+\s*minute/i,
    ]
    
    const hasIncorrectDuration = incorrectDurationPatterns.some(pattern => {
      try {
        return pattern.test(contentLower) && 
               !contentLower.includes('10 second') && 
               !contentLower.includes('15 second')
      } catch {
        return false
      }
    })
    
    if (hasIncorrectDuration) {
      issues.push('incorrect_video_duration')
      score -= 20
    }
  }

  // 确保分数在 0-100 范围内
  score = Math.max(0, Math.min(100, score))

  return {
    passed: issues.length === 0 && score >= 60,
    score,
    issues,
    warnings,
  }
}

async function batchApproveAndFix() {
  console.log('🚀 开始批量批准并修复使用场景...\n')

  try {
    // 1. 查询所有待审核的草稿
    console.log('📋 查询待审核的草稿...')
    const { data: useCases, error: fetchError } = await supabase
      .from('use_cases')
      .select('*')
      .eq('is_published', false)
      .in('quality_status', ['pending', null])
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ 查询失败:', fetchError)
      return
    }

    if (!useCases || useCases.length === 0) {
      console.log('✅ 没有待审核的草稿')
      return
    }

    console.log(`📊 找到 ${useCases.length} 条待审核的草稿\n`)

    let approvedCount = 0
    let fixedCount = 0
    let failedCount = 0

    // 2. 逐个处理
    for (let i = 0; i < useCases.length; i++) {
      const useCase = useCases[i]
      console.log(`\n[${i + 1}/${useCases.length}] 处理: ${useCase.title?.substring(0, 50) || useCase.slug}`)

      // 检查是否有 quality_check_error
      const hasQualityCheckError = Array.isArray(useCase.quality_issues) && 
                                   useCase.quality_issues.includes('quality_check_error')

      if (hasQualityCheckError) {
        console.log('  ⚠️  检测到 quality_check_error，重新进行质量检查...')
      }

      // 重新进行质量检查
      const qualityCheck = checkContentQuality(useCase)

      console.log(`  📊 质量分数: ${qualityCheck.score}, 问题: ${qualityCheck.issues.join(', ') || '无'}`)

      // 如果通过检查，自动批准并发布
      if (qualityCheck.passed) {
        const { error: updateError } = await supabase
          .from('use_cases')
          .update({
            quality_status: 'approved',
            is_published: true,
            quality_score: qualityCheck.score,
            quality_issues: qualityCheck.issues,
            quality_notes: hasQualityCheckError ? '已自动修复 quality_check_error' : null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', useCase.id)

        if (updateError) {
          console.error(`  ❌ 更新失败:`, updateError.message)
          failedCount++
        } else {
          console.log(`  ✅ 已批准并发布`)
          approvedCount++
          if (hasQualityCheckError) {
            fixedCount++
          }
        }
      } else {
        // 如果质量检查失败，但只有 minor 问题，也可以批准
        // 或者标记为 needs_review
        const minorIssues = qualityCheck.issues.filter(issue => 
          !['content_too_short', 'missing_h1', 'missing_title'].includes(issue)
        )

        if (minorIssues.length === 0 && qualityCheck.score >= 50) {
          // 只有轻微问题，可以批准
          const { error: updateError } = await supabase
            .from('use_cases')
            .update({
              quality_status: 'approved',
              is_published: true,
              quality_score: qualityCheck.score,
              quality_issues: qualityCheck.issues,
              quality_notes: hasQualityCheckError ? '已自动修复 quality_check_error，存在轻微质量问题但已批准' : '存在轻微质量问题但已批准',
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', useCase.id)

          if (updateError) {
            console.error(`  ❌ 更新失败:`, updateError.message)
            failedCount++
          } else {
            console.log(`  ✅ 已批准并发布（存在轻微问题）`)
            approvedCount++
            if (hasQualityCheckError) {
              fixedCount++
            }
          }
        } else {
          // 有严重问题，标记为 needs_review
          const { error: updateError } = await supabase
            .from('use_cases')
            .update({
              quality_status: 'needs_review',
              is_published: false,
              quality_score: qualityCheck.score,
              quality_issues: qualityCheck.issues,
              quality_notes: hasQualityCheckError 
                ? `已修复 quality_check_error，但存在质量问题需要人工审核: ${qualityCheck.issues.join(', ')}`
                : `存在质量问题需要人工审核: ${qualityCheck.issues.join(', ')}`,
            })
            .eq('id', useCase.id)

          if (updateError) {
            console.error(`  ❌ 更新失败:`, updateError.message)
            failedCount++
          } else {
            console.log(`  ⚠️  标记为需要审核: ${qualityCheck.issues.join(', ')}`)
            failedCount++
          }
        }
      }

      // 避免请求过快
      if (i < useCases.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 处理完成统计:')
    console.log(`  ✅ 已批准并发布: ${approvedCount} 条`)
    console.log(`  🔧 已修复 quality_check_error: ${fixedCount} 条`)
    console.log(`  ⚠️  需要人工审核: ${failedCount} 条`)
    console.log(`  📝 总计: ${useCases.length} 条`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ 批量处理失败:', error)
    process.exit(1)
  }
}

// 运行脚本
batchApproveAndFix()
  .then(() => {
    console.log('\n✅ 脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败:', error)
    process.exit(1)
  })

