'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'

interface AdminChatDebugProps {
  onShowBanner?: (type: 'success' | 'error', text: string) => void
}

interface DebugInfo {
  success?: boolean
  error?: string
  debug?: {
    checks?: {
      auth?: { success: boolean; adminId?: string }
      database?: {
        sessionsTable?: { exists: boolean; error?: string }
        messagesTable?: { exists: boolean; error?: string }
        userSessions?: { count: number }
      }
      geminiApi?: {
        apiKey?: { exists: boolean; length?: number }
        chatHost?: string
        testCall?: { success: boolean; status?: number; error?: string }
      }
      environment?: Record<string, boolean>
    }
  }
  summary?: Record<string, string>
}

interface TestResult {
  success?: boolean
  error?: string
  debug?: {
    steps?: Record<string, {
      success: boolean
      error?: string
      messageCount?: number
      [key: string]: unknown
    }>
  }
  summary?: Record<string, string>
}

export default function AdminChatDebug({ onShowBanner }: AdminChatDebugProps) {
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setDebugInfo(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/chat/debug')
      const data = await response.json()
      setDebugInfo(data)
      
      if (data.success) {
        onShowBanner?.('success', '诊断完成')
      } else {
        onShowBanner?.('error', data.error || '诊断失败')
      }
    } catch (error) {
      console.error('诊断失败:', error)
      onShowBanner?.('error', '诊断请求失败')
    } finally {
      setLoading(false)
    }
  }

  const runTest = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/chat/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testMessage: 'Hello, this is a test message from debug tool',
        }),
      })
      const data = await response.json()
      setTestResult(data)
      
      if (data.success) {
        onShowBanner?.('success', '测试完成')
      } else {
        onShowBanner?.('error', data.error || '测试失败')
      }
    } catch (error) {
      console.error('测试失败:', error)
      onShowBanner?.('error', '测试请求失败')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    onShowBanner?.('success', '已复制到剪贴板')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">聊天功能调试工具</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          检查聊天功能的各个环节是否正常工作
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={runDiagnostics} disabled={loading}>
          {loading ? '检查中...' : '🔍 运行诊断'}
        </Button>
        <Button onClick={runTest} disabled={loading} variant="outline">
          {loading ? '测试中...' : '🧪 运行测试'}
        </Button>
      </div>

      {/* 诊断结果 */}
      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>诊断结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 摘要 */}
              {debugInfo.summary && (
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <h3 className="mb-2 font-semibold">检查摘要</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>认证: {debugInfo.summary.auth}</div>
                    <div>数据库: {debugInfo.summary.database}</div>
                    <div>Gemini API: {debugInfo.summary.geminiApi}</div>
                    <div>环境变量: {debugInfo.summary.environment}</div>
                  </div>
                </div>
              )}

              {/* 详细检查结果 */}
              {debugInfo.debug?.checks && (
                <div className="space-y-3">
                  <h3 className="font-semibold">详细检查</h3>
                  
                  {/* 认证检查 */}
                  {debugInfo.debug.checks.auth && (
                    <div className="rounded border p-3">
                      <div className="mb-1 font-medium">1. 管理员认证</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {debugInfo.debug.checks.auth.success ? (
                          <span className="text-green-600">✅ 成功 - 管理员ID: {debugInfo.debug.checks.auth.adminId}</span>
                        ) : (
                          <span className="text-red-600">❌ 失败 - 未授权</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 数据库检查 */}
                  {debugInfo.debug.checks.database && (
                    <div className="rounded border p-3">
                      <div className="mb-1 font-medium">2. 数据库连接</div>
                      <div className="space-y-1 text-sm">
                        <div>
                          会话表: {debugInfo.debug.checks.database.sessionsTable?.exists ? (
                            <span className="text-green-600">✅ 存在</span>
                          ) : (
                            <span className="text-red-600">❌ 不存在 - {debugInfo.debug.checks.database.sessionsTable?.error}</span>
                          )}
                        </div>
                        <div>
                          消息表: {debugInfo.debug.checks.database.messagesTable?.exists ? (
                            <span className="text-green-600">✅ 存在</span>
                          ) : (
                            <span className="text-red-600">❌ 不存在 - {debugInfo.debug.checks.database.messagesTable?.error}</span>
                          )}
                        </div>
                        {debugInfo.debug.checks.database.userSessions && (
                          <div>
                            你的会话数: {debugInfo.debug.checks.database.userSessions.count} 个
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Gemini API 检查 */}
                  {debugInfo.debug.checks.geminiApi && (
                    <div className="rounded border p-3">
                      <div className="mb-1 font-medium">3. Gemini API 配置</div>
                      <div className="space-y-1 text-sm">
                        <div>
                          API Key: {debugInfo.debug.checks.geminiApi.apiKey?.exists ? (
                            <span className="text-green-600">✅ 已配置 (长度: {debugInfo.debug.checks.geminiApi.apiKey?.length})</span>
                          ) : (
                            <span className="text-red-600">❌ 未配置</span>
                          )}
                        </div>
                        <div>Chat Host: {debugInfo.debug.checks.geminiApi.chatHost}</div>
                        {debugInfo.debug.checks.geminiApi.testCall && (
                          <div>
                            连接测试: {debugInfo.debug.checks.geminiApi.testCall.success ? (
                              <span className="text-green-600">✅ 成功 (状态: {debugInfo.debug.checks.geminiApi.testCall.status})</span>
                            ) : (
                              <span className="text-red-600">❌ 失败 - {debugInfo.debug.checks.geminiApi.testCall.error}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 环境变量检查 */}
                  {debugInfo.debug.checks.environment && (
                    <div className="rounded border p-3">
                      <div className="mb-1 font-medium">4. 环境变量</div>
                      <div className="space-y-1 text-sm">
                        {Object.entries(debugInfo.debug.checks.environment).map(([key, value]) => (
                          <div key={key}>
                            {key}: {value ? (
                              <span className="text-green-600">✅ 已设置</span>
                            ) : (
                              <span className="text-red-600">❌ 未设置</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 复制完整 JSON */}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(debugInfo, null, 2))}
                >
                  📋 复制完整诊断信息
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 测试结果 */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 测试摘要 */}
              {testResult.summary && (
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <h3 className="mb-2 font-semibold">测试摘要</h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>创建会话: {testResult.summary.createSession}</div>
                    <div>聊天 API: {testResult.summary.chatApi}</div>
                    <div>保存消息: {testResult.summary.saveMessages}</div>
                  </div>
                </div>
              )}

              {/* 详细步骤 */}
              {testResult.debug?.steps && (
                <div className="space-y-3">
                  <h3 className="font-semibold">测试步骤</h3>
                  
                  {Object.entries(testResult.debug.steps).map(([step, data]) => {
                    const stepData = data as {
                      success: boolean
                      error?: string
                      messageCount?: number
                      [key: string]: unknown
                    }
                    return (
                      <div key={step} className="rounded border p-3">
                        <div className="mb-1 font-medium">
                          {step === 'createSession' && '步骤 1: 创建会话'}
                          {step === 'chatApi' && '步骤 2: 调用聊天 API'}
                          {step === 'saveMessages' && '步骤 3: 保存消息'}
                        </div>
                        <div className="text-sm">
                          {stepData.success ? (
                            <span className="text-green-600">✅ 成功</span>
                          ) : (
                            <span className="text-red-600">❌ 失败 - {stepData.error}</span>
                          )}
                          {stepData.messageCount !== undefined && (
                            <div className="mt-1 text-gray-600 dark:text-gray-400">
                              消息数量: {stepData.messageCount}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 复制完整 JSON */}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(testResult, null, 2))}
                >
                  📋 复制完整测试信息
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Console 调试代码 */}
      <Card>
        <CardHeader>
          <CardTitle>浏览器 Console 调试代码</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              在浏览器 Console 中运行以下代码来调试聊天功能：
            </p>
            
            <div className="rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              <pre className="whitespace-pre-wrap">
{`// 1. 检查当前会话
async function checkSessions() {
  const res = await fetch('/api/admin/chat/sessions');
  const data = await res.json();
  console.log('会话列表:', data);
  return data;
}

// 2. 测试发送消息
async function testSendMessage(sessionId) {
  const res = await fetch('/api/admin/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId || null,
      message: '测试消息',
      stream: false,
      saveHistory: true,
    }),
  });
  const data = await res.json();
  console.log('发送消息结果:', data);
  return data;
}

// 3. 运行完整诊断
async function runDiagnostics() {
  const res = await fetch('/api/admin/chat/debug');
  const data = await res.json();
  console.log('诊断结果:', data);
  return data;
}

// 4. 运行完整测试
async function runTest() {
  const res = await fetch('/api/admin/chat/debug', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testMessage: '测试消息' }),
  });
  const data = await res.json();
  console.log('测试结果:', data);
  return data;
}

// 使用示例：
// checkSessions();
// testSendMessage('your-session-id');
// runDiagnostics();
// runTest();`}
              </pre>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(`// 1. 检查当前会话
async function checkSessions() {
  const res = await fetch('/api/admin/chat/sessions');
  const data = await res.json();
  console.log('会话列表:', data);
  return data;
}

// 2. 测试发送消息
async function testSendMessage(sessionId) {
  const res = await fetch('/api/admin/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId || null,
      message: '测试消息',
      stream: false,
      saveHistory: true,
    }),
  });
  const data = await res.json();
  console.log('发送消息结果:', data);
  return data;
}

// 3. 运行完整诊断
async function runDiagnostics() {
  const res = await fetch('/api/admin/chat/debug');
  const data = await res.json();
  console.log('诊断结果:', data);
  return data;
}

// 4. 运行完整测试
async function runTest() {
  const res = await fetch('/api/admin/chat/debug', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testMessage: '测试消息' }),
  });
  const data = await res.json();
  console.log('测试结果:', data);
  return data;
}

// 使用示例：
// checkSessions();
// testSendMessage('your-session-id');
// runDiagnostics();
// runTest();`)}
            >
              📋 复制 Console 代码
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

