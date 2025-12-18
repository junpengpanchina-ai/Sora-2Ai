'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Textarea } from '@/components/ui'

interface UseCaseToolEmbedProps {
  defaultPrompt?: string
  useCaseTitle?: string
}

export default function UseCaseToolEmbed({ defaultPrompt = '', useCaseTitle = '' }: UseCaseToolEmbedProps) {
  const router = useRouter()
  const [prompt, setPrompt] = useState(defaultPrompt ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!prompt.trim()) {
      setError('Please enter a video generation prompt')
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
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Try Video Generator Now</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Enter a description, click &quot;Start Generation&quot; and we will take the prompt to the /video page, where you can generate directly after logging in.
      </p>
      <Textarea
        rows={4}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder={useCaseTitle || 'e.g., 10-second 9:16 vertical video, futuristic city nightscape aerial view, camera zooming in quickly, neon light effects...'}
        className="mt-4"
        required
      />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={submitting} className="bg-energy-water hover:bg-energy-water-deep">
          {submitting ? 'Redirecting...' : 'Start Generation'}
        </Button>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          * If not logged in, you will be prompted to log in first. After logging in, the form will automatically fill in the prompt you just entered.
        </p>
      </div>
    </form>
  )
}
