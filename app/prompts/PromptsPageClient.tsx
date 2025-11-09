'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui'

// Prompt categories
type PromptCategory = 'all' | 'nature' | 'character' | 'action' | 'scenery' | 'abstract' | 'cinematic'

// Prompt data structure
interface Prompt {
  id: string
  title: string
  description: string
  prompt: string
  category: PromptCategory
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  example?: string
}

// Sample prompt data
const promptsData: Prompt[] = [
  {
    id: '1',
    title: 'Serene Forest Dawn',
    description: 'A peaceful forest scene with morning light filtering through trees',
    prompt: 'A serene forest scene at dawn, with soft golden sunlight filtering through the dense canopy of ancient trees. Gentle morning mist floats between the tree trunks, and dewdrops glisten on leaves. Birds can be heard chirping in the distance. Cinematic, 4K, natural lighting, peaceful atmosphere.',
    category: 'nature',
    tags: ['forest', 'morning', 'peaceful', 'nature'],
    difficulty: 'beginner',
  },
  {
    id: '2',
    title: 'Futuristic City Flight',
    description: 'Flying through a futuristic cityscape at night',
    prompt: 'A futuristic cityscape at night, flying through neon-lit skyscrapers. Holographic advertisements flicker on building facades. Flying vehicles zoom past in the background. Cyberpunk aesthetic, cinematic camera movement, 4K, vibrant colors.',
    category: 'scenery',
    tags: ['futuristic', 'city', 'flying', 'cyberpunk'],
    difficulty: 'intermediate',
  },
  {
    id: '3',
    title: 'Kitten Playing',
    description: 'A cute kitten playing on the grass',
    prompt: 'A cute orange tabby kitten playing on a lush green lawn. The kitten chases a butterfly, pouncing and rolling around. Soft natural lighting, shallow depth of field, 4K, adorable and heartwarming atmosphere.',
    category: 'character',
    tags: ['cat', 'cute', 'playing', 'animals'],
    difficulty: 'beginner',
  },
  {
    id: '4',
    title: 'Ocean Waves Crashing',
    description: 'Powerful ocean waves crashing against coastal rocks',
    prompt: 'Powerful ocean waves crashing against rugged coastal rocks. White foam sprays into the air. Dramatic storm clouds gather overhead. Slow motion, cinematic, 4K, dramatic lighting, epic and powerful atmosphere.',
    category: 'nature',
    tags: ['ocean', 'waves', 'dramatic', 'nature'],
    difficulty: 'intermediate',
  },
  {
    id: '5',
    title: 'Abstract Particle Flow',
    description: 'Abstract flowing particles with futuristic feel',
    prompt: 'Abstract flowing particles in vibrant colors, creating mesmerizing patterns. Smooth, fluid motion with glowing trails. Dark background with neon accents. Futuristic, hypnotic, 4K, smooth animation.',
    category: 'abstract',
    tags: ['abstract', 'particles', 'futuristic', 'visual'],
    difficulty: 'advanced',
  },
  {
    id: '6',
    title: 'Martial Arts Duel',
    description: 'Ancient Chinese swordsmen dueling in a bamboo forest',
    prompt: 'Two ancient Chinese swordsmen in a dramatic duel among bamboo forest. Their movements are graceful yet powerful. Bamboo leaves fall slowly around them. Cinematic, slow motion, traditional Chinese aesthetic, 4K, epic atmosphere.',
    category: 'action',
    tags: ['martial arts', 'ancient', 'dramatic', 'action'],
    difficulty: 'advanced',
  },
  {
    id: '7',
    title: 'Desert Under Stars',
    description: 'A desert landscape at night under a starry sky',
    prompt: 'A vast desert landscape at night under a starry sky. The Milky Way stretches across the horizon. Sand dunes create soft curves in the moonlight. Time-lapse, cinematic, 4K, peaceful and majestic.',
    category: 'scenery',
    tags: ['desert', 'stars', 'night', 'landscape'],
    difficulty: 'intermediate',
  },
  {
    id: '8',
    title: 'Robot Exploration',
    description: 'A robot exploring an abandoned city',
    prompt: 'A humanoid robot exploring an abandoned, overgrown city. Vines cover crumbling buildings. The robot moves cautiously, scanning the environment. Post-apocalyptic, cinematic, 4K, melancholic atmosphere.',
    category: 'character',
    tags: ['robot', 'post-apocalyptic', 'exploration', 'sci-fi'],
    difficulty: 'advanced',
  },
]

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
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)

  // Filter prompts
  const filteredPrompts = useMemo(() => {
    return promptsData.filter((prompt) => {
      const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory
      const matchesSearch =
        searchQuery === '' ||
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        prompt.prompt.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

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

  const categories: { value: PromptCategory; label: string; icon: string }[] = [
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                Sora-2Ai
              </Link>
              <Link
                href="/video"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors"
              >
                Video Generation
              </Link>
              <Link
                href="/prompts"
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
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
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                    onClick={() => {
                      console.log('Category clicked:', category.value)
                      setSelectedCategory(category.value)
                    }}
                    style={{ 
                      position: 'relative',
                      zIndex: 10,
                      pointerEvents: 'auto',
                      cursor: 'pointer'
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
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
                {filteredPrompts.length > 0 ? (
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
                            variant="default"
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

          {/* Sidebar: Prompt Details and Recommended Books */}
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
                      variant="default"
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

            {/* Recommended Books */}
            <Card>
              <CardHeader>
                <CardTitle>📚 Recommended Practice Books</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedBooks.map((book, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                    >
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {book.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {book.description}
                      </p>
                      <Badge variant="info" className="text-xs">
                        {book.level}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-indigo-800 dark:text-indigo-200">
                    💡 Tip: These books can help you systematically learn prompt engineering and improve the quality and efficiency of AI video generation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

