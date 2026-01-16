#!/usr/bin/env node

/**
 * AI 引用概率排序脚本（独立版本，不依赖 TypeScript）
 * 
 * 从所有页面中筛选出最可能被 AI 引用的 5000 页
 * 并按照 AI Citation Score 排序
 * 
 * 使用方法：
 * node scripts/calculate-ai-citation-top5000-standalone.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ========== AI Citation Score 计算逻辑（独立实现） ==========

function countWords(text) {
  if (!text || typeof text !== 'string') return 0
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

function hasAnswerFirst(content) {
  if (!content) return false
  const textWithoutMarkdown = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
  const words = textWithoutMarkdown.split(/[\s\n\r\t,.;:!?()[\]{}'"]+/).filter(w => w.length > 0).slice(0, 200)
  const first200Words = words.join(' ').toLowerCase()
  const answerFirstIndicators = ['yes,', 'no,', 'ai video', 'can be used', 'is used', 'allows', 'enables', 'helps', 'provides']
  const marketingOpeners = ['in this comprehensive', 'in this article', 'welcome to', 'discover how', 'learn how']
  const hasDirectAnswer = answerFirstIndicators.some(ind => first200Words.includes(ind))
  const hasMarketingOpener = marketingOpeners.some(opener => first200Words.includes(opener))
  return hasDirectAnswer && !hasMarketingOpener
}

function hasFAQ_B(content) {
  if (!content) return false
  const faqBPatterns = [
    /when\s+should\s+(?:ai\s+video|you)\s+not\s+be\s+used/gi,
    /when\s+is\s+(?:ai\s+video|this)\s+not\s+suitable/gi,
    /what\s+are\s+(?:the\s+)?(?:limitations|constraints|restrictions)/gi,
    /when\s+should\s+you\s+avoid/gi,
    /what\s+are\s+common\s+limitations/gi,
    /industry\s+constraints/gi,
    /when\s+not\s+to\s+use/gi,
  ]
  return faqBPatterns.some(pattern => pattern.test(content))
}

function hasIndustryConstraints(content) {
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

function hasNounPhrases(content) {
  if (!content) return false
  const listPatterns = [/^\d+\.\s+[^\n]+/gm, /^[-*]\s+[^\n]+/gm, /<li[^>]*>[^<]+<\/li>/gi]
  let count = 0
  for (const pattern of listPatterns) {
    const matches = content.match(pattern)
    if (matches) count += matches.length
  }
  return count >= 3
}

function urlMatchesIndustryScene(slug, industry, useCaseType) {
  if (!slug || !industry || !useCaseType) return false
  const slugLower = slug.toLowerCase()
  const industryLower = industry.toLowerCase().replace(/\s+/g, '-')
  const sceneLower = useCaseType.toLowerCase()
  const hasIndustry = slugLower.includes(industryLower) || industryLower.split('-').some(w => slugLower.includes(w))
  const hasScene = slugLower.includes(sceneLower) || sceneLower.split('-').some(w => slugLower.includes(w))
  return hasIndustry && hasScene
}

function hasGoodInternalLinks(relatedUseCaseIds) {
  return relatedUseCaseIds && Array.isArray(relatedUseCaseIds) && relatedUseCaseIds.length >= 3
}

function shouldExcludePage(page) {
  const slugLower = page.slug.toLowerCase()
  const titleLower = page.title.toLowerCase()
  const contentLower = page.content.toLowerCase()
  const excludePatterns = [/pricing/i, /landing/i, /signup/i, /login/i, /checkout/i, /^what\s+is\s+ai\s+video/i, /^introduction\s+to/i, /^overview\s+of/i, /best\s+.*\s+tool/i, /\s+vs\s+/i, /alternative/i, /comparison/i, /cheap|discount|free\s+trial|limited\s+time/i]
  const slugOrTitleMatch = excludePatterns.some(p => p.test(slugLower) || p.test(titleLower))
  const marketingWords = ['cheap', 'discount', 'limited time', 'act now', 'buy now', 'sign up now']
  const marketingWordCount = marketingWords.filter(w => contentLower.includes(w)).length
  return slugOrTitleMatch || marketingWordCount >= 3
}

function calculateAICitationScore(page) {
  let score = 0
  const breakdown = { answerFirst: 0, faqB: 0, industryConstraints: 0, nounPhrases: 0, urlMatch: 0, internalLinks: 0 }
  
  if (hasAnswerFirst(page.content)) { score += 30; breakdown.answerFirst = 30 }
  if (hasFAQ_B(page.content)) { score += 20; breakdown.faqB = 20 }
  if (hasIndustryConstraints(page.content)) { score += 15; breakdown.industryConstraints = 15 }
  if (hasNounPhrases(page.content)) { score += 15; breakdown.nounPhrases = 15 }
  if (urlMatchesIndustryScene(page.slug, page.industry, page.use_case_type)) { score += 10; breakdown.urlMatch = 10 }
  if (hasGoodInternalLinks(page.related_use_case_ids)) { score += 10; breakdown.internalLinks = 10 }
  
  return { score: Math.min(100, score), breakdown }
}

// ========== 主逻辑 ==========

async function getBaseCandidatePool() {
  console.log('📊 Step 1: 获取基础候选池...')
  try {
    const { data, error } = await supabase
      .from('use_cases')
      .select('id, slug, title, content, industry, use_case_type, related_use_case_ids')
      .eq('is_published', true)
      .not('industry', 'is', null)
      .not('content', 'is', null)
      .limit(20000)
    if (error) throw error
    console.log(`✅ 获取到 ${data.length} 个候选页面`)
    return data || []
  } catch (error) {
    console.error('❌ 查询错误:', error)
    return []
  }
}

function calculateAndFilter(pages) {
  console.log('\n📊 Step 2: 计算 AI Citation Score...')
  const scoredPages = []
  let excludedCount = 0
  for (const page of pages) {
    if (shouldExcludePage(page)) { excludedCount++; continue }
    const { score, breakdown } = calculateAICitationScore(page)
    scoredPages.push({ ...page, aiCitationScore: score, scoreBreakdown: breakdown })
  }
  console.log(`✅ 计算完成: ${scoredPages.length} 个页面`)
  console.log(`❌ 已排除: ${excludedCount} 个页面`)
  return scoredPages
}

function sortAndLimit(scoredPages) {
  console.log('\n📊 Step 4: 排序并取前 5000...')
  const sorted = scoredPages.sort((a, b) => b.aiCitationScore - a.aiCitationScore)
  const top5000 = sorted.slice(0, 5000)
  console.log(`✅ 已筛选出 Top 5000 页面`)
  console.log(`   最高分: ${top5000[0]?.aiCitationScore || 0}`)
  console.log(`   最低分: ${top5000[top5000.length - 1]?.aiCitationScore || 0}`)
  return top5000
}

function generateLists(top5000) {
  console.log('\n📊 Step 5: 生成 3 个列表...')
  const listA = top5000.slice(0, 1000)
  const listB = top5000.slice(1000, 3000)
  const listC = top5000.slice(3000, 5000)
  console.log(`✅ List A (Top 1000): ${listA.length} 页`)
  console.log(`✅ List B (Next 2000): ${listB.length} 页`)
  console.log(`✅ List C (Long-tail 2000): ${listC.length} 页`)
  return { listA, listB, listC }
}

function saveResults(lists) {
  const outputDir = path.join(__dirname, '../data/ai-citation-lists')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  const timestamp = new Date().toISOString().split('T')[0]
  
  const jsonFile = path.join(outputDir, `ai-citation-top5000-${timestamp}.json`)
  fs.writeFileSync(jsonFile, JSON.stringify(lists, null, 2), 'utf8')
  console.log(`\n✅ JSON 文件已保存: ${jsonFile}`)

  const csvFile = path.join(outputDir, `ai-citation-top5000-${timestamp}.csv`)
  const csvHeader = 'Rank,Slug,Title,Industry,Scene,AI Citation Score,Answer First,FAQ-B,Industry Constraints,Noun Phrases,URL Match,Internal Links\n'
  const csvRows = []
  let rank = 1
  for (const list of [lists.listA, lists.listB, lists.listC]) {
    for (const page of list) {
      csvRows.push([
        rank++,
        page.slug,
        `"${(page.title || '').replace(/"/g, '""')}"`,
        page.industry || '',
        page.use_case_type || '',
        page.aiCitationScore,
        page.scoreBreakdown.answerFirst > 0 ? 'Yes' : 'No',
        page.scoreBreakdown.faqB > 0 ? 'Yes' : 'No',
        page.scoreBreakdown.industryConstraints > 0 ? 'Yes' : 'No',
        page.scoreBreakdown.nounPhrases > 0 ? 'Yes' : 'No',
        page.scoreBreakdown.urlMatch > 0 ? 'Yes' : 'No',
        page.scoreBreakdown.internalLinks > 0 ? 'Yes' : 'No',
      ].join(','))
    }
  }
  fs.writeFileSync(csvFile, csvHeader + csvRows.join('\n'), 'utf8')
  console.log(`✅ CSV 文件已保存: ${csvFile}`)

  const mdFile = path.join(outputDir, `ai-citation-report-${timestamp}.md`)
  const mdReport = `# AI Citation Top 5000 报告\n\n生成时间: ${new Date().toISOString()}\n\n## 📁 List A｜Top 1000（绝对核心）\n\n**行动**:\n- ✅ 放进 Tier1 sitemap\n- ✅ 优先内链\n- ❌ 不准改结构\n\n**统计**:\n- 平均 AI Citation Score: ${(lists.listA.reduce((sum, p) => sum + p.aiCitationScore, 0) / lists.listA.length).toFixed(1)}\n- 最高分: ${lists.listA[0]?.aiCitationScore || 0}\n- 最低分: ${lists.listA[lists.listA.length - 1]?.aiCitationScore || 0}\n\n**前 10 页**:\n${lists.listA.slice(0, 10).map((p, i) => `${i + 1}. [${p.slug}](https://sora2aivideos.com/use-cases/${p.slug}) - Score: ${p.aiCitationScore}`).join('\n')}\n\n---\n\n## 📁 List B｜Next 2000（潜力池）\n\n**行动**:\n- 🟡 轻补 FAQ-B / Constraints\n- 🟡 2 周后观察 Index\n\n**统计**:\n- 平均 AI Citation Score: ${(lists.listB.reduce((sum, p) => sum + p.aiCitationScore, 0) / lists.listB.length).toFixed(1)}\n\n---\n\n## 📁 List C｜Long-tail 2000\n\n**行动**:\n- ⚪ 不动\n- ⚪ 当"知识密度缓冲"\n\n**统计**:\n- 平均 AI Citation Score: ${(lists.listC.reduce((sum, p) => sum + p.aiCitationScore, 0) / lists.listC.length).toFixed(1)}\n`
  fs.writeFileSync(mdFile, mdReport, 'utf8')
  console.log(`✅ Markdown 报告已保存: ${mdFile}`)
}

async function main() {
  console.log('🚀 开始计算 AI Citation Top 5000...\n')
  try {
    const candidatePool = await getBaseCandidatePool()
    if (candidatePool.length === 0) { console.error('❌ 没有找到候选页面'); process.exit(1) }
    const scoredPages = calculateAndFilter(candidatePool)
    const top5000 = sortAndLimit(scoredPages)
    const lists = generateLists(top5000)
    saveResults(lists)
    console.log('\n✅ 完成！')
  } catch (error) {
    console.error('❌ 错误:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }
