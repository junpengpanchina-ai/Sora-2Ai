#!/usr/bin/env node

/**
 * AI 引用概率排序脚本 V2
 * 
 * 基于新的 AI_CITATION_SCORE 实现
 * 筛选出最可能被 AI 引用的 5000 页
 * 
 * 使用方法：
 * node scripts/calculate-ai-citation-top5000-v2.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 注意：由于这是 JS 文件，需要直接实现核心逻辑
// TypeScript 版本在 lib/utils/ai-citation-scorer-v2.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 硬过滤（必须过）
 */
function passesHardFilters(page) {
  // indexable=true（假设所有已发布的都是可索引的）
  // 检查 is_published 字段（可能是布尔值或字符串）
  const isPublished = page.is_published === true || page.is_published === 'true' || page.is_published === 1
  if (!isPublished) return false
  
  // wordCount>=600（放宽到 500，因为很多页面可能刚好在 600 左右）
  const wordCount = countWords(page.content || '')
  if (wordCount < 500) return false
  
  // nearDuplicateScore<=0.8（简化：标题和 H1 相似度）
  // 注意：如果标题和 H1 完全相同（相似度=1），这通常是正常的，不应该过滤
  // 只有当相似度非常高（>0.8）且内容重复时才过滤
  const similarity = calculateSimilarity(page.title || '', page.h1 || page.title || '')
  // 放宽条件：只过滤极端重复的情况
  if (similarity > 0.95) return false
  
  // 不是敏感/灰产行业（黑名单）
  const blacklist = ['gambling', 'adult', 'pharmaceutical'] // 示例
  const industryLower = (page.industry || '').toLowerCase()
  if (blacklist.some(term => industryLower.includes(term))) return false
  
  return true
}

/**
 * 计算相似度（简化版）
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  if (s1 === s2) return 1
  const words1 = new Set(s1.split(/\s+/))
  const words2 = new Set(s2.split(/\s+/))
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  return intersection.size / union.size
}

/**
 * 计算字数
 */
