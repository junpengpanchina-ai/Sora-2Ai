#!/usr/bin/env node

/**
 * AI 引用概率排序脚本
 * 
 * 从所有页面中筛选出最可能被 AI 引用的 5000 页
 * 并按照 AI Citation Score 排序
 * 
 * 使用方法：
 * node scripts/calculate-ai-citation-top5000.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 注意：由于这是 JS 文件，需要直接实现或使用 ts-node/tsx
// 这里我们直接实现核心逻辑，避免 TypeScript 导入问题

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量')
  console.error('请确保 .env.local 中包含:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Step 1: 基础候选池（约 20k）
 */
async function getBaseCandidatePool() {
  console.log('📊 Step 1: 获取基础候选池...')
  
  try {
    // 查询符合基础条件的页面
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('use_cases')
      .select('id, slug, title, content, industry, use_case_type, related_use_case_ids')
      .eq('is_published', true)
      .not('industry', 'is', null)
      .not('content', 'is', null)
      .limit(20000) // 限制查询数量，避免超时

    if (error) {
      throw error
    }

    console.log(`✅ 获取到 ${data.length} 个候选页面`)
    return data || []
  } catch (error) {
    console.error('❌ 查询错误:', error)
    return []
  }
}

/**
 * Step 2: 计算 AI Citation Score 并过滤
 */
function calculateAndFilter(pages) {
  console.log('\n📊 Step 2: 计算 AI Citation Score...')
  
  const scoredPages = []
  let excludedCount = 0

  for (const page of pages) {
    // Step 3: 过滤"AI 不爱"的页面
    if (shouldExcludePage({
      slug: page.slug,
      title: page.title,
      content: page.content,
      use_case_type: page.use_case_type,
    })) {
      excludedCount++
      continue
    }

    // 计算 AI Citation Score
    const { score, breakdown } = calculateAICitationScore({
      slug: page.slug,
      title: page.title,
      content: page.content,
      industry: page.industry,
      use_case_type: page.use_case_type,
      related_use_case_ids: page.related_use_case_ids,
    })

    scoredPages.push({
      ...page,
      aiCitationScore: score,
      scoreBreakdown: breakdown,
    })
  }

  console.log(`✅ 计算完成: ${scoredPages.length} 个页面`)
  console.log(`❌ 已排除: ${excludedCount} 个页面（AI 不喜欢的类型）`)

  return scoredPages
}

/**
 * Step 4: 排序并取前 5000
 */
function sortAndLimit(scoredPages) {
  console.log('\n📊 Step 4: 排序并取前 5000...')
  
  // 按 AI Citation Score 降序排序
  const sorted = scoredPages.sort((a, b) => b.aiCitationScore - a.aiCitationScore)
  
  // 取前 5000
  const top5000 = sorted.slice(0, 5000)
  
  console.log(`✅ 已筛选出 Top 5000 页面`)
  console.log(`   最高分: ${top5000[0]?.aiCitationScore || 0}`)
  console.log(`   最低分: ${top5000[top5000.length - 1]?.aiCitationScore || 0}`)
  
  return top5000
}

/**
 * Step 5: 生成 3 个列表
 */
function generateLists(top5000) {
  console.log('\n📊 Step 5: 生成 3 个列表...')
  
  const listA = top5000.slice(0, 1000) // Top 1000
  const listB = top5000.slice(1000, 3000) // Next 2000
  const listC = top5000.slice(3000, 5000) // Long-tail 2000
  
  console.log(`✅ List A (Top 1000): ${listA.length} 页`)
  console.log(`✅ List B (Next 2000): ${listB.length} 页`)
  console.log(`✅ List C (Long-tail 2000): ${listC.length} 页`)
  
  return { listA, listB, listC }
}

/**
 * 保存结果到文件
 */
