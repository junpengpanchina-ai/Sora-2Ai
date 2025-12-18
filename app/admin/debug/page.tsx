'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'

export default function AdminDebugPage() {
  const [dbTest, setDbTest] = useState<Record<string, unknown> | null>(null)
  const [apiTest, setApiTest] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/test-db-connection')
      const data = await response.json()
      setDbTest(data)
    } catch (error) {
      setDbTest({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const testUseCasesAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/test-use-cases-api')
      const data = await response.json()
      setApiTest(data)
    } catch (error) {
      setApiTest({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">管理员后台诊断工具</h1>

      <Card>
        <CardHeader>
          <CardTitle>数据库连接测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testDatabase} disabled={loading}>
            {loading ? '测试中...' : '测试数据库连接'}
          </Button>
          {dbTest && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(dbTest, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>使用场景 API 测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testUseCasesAPI} disabled={loading}>
            {loading ? '测试中...' : '测试使用场景 API'}
          </Button>
          {apiTest && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(apiTest, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>常见问题排查</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <h3 className="font-semibold mb-2">1. 检查浏览器控制台</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              按 F12 打开开发者工具，查看 Console 标签页是否有错误信息
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. 检查网络请求</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              在开发者工具的 Network 标签页中，查看 API 请求是否成功（状态码 200）
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. 检查环境变量</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              确保 .env.local 文件中配置了正确的 Supabase URL 和 Service Role Key
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">4. 检查数据库迁移</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              确保已运行数据库迁移：<code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">supabase db push</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

