#!/usr/bin/env node

/**
 * 检查数据库中的长尾词数据
 * 用于验证 sitemap 是否有足够的内容
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 环境变量')
  console.error('请确保 .env.local 文件中包含：')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function checkKeywords() {
  console.log('🔍 检查数据库中的长尾词数据...\n')
  console.log('='.repeat(60))

  try {
    // 1) 统计长尾词（使用 COUNT，避免拉全表导致 15 万+ 数据超时）
    console.log('\n📊 统计长尾词（COUNT 模式）\n')

    const countTotal = async () => {
      const { count, error } = await serviceClient
        .from('long_tail_keywords')
        .select('id', { count: 'exact', head: true })
      return { count: typeof count === 'number' ? count : 0, error }
    }

    const countByStatus = async (status) => {
      const { count, error } = await serviceClient
        .from('long_tail_keywords')
        .select('id', { count: 'exact', head: true })
        .eq('status', status)
      return { count: typeof count === 'number' ? count : 0, error }
    }

    const [{ count: total, error: totalError }, { count: published, error: pubError }, { count: draft, error: draftError }, { count: archived, error: archError }] =
      await Promise.all([
        countTotal(),
        countByStatus('published'),
        countByStatus('draft'),
        countByStatus('archived'),
      ])

    if (totalError) {
      console.error('❌ 查询总数失败:', totalError.message)
      process.exit(1)
    }
    if (pubError) console.warn('⚠️  查询 published 失败:', pubError.message)
    if (draftError) console.warn('⚠️  查询 draft 失败:', draftError.message)
    if (archError) console.warn('⚠️  查询 archived 失败:', archError.message)

    const otherStatus = Math.max(0, total - published - draft - archived)

    console.log(`总数: ${total.toLocaleString()}`)
    console.log(`✅ 已发布 (published): ${published.toLocaleString()}`)
    console.log(`📝 草稿 (draft): ${draft.toLocaleString()}`)
    console.log(`📦 已归档 (archived): ${archived.toLocaleString()}`)
    if (otherStatus > 0) console.log(`❓ 其他状态: ${otherStatus.toLocaleString()}`)

    // 1.1) 检查历史遗留 .xml slug 数量（会影响 canonical/重复页面信号）
    const { count: xmlSlugCount, error: xmlCountError } = await serviceClient
      .from('long_tail_keywords')
      .select('id', { count: 'exact', head: true })
      .ilike('page_slug', '%.xml')

    if (xmlCountError) {
      console.warn('⚠️  查询 .xml slug 数量失败:', xmlCountError.message)
    } else {
      console.log(`🧹 page_slug 以 .xml 结尾的记录数: ${(xmlSlugCount || 0).toLocaleString()}`)
    }

    // 2. 检查已发布的长尾词（用于 sitemap）
    console.log('\n' + '='.repeat(60))
    console.log('\n🗺️  用于 Sitemap 的数据（已发布的长尾词）\n')

    const { data: publishedKeywords, error: publishedError } = await serviceClient
      .from('long_tail_keywords')
      .select('page_slug, keyword, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(10)

    if (publishedError) {
      console.error('❌ 查询已发布的长尾词失败:', publishedError.message)
    } else {
      console.log(`已发布的长尾词总数: ${published}`)
      console.log(`\n前 10 个已发布的长尾词:`)
      
      if (publishedKeywords && publishedKeywords.length > 0) {
        publishedKeywords.forEach((kw, index) => {
          console.log(`\n${index + 1}. ${kw.keyword}`)
          console.log(`   Slug: ${kw.page_slug}`)
          console.log(`   更新时间: ${kw.updated_at ? new Date(kw.updated_at).toLocaleString('zh-CN') : 'N/A'}`)
          console.log(`   URL: https://sora2aivideos.com/keywords/${kw.page_slug}`)
        })
      } else {
        console.log('⚠️  没有找到已发布的长尾词！')
      }
    }

    // 3. 检查 sitemap 会包含的 URL
    console.log('\n' + '='.repeat(60))
    console.log('\n🔗 Sitemap 生成的 URL\n')

    if (published > 0) {
      console.log(`✅ Sitemap 将包含 ${published} 个长尾词页面 URL`)
      console.log(`\n示例 URL:`)
      if (publishedKeywords && publishedKeywords.length > 0) {
        publishedKeywords.slice(0, 5).forEach(kw => {
          console.log(`  - https://sora2aivideos.com/keywords/${kw.page_slug}`)
        })
        if (published > 5) {
          console.log(`  ... 还有 ${published - 5} 个 URL`)
        }
      }
    } else {
      console.log('⚠️  警告：没有已发布的长尾词！')
      console.log('   Sitemap 将不包含任何长尾词页面。')
      console.log('   这可能就是为什么 Google Search Console 显示"已发现的网页：0"的原因。')
    }

    // 4. 检查是否有问题
    console.log('\n' + '='.repeat(60))
    console.log('\n📋 检查结果\n')

    if (published === 0) {
      console.log('❌ 问题：没有已发布的长尾词')
      console.log('   解决方案：')
      console.log('   1. 在管理员后台发布一些长尾词（将状态改为 published）')
      console.log('   2. 或者检查长尾词的状态是否正确')
    } else if (published < 10) {
      console.log('⚠️  提示：已发布的长尾词数量较少（少于 10 个）')
      console.log('   建议发布更多长尾词以获得更好的 SEO 效果')
    } else {
      console.log('✅ 状态良好：有足够数量的已发布长尾词')
    }

    // 5. 验证 sitemap 可访问性提示
    console.log('\n' + '='.repeat(60))
    console.log('\n🌐 验证 Sitemap\n')

    if (published > 0) {
      console.log('请在浏览器中访问以下 URL 验证 sitemap:')
      console.log('  1. 主 sitemap: https://sora2aivideos.com/sitemap.xml')
      console.log('  2. 长尾词 sitemap（分页）: https://sora2aivideos.com/sitemap-long-tail.xml?page=1')
      console.log(`\n长尾词已发布: ${published.toLocaleString()}（每页最多 50,000）`)
      console.log(`理论分页数: ${Math.ceil(published / 50000)}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n✅ 检查完成！\n')

  } catch (error) {
    console.error('❌ 检查过程中出错:', error.message)
    process.exit(1)
  }
}

checkKeywords()

