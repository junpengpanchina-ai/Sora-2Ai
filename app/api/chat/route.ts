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
    const response = await createChatCompletion(chatParams)
    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error('GRSAI Chat API 错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('错误堆栈:', errorStack)
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}

