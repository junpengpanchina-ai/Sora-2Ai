/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui'
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
}

export default function PromptsEnPageClient() {
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
            typeof payload.error === 'string' ? payload.error : 'Failed to load prompts'
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
            locale: String(promptItem.locale ?? 'en') as Prompt['locale'],
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
        setError(err instanceof Error ? err.message : 'Failed to load prompts')
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
    return () => controller.abort()
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
      console.error('Failed to copy:', error)
      alert('Failed to copy, please copy manually')
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
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Beginner'
      case 'intermediate':
        return 'Intermediate'
      case 'advanced':
        return 'Advanced'
      default:
        return difficulty
    }
  }

  return (
    <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                Sora2Ai Videos
              </Link>
              <Link
                href="/video"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-energy-water dark:text-gray-300 dark:hover:text-energy-water-deep"
              >
                Video Generation
              </Link>
              <Link
                href="/prompts-en"
                className="text-sm font-medium text-energy-water dark:text-energy-soft"
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Video Prompt Library
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explore curated AI video generation prompts to quickly create high-quality video content
          </p>
        </div>

        {/* Search and Categories */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Prompts
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, tags, or prompt content..."
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-energy-water focus:outline-none focus:ring-energy-water dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-energy-water text-white hover:bg-energy-water-deep'
                        : 'bg-energy-water-surface text-gray-700 hover:bg-energy-water-muted/60 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
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
            <Card>
              <CardHeader>
                <CardTitle>
                  Prompt Library ({filteredPrompts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="mr-3 h-6 w-6 animate-spin rounded-full border-b-2 border-energy-water"></div>
                    Loading prompts...
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                    <Button variant="secondary" size="sm" onClick={() => fetchPrompts()}>
                      Retry
                    </Button>
                  </div>
                ) : filteredPrompts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => setSelectedPrompt(prompt)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No matching prompts found
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Prompt Details */}
          <div className="space-y-6">
            {/* Selected Prompt Details */}
            {selectedPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle>Prompt Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedPrompt.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {selectedPrompt.description}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Prompt
                    </label>
                    <div className="rounded-md bg-gray-50 dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
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
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Close Details
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle>💡 Prompt Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Be Specific
                    </h4>
                    <p>Include details about lighting, camera movement, and atmosphere</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Use Keywords
                    </h4>
                    <p>Add terms like &quot;cinematic&quot;, &quot;4K&quot;, &quot;slow motion&quot; for better results</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Combine Elements
                    </h4>
                    <p>Mix different elements like nature, characters, and actions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

