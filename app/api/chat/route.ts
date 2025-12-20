import { NextRequest, NextResponse } from 'next/server'
import {
  createChatCompletion,
  createChatCompletionStream,
  type ChatCompletionRequest,
} from '@/lib/grsai/client'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/chat
 * 调用 GRSAI Chat API（公开接口，用于文案生成）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, stream, messages, ...otherParams } = body as ChatCompletionRequest

    // 参数验证
    if (!model) {
      return NextResponse.json({ success: false, error: '缺少 model 参数' }, { status: 400 })
    }

    if (typeof stream !== 'boolean') {
      return NextResponse.json({ success: false, error: '缺少 stream 参数' }, { status: 400 })
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: '缺少 messages 参数或为空' }, { status: 400 })
    }

    // 检查 API Key 是否配置
    if (!process.env.GRSAI_API_KEY) {
      console.error('[Chat API] GRSAI_API_KEY 未配置')
      return NextResponse.json(
        { 
          success: false, 
          error: 'API Key 未配置',
          details: '请检查环境变量 GRSAI_API_KEY 是否已设置'
        },
        { status: 500 }
      )
    }

    // 检查请求体大小（避免请求过大）
    const requestBodySize = JSON.stringify({ model, stream, messages, ...otherParams }).length
    if (requestBodySize > 100000) { // 100KB
      console.warn('[Chat API] 请求体过大:', {
        size: requestBodySize,
        model,
        messagesCount: messages.length,
      })
    }

    // 构建请求参数
    const chatParams: ChatCompletionRequest = {
      model,
      stream,
      messages,
      ...otherParams,
    }

    // 如果是流式响应
    if (stream) {
      const encoder = new TextEncoder()
      const responseStream = new ReadableStream({
        async start(controller) {
          try {
            const chatStream = createChatCompletionStream(chatParams)
            for await (const chunk of chatStream) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`
              controller.enqueue(encoder.encode(data))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
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
    const systemMessage = messages.find(m => m.role === 'system')
    const userMessage = messages.find(m => m.role === 'user')
    console.log('[Chat API] 调用 createChatCompletion:', {
      model: chatParams.model,
      stream: chatParams.stream,
      messagesCount: chatParams.messages.length,
      totalPromptLength: messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0),
      systemPromptPreview: systemMessage?.content?.substring(0, 200) || 'N/A',
      userPromptPreview: userMessage?.content?.substring(0, 200) || 'N/A',
      hasApiKey: !!process.env.GRSAI_API_KEY,
    })
    
    try {
      const response = await createChatCompletion(chatParams)
      console.log('[Chat API] 调用成功:', {
        model: chatParams.model,
        hasChoices: !!response.choices,
        choicesCount: response.choices?.length || 0,
      })
      
      return NextResponse.json({ success: true, data: response })
    } catch (apiError) {
      // 捕获 createChatCompletion 的错误，提供更详细的日志
      console.error('[Chat API] createChatCompletion 调用失败:', {
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
        model: chatParams.model,
        messagesCount: chatParams.messages.length,
      })
      // 重新抛出错误，让外层 catch 处理
      throw apiError
    }
  } catch (error) {
    console.error('[Chat API] GRSAI Chat API 错误:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // 提供更详细的错误信息
    let errorDetails = errorMessage
    if (error instanceof Error) {
      if (error.message.includes('GRSAI_API_KEY')) {
        errorDetails = 'API Key 未配置或无效，请检查环境变量 GRSAI_API_KEY'
      } else if (error.message.includes('超时')) {
        errorDetails = 'API 请求超时，请稍后重试'
      } else if (error.message.includes('连接失败')) {
        errorDetails = '无法连接到 API 服务，请检查网络连接'
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorDetails,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}