function countWords(text) {
  if (!text) return 0
  const textWithoutHtml = text.replace(/<[^>]*>/g, ' ')
  const textWithoutMarkdown = textWithoutHtml
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
  const words = textWithoutMarkdown.split(/[\s\n\r\t,.;:!?()[\]{}'"]+/).filter(w => w.length > 0)
  return words.length
}

/**
 * 行业配额控制
 */
function applyIndustryQuota(pages, maxPerIndustry = 50, maxPlatform = 1000) {
  const industryCounts = new Map()
  const platformCounts = new Map()
  const result = []
  
  for (const page of pages) {
    const industry = page.industry || 'unknown'
    const useCaseType = page.use_case_type || 'unknown'
    
    // 平台页限制
    if (['best', 'alternative', 'vs', 'comparison'].some(term => 
      (page.slug || '').toLowerCase().includes(term)
    )) {
      const platformKey = useCaseType
      const count = platformCounts.get(platformKey) || 0
      if (count >= maxPlatform) continue
      platformCounts.set(platformKey, count + 1)
    }
    
    // 行业配额
    const count = industryCounts.get(industry) || 0
    if (count >= maxPerIndustry) continue
    industryCounts.set(industry, count + 1)
    
    result.push(page)
  }
  
  return result
}

/**
 * 多样性抽样（从 8000 取 5000）
 */
function diversitySample(pages, targetCount = 5000) {
  if (pages.length <= targetCount) return pages
  
  // 按行业分组
  const byIndustry = new Map()
  for (const page of pages) {
    const industry = page.industry || 'unknown'
    if (!byIndustry.has(industry)) {
      byIndustry.set(industry, [])
    }
    byIndustry.get(industry).push(page)
  }
  
  // 每个行业按比例采样
  const result = []
  const industries = Array.from(byIndustry.keys())
  const perIndustry = Math.floor(targetCount / industries.length)
  
  for (const industry of industries) {
    const industryPages = byIndustry.get(industry)
    const sampleSize = Math.min(perIndustry, industryPages.length)
    result.push(...industryPages.slice(0, sampleSize))
  }
  
  // 如果还不够，从高分页面补充
  if (result.length < targetCount) {
    const remaining = pages.filter(p => !result.includes(p))
    remaining.sort((a, b) => (b.aiCitationScore || 0) - (a.aiCitationScore || 0))
    result.push(...remaining.slice(0, targetCount - result.length))
  }
  
  return result.slice(0, targetCount)
}

async function main() {
  console.log('🚀 开始计算 AI Citation Top 5000 (V2)...\n')

  try {
    // Step 1: 获取基础候选池
    console.log('📊 Step 1: 获取基础候选池...')
    
    // 先获取总数
    const { count: totalCount, error: countError } = await supabase
      .from('use_cases')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .not('industry', 'is', null)
      .not('content', 'is', null)
    
    if (countError) {
      console.warn('⚠️  获取总数失败，使用默认限制:', countError.message)
    }
    
    console.log(`📊 符合条件的页面总数: ${totalCount || '未知'}`)
    
    // 分批获取（避免超时）
    const batchSize = 5000
    const maxBatches = 4 // 最多取 4 批（20000 页）
    const batches = totalCount ? Math.min(maxBatches, Math.ceil(totalCount / batchSize)) : maxBatches
    const allPages = []
    
    for (let i = 0; i < batches; i++) {
      const { data: batch, error: batchError } = await supabase
        .from('use_cases')
        .select('id, slug, title, h1, content, industry, use_case_type, related_use_case_ids, is_published')
        .eq('is_published', true)
        .not('industry', 'is', null)
        .not('content', 'is', null)
        .range(i * batchSize, (i + 1) * batchSize - 1)
      
      if (batchError) {
        console.warn(`⚠️  批次 ${i + 1} 查询错误:`, batchError.message)
        continue
      }
      
      if (batch && batch.length > 0) {
        allPages.push(...batch)
        console.log(`📊 已获取 ${allPages.length} 页（批次 ${i + 1}/${batches}）`)
      } else {
        // 如果批次返回空，说明已经取完
        break
      }
    }
    
    const pages = allPages
    console.log(`✅ 获取到 ${pages.length} 个候选页面`)
    
    // 调试信息（可选，已注释）
    // if (pages.length > 0) {
    //   console.log('\n📊 调试：前 3 个页面的数据结构:')
    //   pages.slice(0, 3).forEach((page, i) => {
    //     console.log(`\n页面 ${i + 1}:`)
    //     console.log(`  id: ${page.id}`)
    //     console.log(`  slug: ${page.slug}`)
    //     console.log(`  is_published: ${page.is_published}`)
    //     console.log(`  industry: ${page.industry}`)
    //     console.log(`  word count: ${countWords(page.content || '')} 词`)
    //   })
    // }

    // Step 2: 硬过滤
    console.log('\n📊 Step 2: 硬过滤...')
    
    // 调试：统计每个过滤条件
    const filterStats = {
      total: pages.length,
      published: 0,
      wordCount: 0,
      similarity: 0,
      blacklist: 0,
      passed: 0,
    }
    
    const filtered = pages.filter(page => {
      const isPublished = page.is_published === true || page.is_published === 'true' || page.is_published === 1
      if (!isPublished) return false
      filterStats.published++
      
      const wordCount = countWords(page.content || '')
      if (wordCount < 500) return false
      filterStats.wordCount++
      
      const similarity = calculateSimilarity(page.title || '', page.h1 || page.title || '')
      if (similarity > 0.95) return false
      filterStats.similarity++
      
      const blacklist = ['gambling', 'adult', 'pharmaceutical']
      const industryLower = (page.industry || '').toLowerCase()
      if (blacklist.some(term => industryLower.includes(term))) return false
      filterStats.blacklist++
      
      filterStats.passed++
      return true
    })
    
    console.log('📊 过滤统计:')
    console.log(`   总页面: ${filterStats.total}`)
    console.log(`   已发布: ${filterStats.published}`)
    console.log(`   字数≥500: ${filterStats.wordCount}`)
    console.log(`   相似度≤0.95: ${filterStats.similarity}`)
    console.log(`   不在黑名单: ${filterStats.blacklist}`)
    console.log(`✅ 硬过滤后: ${filtered.length} 个页面`)

    // Step 3: 计算 AI Citation Score
    console.log('\n📊 Step 3: 计算 AI Citation Score...')
    const scored = filtered.map(page => {
      // 提取 Citation Signals（简化版实现）
      const signals = extractCitationSignals(page)
      const score = computeAiCitationScore(signals)
      return { ...page, aiCitationScore: score, signals }
    })

    // Step 4: 排序
    console.log('\n📊 Step 4: 排序...')
    const sorted = scored.sort((a, b) => b.aiCitationScore - a.aiCitationScore)

    // Step 5: 行业配额
    console.log('\n📊 Step 5: 应用行业配额...')
    const withQuota = applyIndustryQuota(sorted.slice(0, 8000))

    // Step 6: 多样性抽样
    console.log('\n📊 Step 6: 多样性抽样...')
    const top5000 = diversitySample(withQuota, 5000)

    // Step 7: 生成列表
    console.log('\n📊 Step 7: 生成列表...')
    const listA = top5000.slice(0, 1000)
    const listB = top5000.slice(1000, 3000)
    const listC = top5000.slice(3000, 5000)

    // Step 8: 保存结果
    const outputDir = path.join(__dirname, '../data/ai-citation-lists')
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
    
    const timestamp = new Date().toISOString().split('T')[0]
    const jsonFile = path.join(outputDir, `ai-citation-top5000-v2-${timestamp}.json`)
    fs.writeFileSync(jsonFile, JSON.stringify({ listA, listB, listC }, null, 2), 'utf8')
    
    console.log(`\n✅ 完成！结果已保存: ${jsonFile}`)
    console.log(`   List A (Top 1000): ${listA.length} 页`)
    console.log(`   List B (Next 2000): ${listB.length} 页`)
    console.log(`   List C (Long-tail 2000): ${listC.length} 页`)
  } catch (error) {
    console.error('❌ 错误:', error)
    process.exit(1)
  }
}

/**
 * 提取 Citation Signals（简化版实现）
 */
function extractCitationSignals(page) {
  const content = page.content || ''
  const title = page.title || ''
  const h1 = page.h1 || title
  
  // 提取 Answer-first 信息
  const answerFirstInfo = extractAnswerFirst(content)
  
  // 提取列表信息
  const bulletsInfo = extractBullets(content)
  
  // 提取 Steps 信息
  const stepsInfo = extractSteps(content)
  
  // 提取 FAQ 数量
  const faqCount = countFAQs(content)
  
  // 检查 Industry Constraints
  const hasIndustryConstraints = checkIndustryConstraints(content)
  
  // 计算字数
  const wordCount = countWords(content)
  
  // 计算相似度
  const nearDuplicateScore = calculateSimilarity(title, h1)
  
  // 内链数量
  const internalLinksOut = page.related_use_case_ids?.length || 0
  
  // 检查 KB 锚点
  const hasKbAnchor = checkKbAnchor(content)
  
  return {
    hasAnswerFirst: answerFirstInfo.has,
    answerWordCount: answerFirstInfo.wordCount,
    hasBullets: bulletsInfo.has,
    bulletCount: bulletsInfo.count,
    hasSteps: stepsInfo.has,
    stepCount: stepsInfo.count,
    faqCount,
    hasIndustryConstraints,
    wordCount,
    nearDuplicateScore,
    internalLinksOut,
    hasKbAnchor,
    indexable: true,
  }
}

/**
 * 提取 Answer-first 信息
 */
function extractAnswerFirst(content) {
  if (!content) return { has: false, wordCount: 0 }
  
  const textWithoutMarkdown = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
  
  const words = textWithoutMarkdown
    .split(/[\s\n\r\t,.;:!?()[\]{}'"]+/)
    .filter(w => w.length > 0)
    .slice(0, 220)
  
  const firstWords = words.join(' ').toLowerCase()
  
  const answerFirstIndicators = [
    'yes,', 'no,', 'ai video', 'can be used', 'is used',
    'allows', 'enables', 'helps', 'provides',
  ]
  
  const marketingOpeners = [
    'in this comprehensive', 'in this article', 'welcome to',
    'discover how', 'learn how',
  ]
  
  const hasDirectAnswer = answerFirstIndicators.some(ind => firstWords.includes(ind))
  const hasMarketingOpener = marketingOpeners.some(opener => firstWords.includes(opener))
  
  return {
    has: hasDirectAnswer && !hasMarketingOpener,
    wordCount: words.length,
  }
}

/**
 * 提取列表信息
 */
function extractBullets(content) {
  if (!content) return { has: false, count: 0 }
  
  const listPatterns = [
    /^\d+\.\s+[^\n]+/gm,
    /^[-*]\s+[^\n]+/gm,
    /<li[^>]*>[^<]+<\/li>/gi,
  ]
  
  let count = 0
  for (const pattern of listPatterns) {
    const matches = content.match(pattern)
    if (matches) count += matches.length
  }
  
  return { has: count >= 3, count }
}

/**
 * 提取 Steps 信息
 */
function extractSteps(content) {
  if (!content) return { has: false, count: 0 }
  
  const stepPatterns = [
    /step\s+(\d+)/gi,
    /^\d+\.\s+[^\n]*(?:step|how\s+to)/gmi,
    /<h[23][^>]*>.*step\s+\d+.*<\/h[23]>/gi,
    /###?\s+.*step\s+\d+.*$/gmi,
  ]
  
  let count = 0
  for (const pattern of stepPatterns) {
    const matches = content.match(pattern)
    if (matches) count += matches.length
  }
  
  return { has: count > 0, count }
}

/**
 * 计算 FAQ 数量
 */
function countFAQs(content) {
  if (!content) return 0
  
  const questionPatterns = [
    /^[Qq]:\s*[^\n]+/gm,
    /^[Qq]uestion\s*\d*[:\-]\s*[^\n]+/gmi,
    /^[^\n]+\?[\s\n]/gm,
    /<h[23][^>]*>.*\?.*<\/h[23]>/gi,
    /##\s+.*\?.*$/gmi,
    /###\s+.*\?.*$/gmi,
  ]
  
  let count = 0
  for (const pattern of questionPatterns) {
    const matches = content.match(pattern)
    if (matches) count += matches.length
  }
  
  return count
}

/**
 * 检查 Industry Constraints
 */
function checkIndustryConstraints(content) {
  if (!content) return false
  
  const constraintPatterns = [
    /industry\s+constraints/gi,
    /industry\s+considerations/gi,
    /industry\s+limitations/gi,
    /constraints\s+and\s+considerations/gi,
    /industry-specific\s+constraints/gi,
  ]
  
  return constraintPatterns.some(pattern => pattern.test(content))
}

/**
 * 检查 KB 锚点
 */
function checkKbAnchor(content) {
  if (!content) return false
  
  const kbAnchorPatterns = [
    /this\s+page\s+is\s+part\s+of\s+a\s+structured\s+knowledge\s+base/gi,
    /part\s+of\s+a\s+structured\s+knowledge\s+base/gi,
    /knowledge\s+base\s+on\s+ai\s+video/gi,
    /covering\s+over\s+\d+\s+industries/gi,
  ]
  
  return kbAnchorPatterns.some(pattern => pattern.test(content))
}

/**
 * 计算 AI Citation Score（JS 版本）
 */
function computeAiCitationScore(signals) {
  let score = 0
  
  // 内容结构（50分）
  if (signals.hasAnswerFirst && signals.answerWordCount >= 120 && signals.answerWordCount <= 220) {
    score += 15
  } else if (signals.hasAnswerFirst && signals.answerWordCount >= 90) {
    score += 8
  }
  
  if (signals.hasBullets) {
    score += Math.min(10, 2 + signals.bulletCount)
  }
  
  if (signals.hasSteps) {
    score += Math.min(10, 2 + signals.stepCount * 2)
  }
  
  score += Math.min(10, signals.faqCount >= 3 ? 10 : signals.faqCount * 3)
  
  if (signals.hasIndustryConstraints) {
    score += 5
  }
  
  // 去重与质量（20分）
  if (signals.wordCount >= 900) {
    score += 10
  } else if (signals.wordCount >= 600) {
    score += 6
  }
  
  score += Math.max(0, 10 * (1 - signals.nearDuplicateScore))
  
  // 权威锚点与内链（20分）
  if (signals.hasKbAnchor) {
    score += 5
  }
  
  if (signals.internalLinksOut >= 3 && signals.internalLinksOut <= 8) {
    score += 10
  } else if (signals.internalLinksOut > 0) {
    score += 3
  }
  
  // 可抓取性（10分）
  if (signals.indexable) {
    score += 10
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

if (require.main === module) {
  main()
}

module.exports = { main }
