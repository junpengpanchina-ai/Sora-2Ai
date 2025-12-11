#!/usr/bin/env node

/**
 * 添加 Christmas 关键词到数据库
 * 使用 Supabase Service Role Key 直接操作数据库
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

const christmasKeyword = {
  keyword: 'Christmas',
  intent: 'information',
  page_style: 'christmas',
  page_slug: 'keywords-christmas',
  title: 'Christmas | Create Festive Videos with AI',
  meta_description: 'Create beautiful Christmas videos for free online using AI. Generate festive holiday content with Sora2Ai video generator. No signup required, instant results.',
  h1: 'Create Christmas Videos Free Online with AI',
  intro_paragraph: 'Looking to create stunning Christmas videos for your holiday celebrations? Our free online Christmas video generator powered by AI makes it easy to produce festive content in minutes. Whether you need videos for social media, family greetings, or marketing campaigns, our tool helps you generate high-quality Christmas-themed videos without any technical skills. Simply enter your prompt describing your Christmas scene, and our AI will create beautiful, festive videos featuring snow, decorations, holiday themes, and more. Perfect for spreading holiday cheer and creating memorable content.',
  product: 'Sora2Ai Video',
  service: 'Online Video Generator',
  region: 'Global',
  priority: 10,
  status: 'published',
  steps: [
    {
      title: 'Enter Your Christmas Video Prompt',
      description: 'Describe your Christmas scene in detail. For example: "A cozy living room with a decorated Christmas tree, fireplace, and snow falling outside the window."'
    },
    {
      title: 'Choose Video Settings',
      description: 'Select your preferred aspect ratio (16:9, 9:16, or 1:1) and video duration. Our AI will optimize your Christmas video accordingly.'
    },
    {
      title: 'Generate Your Christmas Video',
      description: 'Click generate and wait a few moments. Our AI will create your festive Christmas video with beautiful holiday themes and effects.'
    },
    {
      title: 'Download and Share',
      description: 'Once your video is ready, download it and share it on social media, send it to family and friends, or use it in your holiday marketing campaigns.'
    }
  ],
  faq: [
    {
      question: 'Is the Christmas video generator really free?',
      answer: 'Yes, our Christmas video generator is completely free to use. You can create multiple Christmas videos without any cost or signup required.'
    },
    {
      question: 'What kind of Christmas videos can I create?',
      answer: 'You can create various Christmas-themed videos including snowy scenes, decorated homes, holiday celebrations, winter landscapes, and festive animations. The AI can generate any Christmas scene you describe.'
    },
    {
      question: 'How long does it take to generate a Christmas video?',
      answer: 'Typically, it takes 1-3 minutes to generate a Christmas video depending on the complexity of your prompt and current server load.'
    },
    {
      question: 'Can I use the Christmas videos for commercial purposes?',
      answer: 'Yes, you can use the generated Christmas videos for personal and commercial purposes, including social media posts, marketing campaigns, and holiday greetings.'
    },
    {
      question: 'Do I need to create an account to use the Christmas video generator?',
      answer: 'No account is required. You can start creating Christmas videos immediately without any registration or signup process.'
    }
  ]
}

async function addChristmasKeyword() {
  console.log('🎄 正在添加 Christmas 关键词到数据库...\n')
  console.log('='.repeat(60))

  try {
    // 先检查是否已存在
    const { data: existing, error: checkError } = await serviceClient
      .from('long_tail_keywords')
      .select('id, keyword, page_slug, status')
      .eq('page_slug', christmasKeyword.page_slug)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ 检查现有关键词时出错:', checkError.message)
      process.exit(1)
    }

    if (existing) {
      console.log('⚠️  发现已存在的关键词:')
      console.log(`   关键词: ${existing.keyword}`)
      console.log(`   Slug: ${existing.page_slug}`)
      console.log(`   状态: ${existing.status}`)
      console.log('\n🔄 更新现有关键词...\n')
      
      // 更新现有记录
      const { data: updated, error: updateError } = await serviceClient
        .from('long_tail_keywords')
        .update({
          ...christmasKeyword,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ 更新失败:', updateError.message)
        console.error('详细信息:', updateError)
        process.exit(1)
      }

      console.log('✅ 关键词已成功更新！\n')
      console.log('📋 更新后的信息:')
      console.log(`   关键词: ${updated.keyword}`)
      console.log(`   Slug: ${updated.page_slug}`)
      console.log(`   页面风格: ${updated.page_style}`)
      console.log(`   状态: ${updated.status}`)
      console.log(`   标题: ${updated.title}`)
      console.log(`   步骤数: ${Array.isArray(updated.steps) ? updated.steps.length : 0}`)
      console.log(`   FAQ 数: ${Array.isArray(updated.faq) ? updated.faq.length : 0}`)
      console.log(`\n🌐 访问 URL: https://sora2aivideos.com/keywords/${updated.page_slug}`)
      
    } else {
      console.log('✨ 创建新关键词...\n')
      
      // 插入新记录
      const { data: inserted, error: insertError } = await serviceClient
        .from('long_tail_keywords')
        .insert(christmasKeyword)
        .select()
        .single()

      if (insertError) {
        console.error('❌ 插入失败:', insertError.message)
        console.error('详细信息:', insertError)
        process.exit(1)
      }

      console.log('✅ 关键词已成功创建！\n')
      console.log('📋 创建的信息:')
      console.log(`   关键词: ${inserted.keyword}`)
      console.log(`   Slug: ${inserted.page_slug}`)
      console.log(`   页面风格: ${inserted.page_style}`)
      console.log(`   状态: ${inserted.status}`)
      console.log(`   标题: ${inserted.title}`)
      console.log(`   步骤数: ${Array.isArray(inserted.steps) ? inserted.steps.length : 0}`)
      console.log(`   FAQ 数: ${Array.isArray(inserted.faq) ? inserted.faq.length : 0}`)
      console.log(`\n🌐 访问 URL: https://sora2aivideos.com/keywords/${inserted.page_slug}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n✅ 操作完成！\n')
    console.log('💡 提示:')
    console.log('   - 关键词已设置为 "published" 状态，可以立即访问')
    console.log('   - 页面使用 Christmas 主题风格，包含动态背景和背景音乐')
    console.log('   - 如果页面未显示，请检查 sitemap 缓存是否需要重新生成')

  } catch (error) {
    console.error('❌ 操作过程中出错:', error.message)
    console.error('错误详情:', error)
    process.exit(1)
  }
}

addChristmasKeyword()
