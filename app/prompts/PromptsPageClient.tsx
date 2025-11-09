'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui'

// 提示词分类
type PromptCategory = 'all' | 'nature' | 'character' | 'action' | 'scenery' | 'abstract' | 'cinematic'

// 提示词数据结构
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

// 示例提示词数据
const promptsData: Prompt[] = [
  {
    id: '1',
    title: '宁静的森林晨光',
    description: '一个宁静的森林场景，晨光透过树叶洒下',
    prompt: 'A serene forest scene at dawn, with soft golden sunlight filtering through the dense canopy of ancient trees. Gentle morning mist floats between the tree trunks, and dewdrops glisten on leaves. Birds can be heard chirping in the distance. Cinematic, 4K, natural lighting, peaceful atmosphere.',
    category: 'nature',
    tags: ['forest', 'morning', 'peaceful', 'nature'],
    difficulty: 'beginner',
  },
  {
    id: '2',
    title: '未来城市飞行',
    description: '在充满未来感的城市中飞行穿梭',
    prompt: 'A futuristic cityscape at night, flying through neon-lit skyscrapers. Holographic advertisements flicker on building facades. Flying vehicles zoom past in the background. Cyberpunk aesthetic, cinematic camera movement, 4K, vibrant colors.',
    category: 'scenery',
    tags: ['futuristic', 'city', 'flying', 'cyberpunk'],
    difficulty: 'intermediate',
  },
  {
    id: '3',
    title: '猫咪玩耍',
    description: '一只可爱的小猫在草地上玩耍',
    prompt: 'A cute orange tabby kitten playing on a lush green lawn. The kitten chases a butterfly, pouncing and rolling around. Soft natural lighting, shallow depth of field, 4K, adorable and heartwarming atmosphere.',
    category: 'character',
    tags: ['cat', 'cute', 'playing', 'animals'],
    difficulty: 'beginner',
  },
  {
    id: '4',
    title: '海浪冲击岩石',
    description: '壮观的海洋场景，海浪猛烈冲击海岸岩石',
    prompt: 'Powerful ocean waves crashing against rugged coastal rocks. White foam sprays into the air. Dramatic storm clouds gather overhead. Slow motion, cinematic, 4K, dramatic lighting, epic and powerful atmosphere.',
    category: 'nature',
    tags: ['ocean', 'waves', 'dramatic', 'nature'],
    difficulty: 'intermediate',
  },
  {
    id: '5',
    title: '抽象粒子流动',
    description: '抽象的粒子流动效果，充满科技感',
    prompt: 'Abstract flowing particles in vibrant colors, creating mesmerizing patterns. Smooth, fluid motion with glowing trails. Dark background with neon accents. Futuristic, hypnotic, 4K, smooth animation.',
    category: 'abstract',
    tags: ['abstract', 'particles', 'futuristic', 'visual'],
    difficulty: 'advanced',
  },
  {
    id: '6',
    title: '武侠剑客对决',
    description: '古风武侠场景，两位剑客在竹林中对决',
    prompt: 'Two ancient Chinese swordsmen in a dramatic duel among bamboo forest. Their movements are graceful yet powerful. Bamboo leaves fall slowly around them. Cinematic, slow motion, traditional Chinese aesthetic, 4K, epic atmosphere.',
    category: 'action',
    tags: ['martial arts', 'ancient', 'dramatic', 'action'],
    difficulty: 'advanced',
  },
  {
    id: '7',
    title: '星空下的沙漠',
    description: '夜晚的沙漠，满天繁星',
    prompt: 'A vast desert landscape at night under a starry sky. The Milky Way stretches across the horizon. Sand dunes create soft curves in the moonlight. Time-lapse, cinematic, 4K, peaceful and majestic.',
    category: 'scenery',
    tags: ['desert', 'stars', 'night', 'landscape'],
    difficulty: 'intermediate',
  },
  {
    id: '8',
    title: '机器人探索',
    description: '一个机器人探索废弃的城市',
    prompt: 'A humanoid robot exploring an abandoned, overgrown city. Vines cover crumbling buildings. The robot moves cautiously, scanning the environment. Post-apocalyptic, cinematic, 4K, melancholic atmosphere.',
    category: 'character',
    tags: ['robot', 'post-apocalyptic', 'exploration', 'sci-fi'],
    difficulty: 'advanced',
  },
]

