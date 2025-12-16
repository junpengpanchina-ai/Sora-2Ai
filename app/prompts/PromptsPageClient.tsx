'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { PromptCategory, PromptDifficulty } from '@/lib/prompts/schema'

type PromptCategoryFilter = 'all' | PromptCategory

interface Prompt {
  id: string
  title: string
  description: string | null
  prompt: string
  category: PromptCategory
  tags: string[]
  difficulty: PromptDifficulty
  example: string | null
  locale: string
  is_published: boolean
  created_at: string
  updated_at: string
  created_by_admin_id?: string | null
  slug?: string | null
}

// Recommended practice books
const recommendedBooks = [
  {
    title: 'Prompt Engineering: From Beginner to Master',
    description: 'Systematically covers the three principles of prompt engineering—clarity, structure, and context control—with over 200 case studies on designing effective prompts',
    level: 'For Beginners',
  },
  {
    title: 'DeepSeek Prompt Practice Guide',
    description: 'Focuses on DeepSeek\'s unique features, providing over 50 real-world scenarios to help master prompt design techniques',
    level: 'For Advanced Learning',
  },
  {
    title: 'ChatGPT Practice Methodology: The Adventure of Prompts',
    description: 'Deep dive into using ChatGPT to improve work efficiency, learn applications in different scenarios, and master prompt usage principles and methods',
    level: 'For All Professionals',
  },
  {
    title: 'AI Prompt Practice Guide',
    description: 'Starts from basics, analyzes common mistakes, shares tips and application scenarios, and connects knowledge points through practical cases',
    level: 'Comprehensive Learning',
  },
  {
    title: 'Animatediff Video Prompt Writing Techniques and Practice',
    description: 'In-depth exploration of Animatediff video prompt writing essentials, helping understand and master effective prompt writing',
    level: 'Professional Video Generation',
  },
  {
    title: 'Complete Vidu Video Prompt Writing Tutorial: From Beginner to Master',
    description: 'Detailed introduction to Vidu prompt composition, writing techniques, applications in different scenarios, and common issues with solutions',
    level: 'Vidu Platform Specialized',
  },
]

