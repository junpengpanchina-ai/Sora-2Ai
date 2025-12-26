import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import {
  createChatCompletion,
  createChatCompletionStream,
  type ChatCompletionRequest,
} from '@/lib/grsai/client'
import { selectSEOModel, detectSEOTaskType, getSEOSystemPrompt } from '@/lib/admin-chat/seo-model-selector'
import { createServiceClient } from '@/lib/supabase/service'
import { SEO_CONTENT_TEMPLATES, renderTemplate } from '@/lib/prompts/seo-content-templates'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/admin/seo-chat
 * SEO 场景专用的聊天 API，支持 SEO 模板、数据查询、智能模型选择
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const {
      sessionId,
      message,
      images = [],
      model: requestedModel,
      stream = true,
      saveHistory = true,
      useTemplate, // 是否使用 SEO 模板
      templateId, // 模板 ID
      templateParams = {}, // 模板参数
    } = body

    // 参数验证
    if (!message && (!images || images.length === 0)) {
      return NextResponse.json(
        { success: false, error: '消息内容或图片至少需要提供一个' },
        { status: 400 }
      )
    }

    // 检测 SEO 任务类型
    const seoTaskAnalysis = detectSEOTaskType(message || '')
    
    // 智能模型选择（如果用户没有指定模型）
    let selectedModel = requestedModel
    if (!selectedModel) {
      selectedModel = selectSEOModel(message || '', images)
    }

    // 构建系统提示词（SEO 专用）
    const systemPrompt = getSEOSystemPrompt(seoTaskAnalysis.taskType)

    // 构建用户消息
    let userMessage = message || ''
    
    // 如果使用模板，渲染模板内容
    if (useTemplate && templateId) {
      const template = SEO_CONTENT_TEMPLATES.find(t => t.id === templateId)
      if (template) {
        const renderedTemplate = renderTemplate(template.template, templateParams)
        userMessage = `Please generate SEO content based on the following template:\n\n${renderedTemplate}`
        
        // 添加用户的自定义要求（如果有）
        if (message && message.trim()) {
          userMessage += `\n\nAdditional requirements: ${message}`
        }
      }
    }
    
    // 如果有图片，将图片信息添加到文本中
    if (images && images.length > 0) {
      if (userMessage) {
        userMessage += `\n\n[包含 ${images.length} 张图片，请分析这些图片并生成相应的 SEO 内容]`
      } else {
        userMessage = `[包含 ${images.length} 张图片，请分析这些图片并生成相应的 SEO 内容]`
      }
      console.log(`[SEO Chat] 用户上传了 ${images.length} 张图片`)
    }

    // 构建消息列表
    const messages: Array<{
      role: 'system' | 'user' | 'assistant'
      content: string
    }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]

    // 如果有 sessionId，加载历史消息
    if (sessionId && saveHistory) {
      const supabase = await createServiceClient()
      const { data: historyMessages, error: historyError } = await (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('admin_chat_messages') as any)
          .select('role, content, images')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
      )

      if (!historyError && historyMessages && historyMessages.length > 0) {
        // 将历史消息转换为 API 格式（排除 system 消息，因为我们已经有了）
        const formattedHistory: Array<{
          role: 'user' | 'assistant'
          content: string
        }> = []

        for (const msg of historyMessages) {
          if (msg.role === 'system') continue // 跳过系统消息
          
          let content = (msg.content as string) || ''
          
          // 如果有图片，添加到内容描述中
          if (msg.images && Array.isArray(msg.images) && msg.images.length > 0) {
            if (content) {
              content += `\n\n[包含 ${msg.images.length} 张图片]`
            } else {
              content = `[包含 ${msg.images.length} 张图片]`
            }
          }
          
          formattedHistory.push({ 
            role: msg.role as 'user' | 'assistant', 
            content 
          })
        }

        // 将历史消息插入到当前消息之前（系统提示词之后）
        messages.splice(1, 0, ...formattedHistory)
      }
    }

    // 构建 API 请求参数
    const chatParams: ChatCompletionRequest = {
      model: selectedModel,
      stream,
      messages,
    }
    
    // 如果使用 gemini-3-flash 或 gemini-3-pro，启用联网搜索（用于 SEO 策略、竞争分析等）
    if (selectedModel === 'gemini-3-flash' || selectedModel === 'gemini-3-pro') {
      chatParams.tools = [{ type: 'google_search_retrieval' }]
    }

    // 如果是流式响应
    if (stream) {
      const encoder = new TextEncoder()
      const responseStream = new ReadableStream({
        async start(controller) {
          try {
            let fullResponse = ''
            const chatStream = createChatCompletionStream(chatParams)
            
            for await (const chunk of chatStream) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`
              controller.enqueue(encoder.encode(data))
              
              // 收集完整响应内容
              if (chunk.choices && chunk.choices.length > 0) {
                const delta = chunk.choices[0].delta
                if (delta?.content) {
                  fullResponse += delta.content
                }
              }
            }
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()

            // 保存消息到数据库
            if (saveHistory && sessionId) {
              await saveMessagesToDatabase(
                sessionId,
                adminUser.id,
                messages,
                fullResponse,
                selectedModel,
                images,
                seoTaskAnalysis.taskType
              )
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误'
            controller.error(new Error(errorMessage))
          }
        },
      })

      return new NextResponse(responseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // 检查 API Key 配置
    const apiKey = process.env.GRSAI_API_KEY
    if (!apiKey) {
      console.error('[SEO Chat] GRSAI_API_KEY 未配置')
      return NextResponse.json({
        success: false,
        error: 'API Key 未配置',
        debug: {
          suggestion: '请检查环境变量 GRSAI_API_KEY 是否已设置',
        },
      }, { status: 500 })
    }

    // 非流式响应
    const response = await createChatCompletion(chatParams)
    
    // 检查响应是否有效
    if (!response.choices || response.choices.length === 0) {
      // 记录详细的诊断信息
      const apiKeyPrefix = apiKey ? apiKey.substring(0, 10) + '...' : '未配置'
      const chatHost = process.env.GRSAI_CHAT_HOST || 'https://api.grsai.com'
      
      console.error('[SEO Chat] ⚠️⚠️⚠️ API 返回空 choices 数组！', {
        model: selectedModel,
        apiKeyConfigured: !!apiKey,
        apiKeyPrefix,
        chatHost,
        responseStructure: {
          hasChoices: !!response.choices,
          choicesLength: response.choices?.length || 0,
          hasId: !!response.id,
          hasModel: !!response.model,
          hasObject: !!response.object,
          fullResponseKeys: Object.keys(response || {}),
        },
        requestInfo: {
          messageLength: userMessage?.length || 0,
          imagesCount: images?.length || 0,
          taskType: seoTaskAnalysis.taskType,
        },
      })
      
      // 检查响应中是否有错误信息
      const errorInfo = (response as { error?: { message?: string; type?: string; code?: string } })?.error
      
      return NextResponse.json({
        success: false,
        error: errorInfo?.message || 'API 返回空 choices 数组，可能请求被拒绝或格式错误',
        debug: {
          model: selectedModel,
          apiKeyConfigured: !!apiKey,
          apiKeyPrefix,
          chatHost,
          errorInfo,
          responseStructure: {
            hasChoices: !!response.choices,
            choicesLength: response.choices?.length || 0,
            hasId: !!response.id,
            hasModel: !!response.model,
            fullResponse: process.env.NODE_ENV === 'development' ? response : undefined,
          },
          suggestions: [
            !apiKey ? '检查 GRSAI_API_KEY 环境变量是否已配置' : null,
            '检查 API Key 是否有效（未过期、有足够权限）',
            '检查 API 服务是否可用（https://api.grsai.com）',
            '检查请求内容是否被过滤或拒绝',
            '查看服务器日志获取更多详细信息',
          ].filter(Boolean),
        },
      }, { status: 500 })
    }

    if (!response.choices[0]?.message?.content) {
      console.error('[SEO Chat] API 返回空 content！完整响应:', JSON.stringify(response, null, 2))
      return NextResponse.json({
        success: false,
        error: 'API 返回空 content，可能内容被过滤或拒绝',
        debug: {
          model: selectedModel,
          responseStructure: {
            hasChoices: !!response.choices,
            choicesLength: response.choices?.length || 0,
            hasContent: !!response.choices[0]?.message?.content,
            finishReason: response.choices[0]?.finish_reason,
            fullResponse: process.env.NODE_ENV === 'development' ? response : undefined,
          },
        },
      }, { status: 500 })
    }

    const assistantContent = response.choices[0].message.content

    // 保存消息到数据库
    if (saveHistory && sessionId) {
      await saveMessagesToDatabase(
        sessionId,
        adminUser.id,
        messages,
        assistantContent,
        selectedModel,
        images,
        seoTaskAnalysis.taskType
      )
    }

    return NextResponse.json({
      success: true,
      data: response,
      model: selectedModel,
      taskType: seoTaskAnalysis.taskType,
    })
  } catch (error) {
    console.error('SEO Chat API 错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    
    // 如果是 API Key 相关错误，提供更详细的提示
    let errorDetails = errorMessage
    if (error instanceof Error) {
      if (error.message.includes('GRSAI_API_KEY')) {
        errorDetails = 'API Key 未配置或无效，请检查环境变量 GRSAI_API_KEY'
      } else if (error.message.includes('空 choices')) {
        errorDetails = 'API 返回空响应，可能 API Key 无效或服务不可用'
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorDetails,
        debug: {
          errorMessage,
          suggestion: errorMessage.includes('GRSAI_API_KEY') 
            ? '请检查环境变量 GRSAI_API_KEY 是否已正确配置'
            : '查看服务器日志获取更多详细信息',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * 保存消息到数据库
 */
async function saveMessagesToDatabase(
  sessionId: string,
  adminUserId: string,
  messages: Array<{ role: string; content: string }>,
  assistantResponse: string,
  model: string,
  userImages: string[],
  taskType?: string
) {
  try {
    const supabase = await createServiceClient()

    // 保存用户消息
    const lastUserMessage = messages.find(m => m.role === 'user')
    if (lastUserMessage) {
      let userContent = ''
      if (typeof lastUserMessage.content === 'string') {
        userContent = lastUserMessage.content
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('admin_chat_messages') as any).insert({
        session_id: sessionId,
        role: 'user',
        content: userContent,
        images: userImages.length > 0 ? userImages : null,
        model: null,
      })
    }

    // 保存助手回复
    if (assistantResponse) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('admin_chat_messages') as any).insert({
        session_id: sessionId,
        role: 'assistant',
        content: assistantResponse,
        images: null,
        model,
      })
    }

    // 更新会话的 updated_at 和标题（如果是新会话，基于第一条消息生成标题）
    const { data: session } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('admin_chat_sessions') as any)
        .select('title')
        .eq('id', sessionId)
        .single()
    )

    if (session && !session.title) {
      // 生成标题（基于任务类型和第一条消息）
      let title = 'SEO 对话'
      if (taskType && taskType !== 'general') {
        const taskTypeNames: Record<string, string> = {
          'use-case': '使用场景生成',
          'keyword': '关键词页面生成',
          'blog': '博客文章生成',
          'compare': '对比页面生成',
          'industry': '行业页面生成',
        }
        title = taskTypeNames[taskType] || 'SEO 对话'
      } else if (lastUserMessage && typeof lastUserMessage.content === 'string') {
        const preview = lastUserMessage.content.substring(0, 50)
        title = preview || 'SEO 对话'
      }

      await (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('admin_chat_sessions') as any)
          .update({ 
            updated_at: new Date().toISOString(),
            title,
          })
          .eq('id', sessionId)
      )
    } else {
      await (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('admin_chat_sessions') as any)
          .update({ updated_at: new Date().toISOString() })
          .eq('id', sessionId)
      )
    }
  } catch (error) {
    console.error('保存 SEO 聊天消息失败:', error)
    // 不抛出错误，避免影响 API 响应
  }
}

/**
 * GET /api/admin/seo-chat/templates
 * 获取 SEO 模板列表
 */
export async function GET() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    // 返回 SEO 模板列表
    return NextResponse.json({
      success: true,
      data: SEO_CONTENT_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    })
  } catch (error) {
    console.error('获取 SEO 模板失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