function saveResults(lists) {
  const outputDir = path.join(__dirname, '../data/ai-citation-lists')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().split('T')[0]
  
  // 保存为 JSON
  const jsonFile = path.join(outputDir, `ai-citation-top5000-${timestamp}.json`)
  fs.writeFileSync(jsonFile, JSON.stringify(lists, null, 2), 'utf8')
  console.log(`\n✅ JSON 文件已保存: ${jsonFile}`)

  // 保存为 CSV（便于 Excel 打开）
  const csvFile = path.join(outputDir, `ai-citation-top5000-${timestamp}.csv`)
  const csvHeader = 'Rank,Slug,Title,Industry,Scene,AI Citation Score,Answer First,FAQ-B,Industry Constraints,Noun Phrases,URL Match,Internal Links\n'
  const csvRows = []
  
  let rank = 1
  for (const list of [lists.listA, lists.listB, lists.listC]) {
    for (const page of list) {
      csvRows.push([
        rank++,
        page.slug,
        `"${page.title.replace(/"/g, '""')}"`,
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

  // 生成 Markdown 报告
  const mdFile = path.join(outputDir, `ai-citation-report-${timestamp}.md`)
  const mdReport = generateMarkdownReport(lists)
  fs.writeFileSync(mdFile, mdReport, 'utf8')
  console.log(`✅ Markdown 报告已保存: ${mdFile}`)
}

/**
 * 生成 Markdown 报告
 */
function generateMarkdownReport(lists) {
  return `# AI Citation Top 5000 报告

生成时间: ${new Date().toISOString()}

## 📁 List A｜Top 1000（绝对核心）

**行动**:
- ✅ 放进 Tier1 sitemap
- ✅ 优先内链
- ❌ 不准改结构

**统计**:
- 平均 AI Citation Score: ${(lists.listA.reduce((sum, p) => sum + p.aiCitationScore, 0) / lists.listA.length).toFixed(1)}
- 最高分: ${lists.listA[0]?.aiCitationScore || 0}
- 最低分: ${lists.listA[lists.listA.length - 1]?.aiCitationScore || 0}

**前 10 页**:
${lists.listA.slice(0, 10).map((p, i) => `${i + 1}. [${p.slug}](https://sora2aivideos.com/use-cases/${p.slug}) - Score: ${p.aiCitationScore}`).join('\n')}

---

## 📁 List B｜Next 2000（潜力池）

**行动**:
- 🟡 轻补 FAQ-B / Constraints
- 🟡 2 周后观察 Index

**统计**:
- 平均 AI Citation Score: ${(lists.listB.reduce((sum, p) => sum + p.aiCitationScore, 0) / lists.listB.length).toFixed(1)}
- 最高分: ${lists.listB[0]?.aiCitationScore || 0}
- 最低分: ${lists.listB[lists.listB.length - 1]?.aiCitationScore || 0}

---

## 📁 List C｜Long-tail 2000

**行动**:
- ⚪ 不动
- ⚪ 当"知识密度缓冲"

**统计**:
- 平均 AI Citation Score: ${(lists.listC.reduce((sum, p) => sum + p.aiCitationScore, 0) / lists.listC.length).toFixed(1)}
- 最高分: ${lists.listC[0]?.aiCitationScore || 0}
- 最低分: ${lists.listC[lists.listC.length - 1]?.aiCitationScore || 0}

---

## 🧠 一句话帮你重新理解现状

你现在的问题 **不是"没流量"**，而是：

Google 还在判断：
你是"模板站"，还是"可引用知识库"。

Index Health 是信任指标，
不是流量指标。

---

## ✅ 接下来 7 天你只需要做 3 件事

1. ✅ 上线 Tier1 sitemap
2. ✅ 每周只看 Index Health 周报
3. ✅ 只盯那 5000 页，不要被 11 万页干扰
`
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始计算 AI Citation Top 5000...\n')

  try {
    // Step 1: 获取基础候选池
    const candidatePool = await getBaseCandidatePool()
    
    if (candidatePool.length === 0) {
      console.error('❌ 没有找到候选页面')
      process.exit(1)
    }

    // Step 2: 计算 AI Citation Score 并过滤
    const scoredPages = calculateAndFilter(candidatePool)

    // Step 4: 排序并取前 5000
    const top5000 = sortAndLimit(scoredPages)

    // Step 5: 生成 3 个列表
    const lists = generateLists(top5000)

    // 保存结果
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
