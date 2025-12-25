import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { getGrsaiChatHost } from '@/lib/grsai/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/chat/debug
 * 调试聊天功能，检查各个环节是否正常
 */
interface DebugChecks {
  auth?: { success: boolean; adminId?: string | null; username?: string | null }
  database?: {
    success?: boolean
    error?: string
    sessionsTable?: { exists: boolean; error?: string | null; sampleCount?: number }
    messagesTable?: { exists: boolean; error?: string | null; sampleCount?: number }
    userSessions?: { success: boolean; count: number; sessions?: unknown[]; error?: string | null }
  }
  geminiApi?: {
    success?: boolean
    error?: string
    apiKey?: { exists: boolean; length?: number; prefix?: string | null }
    chatHost?: string
    envVars?: Record<string, boolean>
    testCall?: { success: boolean; status?: number; statusText?: string; canConnect?: boolean; isTimeout?: boolean; error?: string }
  }
  environment?: Record<string, boolean | string>
  recentErrors?: {
    note?: string
  }
}

export async function GET() {
  const debugInfo: {
    timestamp: string
    checks: DebugChecks
    success?: boolean
    error?: string | { message: string; stack?: string }
    summary?: Record<string, string>
  } = {
    timestamp: new Date().toISOString(),
    checks: {},
  }

  try {
    // 1. 检查管理员认证
    const adminUser = await validateAdminSession()
    debugInfo.checks.auth = {
      success: !!adminUser,
      adminId: adminUser?.id || null,
      username: adminUser?.username || null,
    }

    if (!adminUser) {
      return NextResponse.json({
        success: false,
        error: '未授权',
        debug: debugInfo,
      })
    }

    // 2. 检查数据库连接和表是否存在
    try {
      const supabase = await createSupabaseClient()
      
      // 检查 admin_chat_sessions 表
      const { data: sessions, error: sessionsError } = await (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('admin_chat_sessions') as any)
          .select('id')
          .limit(1)
      )

      debugInfo.checks.database = {
        success: !sessionsError,
        sessionsTable: {
          exists: !sessionsError,
          error: sessionsError?.message || null,
          sampleCount: sessions?.length || 0,
        },
      }

      // 检查 admin_chat_messages 表
      const { data: messages, error: messagesError } = await (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('admin_chat_messages') as any)
          .select('id')
          .limit(1)
      )

      debugInfo.checks.database.messagesTable = {
        exists: !messagesError,
        error: messagesError?.message || null,
        sampleCount: messages?.length || 0,
      }

      // 检查当前管理员的会话数量
      const { data: userSessions, error: userSessionsError } = await (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('admin_chat_sessions') as any)
          .select('id, title, created_at')
          .eq('admin_user_id', adminUser.id)
          .order('created_at', { ascending: false })
          .limit(5)
      )

      debugInfo.checks.database.userSessions = {
        success: !userSessionsError,
        count: userSessions?.length || 0,
        sessions: userSessions || [],
        error: userSessionsError?.message || null,
      }
    } catch (dbError) {
      debugInfo.checks.database = {
        success: false,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      }
    }

    // 3. 检查 Gemini API 配置
    try {
      const apiKey = process.env.GRSAI_API_KEY
      const chatHost = getGrsaiChatHost()

      debugInfo.checks.geminiApi = {
        apiKey: {
          exists: !!apiKey,
          length: apiKey?.length || 0,
          prefix: apiKey ? apiKey.substring(0, 10) + '...' : null,
        },
        chatHost: chatHost,
        envVars: {
          GRSAI_API_KEY: !!process.env.GRSAI_API_KEY,
          GRSAI_HOST: !!process.env.GRSAI_HOST,
        },
      }

      // 尝试一个简单的 API 调用测试
      if (apiKey) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          
          const testResponse = await fetch(`${chatHost}/v1/models`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          debugInfo.checks.geminiApi.testCall = {
            success: testResponse.ok,
            status: testResponse.status,
            statusText: testResponse.statusText,
            canConnect: testResponse.ok || testResponse.status !== 0,
          }
        } catch (testError) {
          debugInfo.checks.geminiApi.testCall = {
            success: false,
            error: testError instanceof Error ? testError.message : String(testError),
            isTimeout: testError instanceof Error && testError.name === 'AbortError',
          }
        }
      } else {
        debugInfo.checks.geminiApi.testCall = {
          success: false,
          error: 'API Key 未配置，无法测试连接',
        }
      }
    } catch (apiError) {
      debugInfo.checks.geminiApi = {
        success: false,
        error: apiError instanceof Error ? apiError.message : String(apiError),
      }
    }

    // 4. 检查环境变量
    debugInfo.checks.environment = {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasGrsaiApiKey: !!process.env.GRSAI_API_KEY,
    }

    // 5. 检查最近的错误日志（如果有的话）
    debugInfo.checks.recentErrors = {
      note: '检查服务器日志以获取最近的错误信息',
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      summary: {
        auth: debugInfo.checks.auth?.success ? '✅' : '❌',
        database: debugInfo.checks.database?.success ? '✅' : '❌',
        geminiApi: debugInfo.checks.geminiApi?.apiKey?.exists ? '✅' : '❌',
        environment: Object.values(debugInfo.checks.environment || {}).every(v => v) ? '✅' : '⚠️',
      },
    })
  } catch (error) {
    debugInfo.error = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }

    return NextResponse.json({
      success: false,
      error: '调试检查失败',
      debug: debugInfo,
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/chat/debug
 * 测试聊天 API 调用
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { testMessage = 'Hello, this is a test message' } = body

    interface TestSteps {
      createSession?: { success: boolean; sessionId?: string | null; error?: string | null }
      chatApi?: { success: boolean; status?: number; hasResponse?: boolean; responseKeys?: string[]; error?: string | null; model?: string | null }
      saveMessages?: { success: boolean; messageCount?: number; messages?: unknown[]; error?: string | null }
    }

    const debugInfo: {
      timestamp: string
      testMessage: string
      steps: TestSteps
      error?: string | { message: string; stack?: string }
    } = {
      timestamp: new Date().toISOString(),
      testMessage,
      steps: {},
    }

    // 步骤1: 创建会话
    try {
      const supabase = await createSupabaseClient()
      const { data: session, error: sessionError } = await (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('admin_chat_sessions') as any)
          .insert({
            admin_user_id: adminUser.id,
            title: '调试测试会话',
          })
          .select()
          .single()
      )

      debugInfo.steps.createSession = {
        success: !sessionError,
        sessionId: session?.id || null,
        error: sessionError?.message || null,
      }

      if (sessionError || !session) {
        return NextResponse.json({
          success: false,
          error: '创建会话失败',
          debug: debugInfo,
        })
      }

      // 步骤2: 调用聊天 API
      try {
        const chatResponse = await fetch(`${request.nextUrl.origin}/api/admin/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            sessionId: session.id,
            message: testMessage,
            stream: false,
            saveHistory: true,
          }),
        })

        let chatData
        try {
          chatData = await chatResponse.json()
        } catch (jsonError) {
          const text = await chatResponse.text()
          chatData = {
            success: false,
            error: `JSON 解析失败: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
            rawResponse: text.substring(0, 500),
            status: chatResponse.status,
            statusText: chatResponse.statusText,
          }
        }

        debugInfo.steps.chatApi = {
          success: chatResponse.ok,
          status: chatResponse.status,
          hasResponse: !!chatData,
          responseKeys: chatData ? Object.keys(chatData) : [],
          error: chatData?.error || null,
          model: chatData?.model || null,
        }

        // 步骤3: 检查消息是否保存
        if (chatResponse.ok && session.id) {
          const { data: savedMessages, error: messagesError } = await (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase.from('admin_chat_messages') as any)
              .select('*')
              .eq('session_id', session.id)
              .order('created_at', { ascending: true })
          )

          debugInfo.steps.saveMessages = {
            success: !messagesError,
            messageCount: savedMessages?.length || 0,
            messages: savedMessages || [],
            error: messagesError?.message || null,
          }
        }

        // 清理测试会话
        await (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from('admin_chat_sessions') as any)
            .delete()
            .eq('id', session.id)
        )

        return NextResponse.json({
          success: chatResponse.ok,
          debug: debugInfo,
          summary: {
            createSession: debugInfo.steps.createSession?.success ? '✅' : '❌',
            chatApi: debugInfo.steps.chatApi?.success ? '✅' : '❌',
            saveMessages: debugInfo.steps.saveMessages?.success ? '✅' : '❌',
          },
        })
      } catch (chatError) {
        debugInfo.steps.chatApi = {
          success: false,
          error: chatError instanceof Error ? chatError.message : String(chatError),
        }

        return NextResponse.json({
          success: false,
          error: '聊天 API 调用失败',
          debug: debugInfo,
        })
      }
    } catch (error) {
      debugInfo.error = {
        message: error instanceof Error ? error.message : String(error),
      }

      return NextResponse.json({
        success: false,
        error: '测试失败',
        debug: debugInfo,
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 })
  }
}