// 推荐的实战书籍
const recommendedBooks = [
  {
    title: 'Prompt Engineering：从入门到精通',
    description: '系统梳理提示词工程的三大原则——明确性、结构化、上下文控制，通过200多个案例解析如何设计高效提示',
    level: '适合初学者',
  },
  {
    title: 'DeepSeek提示词实战指南',
    description: '聚焦DeepSeek的独特功能，提供50多个真实场景案例，帮助掌握提示词设计的实战技巧',
    level: '适合进阶学习',
  },
  {
    title: 'ChatGPT实战方法论-提示词的探险之旅',
    description: '深入学习如何利用ChatGPT提升工作效率，学会在不同场景下的应用，掌握提示词的使用原则和方法',
    level: '适合各岗位人员',
  },
  {
    title: 'AI提示词实战指南',
    description: '从基础开始，剖析常见错误，分享技巧和应用场景，通过实战案例将知识点串联贯通',
    level: '全面系统学习',
  },
  {
    title: 'Animatediff视频提示词书写技巧与实践',
    description: '深入探讨Animatediff视频提示词的书写要点，帮助理解并掌握如何有效地编写提示词',
    level: '专业视频生成',
  },
  {
    title: 'Vidu生成视频提示词撰写全教程：从入门到精通',
    description: '详细介绍Vidu提示词的构成、撰写技巧、不同场景下的应用以及常见问题与解决方法',
    level: 'Vidu平台专精',
  },
]

export default function PromptsPageClient() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)

  // 过滤提示词
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

  // 使用提示词生成视频
  const handleUsePrompt = (prompt: Prompt) => {
    router.push(`/video?prompt=${encodeURIComponent(prompt.prompt)}`)
  }

  // 复制提示词
  const handleCopyPrompt = async (promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText)
      alert('提示词已复制到剪贴板！')
    } catch (error) {
      console.error('复制失败:', error)
      alert('复制失败，请手动复制')
    }
  }

  const categories: { value: PromptCategory; label: string; icon: string }[] = [
    { value: 'all', label: '全部', icon: '📚' },
    { value: 'nature', label: '自然', icon: '🌲' },
    { value: 'character', label: '角色', icon: '👤' },
    { value: 'action', label: '动作', icon: '⚡' },
    { value: 'scenery', label: '风景', icon: '🏞️' },
    { value: 'abstract', label: '抽象', icon: '🎨' },
    { value: 'cinematic', label: '电影感', icon: '🎬' },
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
        return '初级'
      case 'intermediate':
        return '中级'
      case 'advanced':
        return '高级'
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
                视频生成
              </Link>
              <Link
                href="/prompts"
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
              >
                提示词库
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            视频提示词库
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            探索精选的AI视频生成提示词，快速创建高质量视频内容
          </p>
        </div>

        {/* 搜索和分类 */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              搜索提示词
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索标题、描述、标签或提示词内容..."
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              分类筛选
            </label>
            <div className="flex flex-wrap gap-2" style={{ position: 'relative', zIndex: 1 }}>
              {categories.map((category) => {
                const isSelected = selectedCategory === category.value
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => {
                      console.log('分类点击:', category.value)
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
          {/* 提示词列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  提示词库 ({filteredPrompts.length})
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
                            使用此提示词
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyPrompt(prompt.prompt)
                            }}
                          >
                            复制提示词
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      没有找到匹配的提示词
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏：提示词详情和推荐书籍 */}
          <div className="space-y-6">
            {/* 选中的提示词详情 */}
            {selectedPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle>提示词详情</CardTitle>
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
                      完整提示词
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
                      使用此提示词
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleCopyPrompt(selectedPrompt.prompt)}
                    >
                      复制
                    </Button>
                  </div>
                  <button
                    onClick={() => setSelectedPrompt(null)}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    关闭详情
                  </button>
                </CardContent>
              </Card>
            )}

            {/* 推荐书籍 */}
            <Card>
              <CardHeader>
                <CardTitle>📚 推荐实战书籍</CardTitle>
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
                    💡 提示：这些书籍可以帮助您系统学习提示词工程，提升AI视频生成的质量和效率。
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