export default function PromptsPageClient() {
  const router = useRouter()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedCategory, setSelectedCategory] = useState<PromptCategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrompts = useCallback(
    async (options?: { signal?: AbortSignal; silent?: boolean }) => {
      const { signal, silent } = options ?? {}
      if (!silent) {
        setLoading(true)
      }
      setError(null)
      try {
        const response = await fetch('/api/prompts?locale=en', { signal })
        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          const message =
            typeof payload.error === 'string'
              ? payload.error
              : 'Failed to load prompts. Please try again later.'
          throw new Error(message)
        }

        const items = Array.isArray(payload.prompts) ? payload.prompts : []
        const normalized: Prompt[] = items.map((item: unknown) => {
          const promptItem = item as Record<string, unknown>
          return {
            id: String(promptItem.id ?? ''),
            title: String(promptItem.title ?? ''),
            description: promptItem.description ? String(promptItem.description) : null,
            prompt: String(promptItem.prompt ?? ''),
            category: promptItem.category as Prompt['category'],
            tags: Array.isArray(promptItem.tags) ? (promptItem.tags as string[]) : [],
            difficulty: promptItem.difficulty as Prompt['difficulty'],
            example: promptItem.example ? String(promptItem.example) : null,
            locale: String(promptItem.locale ?? 'zh') as Prompt['locale'],
            is_published: Boolean(promptItem.is_published ?? true),
            created_at: String(promptItem.created_at ?? new Date().toISOString()),
            updated_at: String(promptItem.updated_at ?? new Date().toISOString()),
            created_by_admin_id: promptItem.created_by_admin_id ? String(promptItem.created_by_admin_id) : null,
          }
        })

        setPrompts(normalized)
        setSelectedPrompt((prev) => {
          if (!normalized.length) {
            return null
          }
          if (!prev) {
            return normalized[0]
          }
          return normalized.find((item) => item.id === prev.id) ?? normalized[0]
        })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        console.error('Failed to load prompts:', err)
        setError(err instanceof Error ? err.message : 'Failed to load prompts. Please try again later.')
        setPrompts([])
        setSelectedPrompt(null)
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchPrompts({ signal: controller.signal })
    return () => {
      controller.abort()
    }
  }, [fetchPrompts])

  useEffect(() => {
    if (selectedPrompt && !prompts.some((prompt) => prompt.id === selectedPrompt.id)) {
      setSelectedPrompt(prompts[0] ?? null)
    }
  }, [prompts, selectedPrompt])

  // Filter prompts
  const filteredPrompts = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase()

    return prompts.filter((prompt) => {
      const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory
      const matchesSearch =
        trimmedQuery === '' ||
        prompt.title.toLowerCase().includes(trimmedQuery) ||
        (prompt.description ?? '').toLowerCase().includes(trimmedQuery) ||
        prompt.tags.some((tag) => tag.toLowerCase().includes(trimmedQuery)) ||
        prompt.prompt.toLowerCase().includes(trimmedQuery)
      return matchesCategory && matchesSearch
    })
  }, [prompts, selectedCategory, searchQuery])

  // Use prompt to generate video
  const handleUsePrompt = (prompt: Prompt) => {
    router.push(`/video?prompt=${encodeURIComponent(prompt.prompt)}`)
  }

  // Copy prompt
  const handleCopyPrompt = async (promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText)
      alert('Prompt copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy prompt:', error)
      alert('Copy failed. Please copy it manually.')
    }
  }

  const categories: { value: PromptCategoryFilter; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '📚' },
    { value: 'nature', label: 'Nature', icon: '🌲' },
    { value: 'character', label: 'Character', icon: '👤' },
    { value: 'action', label: 'Action', icon: '⚡' },
    { value: 'scenery', label: 'Scenery', icon: '🏞️' },
    { value: 'abstract', label: 'Abstract', icon: '🎨' },
    { value: 'cinematic', label: 'Cinematic', icon: '🎬' },
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'information':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'comparison':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'transaction':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'information':
        return '信息型'
      case 'comparison':
        return '对比型'
      case 'transaction':
        return '交易型'
      default:
        return difficulty
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050b18] text-white">
      <div className="cosmic-space absolute inset-0" aria-hidden="true" />
      <div className="cosmic-glow absolute inset-0" aria-hidden="true" />
      <div className="cosmic-stars absolute inset-0" aria-hidden="true" />
      <div className="cosmic-noise absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 cosmic-content">
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-white">
                Sora2Ai Videos
              </Link>
              <Link
                href="/video"
                className="text-sm font-medium text-blue-100 transition-colors hover:text-white"
              >
                Video Generation
              </Link>
              <Link
                href="/prompts"
                className="text-sm font-medium text-energy-water"
              >
                Prompt Library
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">
            Video Prompt Library
          </h1>
          <p className="text-lg text-blue-100/80">
            Explore curated AI video generation prompts to quickly create high-quality video content
          </p>
        </div>

        {/* Search and Categories */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-blue-100/80">
              Search Prompts
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, tags, or prompt content..."
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-blue-100/50 shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-blue-100/80">
              Category Filter
            </label>
            <div className="flex flex-wrap gap-2" style={{ position: 'relative', zIndex: 1 }}>
              {categories.map((category) => {
                const isSelected = selectedCategory === category.value
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setSelectedCategory(category.value)}
                    style={{ 
                      position: 'relative',
                      zIndex: 10,
                      pointerEvents: 'auto',
                      cursor: 'pointer'
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-energy-water text-white shadow-lg hover:bg-energy-water-deep'
                        : 'bg-white/10 text-blue-100 hover:bg-white/20'
                    }`}
                  >
                    {category.icon} {category.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Prompt List */}
          <div className="lg:col-span-2">
            <Card className="border border-white/10 bg-white/5 text-white shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">
                  Prompt Library ({filteredPrompts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-blue-100/70">
                    <div className="mr-3 h-6 w-6 animate-spin rounded-full border-b-2 border-energy-water"></div>
                    Loading prompts...
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <p className="text-sm text-red-300">{error}</p>
                    <Button variant="secondary" size="sm" onClick={() => fetchPrompts()}>
                      Reload
                    </Button>
                  </div>
                ) : filteredPrompts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                        onClick={() => setSelectedPrompt(prompt)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {prompt.title}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDifficultyColor(
                              prompt.difficulty
                            )}`}
                          >
                            {getDifficultyText(prompt.difficulty)}
                          </span>
                        </div>
                        <p className="mb-3 text-sm text-blue-100/80">
                          {prompt.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {prompt.tags.map((tag) => (
                            <Badge key={tag} variant="default">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUsePrompt(prompt)
                            }}
                          >
                            Use This Prompt
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyPrompt(prompt.prompt)
                            }}
                          >
                            Copy Prompt
                          </Button>
                          {prompt.slug && (
                            <Link
                              href={`/prompts/${prompt.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                            >
                              View Details
                              <svg
                                className="ml-1 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-blue-100/70">
                      No prompts match your filters yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Prompt Details and Recommended Books */}
          <div className="space-y-6">
            {/* Selected Prompt Details */}
            {selectedPrompt && (
              <Card className="border border-white/10 bg-white/5 text-white shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Prompt Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      {selectedPrompt.title}
                    </h3>
                    <p className="mb-3 text-sm text-blue-100/80">
                      {selectedPrompt.description}
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-blue-100/80">
                      Full Prompt
                    </label>
                    <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                      <p className="whitespace-pre-wrap text-sm text-white">
                        {selectedPrompt.prompt}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleUsePrompt(selectedPrompt)}
                    >
                      Use This Prompt
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyPrompt(selectedPrompt.prompt)}
                    >
                      Copy
                    </Button>
                  </div>
                  <button
                    onClick={() => setSelectedPrompt(null)}
                    className="text-sm text-blue-200 hover:text-white"
                  >
                    Close Details
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Recommended Books */}
            <Card className="border border-white/10 bg-white/5 text-white shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">📚 Recommended Practice Books</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedBooks.map((book, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/15 bg-white/5 p-3"
                    >
                      <h4 className="mb-1 text-sm font-semibold text-white">
                        {book.title}
                      </h4>
                      <p className="mb-2 text-xs text-blue-100/80">
                        {book.description}
                      </p>
                      <Badge variant="info" className="text-xs">
                        {book.level}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-3">
                  <p className="text-xs text-blue-100">
                    💡 Tip: These books can help you systematically learn prompt engineering and improve the quality and efficiency of AI video generation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

