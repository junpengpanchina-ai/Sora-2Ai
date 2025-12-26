import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import {
  createChatCompletion,
  createChatCompletionStream,
  type ChatCompletionRequest,
} from '@/lib/grsai/client'
import { selectModel } from '@/lib/admin-chat/model-selector'
import { createServiceClient } from '@/lib/supabase/service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/admin/chat
 * 管理员聊天 API，支持多图片、智能模型选择、历史记录保存
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    // 检查 API Key 配置（提前检查，避免浪费资源）
    const apiKey = process.env.GRSAI_API_KEY
    if (!apiKey) {
      console.error('[Admin Chat] GRSAI_API_KEY 未配置')
      return NextResponse.json({
        success: false,
        error: 'API Key 未配置',
        debug: {
          suggestion: '请检查环境变量 GRSAI_API_KEY 是否已设置',
        },
      }, { status: 500 })
    }

    const body = await request.json()
    const {
      sessionId,
      message,
      images = [],
      model: requestedModel,
      stream = true,
      saveHistory = true,
    } = body

    // 参数验证
    if (!message && (!images || images.length === 0)) {
      return NextResponse.json(
        { success: false, error: '消息内容或图片至少需要提供一个' },
        { status: 400 }
      )
    }

    // 智能模型选择（如果用户没有指定模型）
    let selectedModel = requestedModel
    if (!selectedModel) {
      selectedModel = selectModel(message || '', images)
    }

    // 构建消息内容
    // 注意：Gemini API 可能不支持多模态消息格式，如果图片存在，我们将图片转换为 base64 并附加到文本中
    const messages: Array<{
      role: 'system' | 'user' | 'assistant'
      content: string
    }> = []

    // 构建用户消息内容
    let userContent = message || ''
    
    // 如果有图片，将图片信息添加到文本中（作为描述）
    // 注意：如果 Gemini API 支持多模态，可以在这里修改格式
    if (images && images.length > 0) {
      if (userContent) {
        userContent += `\n\n[包含 ${images.length} 张图片]`
      } else {
        userContent = `[包含 ${images.length} 张图片，请分析这些图片]`
      }
      // 将图片 base64 数据附加到消息中（如果 API 支持）
      // 这里我们暂时将图片信息作为文本描述，实际使用时需要根据 API 文档调整
      console.log(`[Admin Chat] 用户上传了 ${images.length} 张图片`)
    }
    
    messages.push({ role: 'user', content: userContent })

    // 如果有 sessionId，加载历史消息
    let historyMessages: Array<{ role: string; content: string | null; images: unknown }> = []
    if (sessionId && saveHistory) {
      const supabase = await createServiceClient()
      const { data: loadedHistory, error: historyError } = await (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase.from('admin_chat_messages') as any
      )
        .select('role, content, images')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (!historyError && loadedHistory && loadedHistory.length > 0) {
        historyMessages = loadedHistory as Array<{ role: string; content: string | null; images: unknown }>
        // 将历史消息转换为 API 格式
        const formattedHistory: Array<{
          role: 'system' | 'user' | 'assistant'
          content: string
        }> = []

        for (const msg of historyMessages) {
          let content = (msg.content || '') as string
          
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

        // 将历史消息插入到当前消息之前
        messages.unshift(...formattedHistory)
      }
    }

    // 构建 API 请求参数
    const chatParams: ChatCompletionRequest = {
      model: selectedModel,
      stream,
      messages,
    }
    
    // 如果使用 gemini-3-flash 或 gemini-3-pro，启用联网搜索（用于成本对比、价格分析等）
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
              await saveMessagesToDatabase(sessionId, adminUser.id, messages, fullResponse, selectedModel, images)
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

    // 非流式响应
    const response = await createChatCompletion(chatParams)
    
    // 检查响应是否有效
    if (!response.choices || response.choices.length === 0) {
      // 记录详细的诊断信息
      const apiKey = process.env.GRSAI_API_KEY
      const apiKeyPrefix = apiKey ? apiKey.substring(0, 10) + '...' : '未配置'
      const chatHost = process.env.GRSAI_CHAT_HOST || 'https://api.grsai.com'
      
      console.error('[Admin Chat] ⚠️⚠️⚠️ API 返回空 choices 数组！', {
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
          messageLength: message?.length || 0,
          imagesCount: images?.length || 0,
          hasHistory: historyMessages.length > 0,
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
      console.error('[Admin Chat] API 返回空 content！完整响应:', JSON.stringify(response, null, 2))
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
            fullResponse: response,
          },
        },
      }, { status: 500 })
    }

    const assistantContent = response.choices[0].message.content

    // 保存消息到数据库
    if (saveHistory && sessionId) {
      await saveMessagesToDatabase(sessionId, adminUser.id, messages, assistantContent, selectedModel, images)
    }

    return NextResponse.json({
      success: true,
      data: response,
      model: selectedModel,
    })
  } catch (error) {
    console.error('Admin Chat API 错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    
    // 提供更详细的错误信息用于调试
    const errorDetails: Record<string, unknown> = {
      message: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    }
    
    // 如果是 Gemini API 相关错误，添加更多信息
    if (errorMessage.includes('choices') || errorMessage.includes('API')) {
      errorDetails.isApiError = true
      errorDetails.suggestion = '请检查 GRSAI_API_KEY 是否正确配置，以及 API 服务是否可用'
    }
    
    // 如果是数据库相关错误
    if (errorMessage.includes('database') || errorMessage.includes('table') || errorMessage.includes('relation')) {
      errorDetails.isDatabaseError = true
      errorDetails.suggestion = '请检查数据库迁移是否已运行（041_create_admin_chat_history.sql）'
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        debug: errorDetails,
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
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string }> }>,
  assistantResponse: string,
  model: string,
  userImages: string[]
) {
  try {
    const supabase = await createServiceClient()

    // 保存用户消息
    const lastUserMessage = messages[messages.length - 1]
    if (lastUserMessage && lastUserMessage.role === 'user') {
      let userContent = ''
      if (typeof lastUserMessage.content === 'string') {
        userContent = lastUserMessage.content
      } else if (Array.isArray(lastUserMessage.content)) {
        const textPart = lastUserMessage.content.find((p) => p.type === 'text')
        userContent = textPart?.text || ''
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

    // 更新会话的 updated_at
    await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('admin_chat_sessions') as any)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId)
    )
  } catch (error) {
    console.error('保存聊天消息失败:', error)
    // 不抛出错误，避免影响 API 响应
  }
}

/**
 * GET /api/admin/chat/sessions
 * 获取聊天会话列表
 */
export async function GET() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    const { data: sessions, error } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('admin_chat_sessions') as any)
        .select('*')
        .eq('admin_user_id', adminUser.id)
        .order('updated_at', { ascending: false })
        .limit(50)
    )

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: sessions })
  } catch (error) {
    console.error('获取聊天会话失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

