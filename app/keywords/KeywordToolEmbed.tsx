'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Textarea } from '@/components/ui'

interface KeywordToolEmbedProps {
  defaultPrompt?: string
}

export default function KeywordToolEmbed({ defaultPrompt }: KeywordToolEmbedProps) {
  const router = useRouter()
  const [prompt, setPrompt] = useState(defaultPrompt ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!prompt.trim()) {
      setError('请输入视频生成提示词')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const encoded = encodeURIComponent(prompt.trim())
      router.push(`/video?prompt=${encoded}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-energy-water/30 bg-white/80 p-6 shadow-lg backdrop-blur dark:border-energy-water/40 dark:bg-gray-900/70"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">立即试用视频生成器</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        输入描述，点击“开始生成”后我们会把提示词带入 /video 页面，登录后即可直接生成。
      </p>
      <Textarea
        rows={4}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="例如：10 秒 9:16 竖屏，未来感城市夜景航拍，镜头快速拉近，霓虹光效..."
        className="mt-4"
        required
      />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? '跳转中...' : '开始生成'}
        </Button>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          * 如未登录，会先提示你登录账号。登录后表单会自动填入刚才的提示词。
        </p>
      </div>
    </form>
  )
}


