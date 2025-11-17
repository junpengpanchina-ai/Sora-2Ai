'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button } from '@/components/ui'

interface AdminLoginFormProps {
  redirectPath?: string
  title?: string
  description?: string
}

export default function AdminLoginForm({
  redirectPath = '/admin',
  title = '管理员登录',
  description = '请输入管理员账号和密码',
}: AdminLoginFormProps) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(payload.error ?? '登录失败，请检查账号或密码')
        setSubmitting(false)
        return
      }

      setUsername('')
      setPassword('')
      router.push(redirectPath)
      router.refresh()
    } catch (err) {
      console.error('管理员登录失败:', err)
      setError('登录过程中出现问题，请稍后再试')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-energy-hero dark:bg-energy-hero-dark">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              用户名
            </label>
            <Input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="请输入管理员用户名"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              密码
            </label>
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入管理员密码"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || username.trim() === '' || password === ''}
          >
            {submitting ? '登录中...' : '登录'}
          </Button>
        </form>
      </div>
    </div>
  )
}


