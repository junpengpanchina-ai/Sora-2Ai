'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'

interface AdminBlogManagerProps {
  onShowBanner: (type: 'success' | 'error', text: string) => void
}

interface BlogPostRecord {
  id: string
  slug: string
  title: string
  description: string
  h1: string
  content: string
  published_at: string | null
  is_published: boolean
  related_posts: string[]
  seo_keywords: string[]
  created_at: string
  updated_at: string
}

type BlogFormState = {
  slug: string
  title: string
  description: string
  h1: string
  content: string
  published_at: string
  isPublished: boolean
  related_posts: string
  seo_keywords: string
}

const DEFAULT_FORM_STATE: BlogFormState = {
  slug: '',
  title: '',
  description: '',
  h1: '',
  content: '',
  published_at: '',
  isPublished: true,
  related_posts: '',
  seo_keywords: '',
}

const STATUS_BADGES: Record<'published' | 'draft', { label: string; className: string }> = {
  published: {
    label: '已发布',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  draft: {
    label: '草稿',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  },
}

function normalizeBlogRecord(item: unknown): BlogPostRecord | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id : null
  const slug = typeof record.slug === 'string' ? record.slug : ''
  const title = typeof record.title === 'string' ? record.title : ''
  const description = typeof record.description === 'string' ? record.description : ''
  const h1 = typeof record.h1 === 'string' ? record.h1 : ''
  const content = typeof record.content === 'string' ? record.content : ''

  if (!id || !slug || !title || !description || !h1 || !content) {
    return null
  }

  return {
    id,
    slug,
    title,
    description,
    h1,
    content,
    published_at: typeof record.published_at === 'string' ? record.published_at : null,
    is_published: typeof record.is_published === 'boolean' ? record.is_published : true,
    related_posts: Array.isArray(record.related_posts)
      ? record.related_posts.filter((p): p is string => typeof p === 'string')
      : [],
    seo_keywords: Array.isArray(record.seo_keywords)
      ? record.seo_keywords.filter((k): k is string => typeof k === 'string')
      : [],
    created_at: typeof record.created_at === 'string' ? record.created_at : new Date().toISOString(),
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : new Date().toISOString(),
  }
}

function buildFormStateFromBlog(blog: BlogPostRecord): BlogFormState {
  return {
    slug: blog.slug,
    title: blog.title,
    description: blog.description,
    h1: blog.h1,
    content: blog.content,
    published_at: blog.published_at ? blog.published_at.split('T')[0] : '',
    isPublished: blog.is_published,
    related_posts: blog.related_posts.join(', '),
    seo_keywords: blog.seo_keywords.join(', '),
  }
}

function parseArrayInput(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export default function AdminBlogManager({ onShowBanner }: AdminBlogManagerProps) {
  const [blogs, setBlogs] = useState<BlogPostRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  const [newBlogForm, setNewBlogForm] = useState<BlogFormState>(DEFAULT_FORM_STATE)
  const [creating, setCreating] = useState(false)

  const [editingBlogId, setEditingBlogId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<BlogFormState>(DEFAULT_FORM_STATE)
  const [updating, setUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchBlogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/blog-posts')
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const messageParts: string[] = []
        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
          messageParts.push(payload.error.trim())
        }
        if (typeof payload.details === 'string' && payload.details.trim().length > 0) {
          messageParts.push(payload.details.trim())
        }
        const message = messageParts.join('：') || '获取博客文章列表失败'
        throw new Error(message)
      }

      const items = Array.isArray(payload.blogPosts) ? payload.blogPosts : []
      const normalized = items
        .map((item: unknown) => normalizeBlogRecord(item))
        .filter((item: BlogPostRecord | null): item is BlogPostRecord => Boolean(item))

      setBlogs(normalized)
    } catch (err) {
      console.error('获取博客文章列表失败:', err)
      setError(err instanceof Error ? err.message : '获取博客文章列表失败')
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBlogs()
  }, [fetchBlogs])

  const filteredBlogs = useMemo(() => {
    const text = search.trim().toLowerCase()
    return blogs.filter((blog) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' ? blog.is_published : !blog.is_published)
      const matchesSearch =
        text === '' ||
        blog.slug.toLowerCase().includes(text) ||
        blog.title.toLowerCase().includes(text) ||
        blog.description.toLowerCase().includes(text) ||
        blog.h1.toLowerCase().includes(text)
      return matchesStatus && matchesSearch
    })
  }, [blogs, search, statusFilter])

  const handleCreateBlog = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newBlogForm.slug.trim()) {
      onShowBanner('error', '请输入文章slug')
      return
    }
    if (!newBlogForm.title.trim()) {
      onShowBanner('error', '请输入文章标题')
      return
    }
    if (!newBlogForm.h1.trim()) {
      onShowBanner('error', '请输入H1标题')
      return
    }
    if (!newBlogForm.content.trim()) {
      onShowBanner('error', '请输入文章内容')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/admin/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newBlogForm.slug.trim(),
          title: newBlogForm.title.trim(),
          description: newBlogForm.description.trim(),
          h1: newBlogForm.h1.trim(),
          content: newBlogForm.content.trim(),
          published_at: newBlogForm.published_at || null,
          is_published: newBlogForm.isPublished,
          related_posts: parseArrayInput(newBlogForm.related_posts),
          seo_keywords: parseArrayInput(newBlogForm.seo_keywords),
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const messageParts: string[] = []
        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
          messageParts.push(payload.error.trim())
        }
        if (typeof payload.details === 'string' && payload.details.trim().length > 0) {
          messageParts.push(payload.details.trim())
        }
        const message = messageParts.join('：') || '创建博客文章失败'
        throw new Error(message)
      }

      onShowBanner('success', '博客文章创建成功')
      setNewBlogForm(DEFAULT_FORM_STATE)
      await fetchBlogs()
    } catch (err) {
      console.error('创建博客文章失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '创建博客文章失败')
    } finally {
      setCreating(false)
    }
  }

  const handleStartEdit = (blog: BlogPostRecord) => {
    setEditingBlogId(blog.id)
    setEditForm(buildFormStateFromBlog(blog))
  }

  const handleCancelEdit = () => {
    setEditingBlogId(null)
    setEditForm(DEFAULT_FORM_STATE)
  }

  const handleUpdateBlog = async (id: string) => {
    if (!editForm.slug.trim() || !editForm.title.trim() || !editForm.h1.trim() || !editForm.content.trim()) {
      onShowBanner('error', '请填写所有必需字段')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/blog-posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editForm.slug.trim(),
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          h1: editForm.h1.trim(),
          content: editForm.content.trim(),
          published_at: editForm.published_at || null,
          is_published: editForm.isPublished,
          related_posts: parseArrayInput(editForm.related_posts),
          seo_keywords: parseArrayInput(editForm.seo_keywords),
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const messageParts: string[] = []
        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
          messageParts.push(payload.error.trim())
        }
        if (typeof payload.details === 'string' && payload.details.trim().length > 0) {
          messageParts.push(payload.details.trim())
        }
        const message = messageParts.join('：') || '更新博客文章失败'
        throw new Error(message)
      }

      onShowBanner('success', '博客文章更新成功')
      setEditingBlogId(null)
      setEditForm(DEFAULT_FORM_STATE)
      await fetchBlogs()
    } catch (err) {
      console.error('更新博客文章失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '更新博客文章失败')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('确定要删除这篇博客文章吗？此操作无法撤销。')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/blog-posts/${id}`, {
        method: 'DELETE',
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const messageParts: string[] = []
        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
          messageParts.push(payload.error.trim())
        }
        if (typeof payload.details === 'string' && payload.details.trim().length > 0) {
          messageParts.push(payload.details.trim())
        }
        const message = messageParts.join('：') || '删除博客文章失败'
        throw new Error(message)
      }

      onShowBanner('success', '博客文章删除成功')
      await fetchBlogs()
    } catch (err) {
      console.error('删除博客文章失败:', err)
      onShowBanner('error', err instanceof Error ? err.message : '删除博客文章失败')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="p-6">加载中...</div>
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 dark:text-red-400">错误: {error}</div>
        <Button onClick={fetchBlogs} className="mt-4">
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>创建新博客文章</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBlog} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Slug *</label>
                <Input
                  value={newBlogForm.slug}
                  onChange={(e) => setNewBlogForm({ ...newBlogForm, slug: e.target.value })}
                  placeholder="best-sora-alternatives"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">发布日期</label>
                <Input
                  type="date"
                  value={newBlogForm.published_at}
                  onChange={(e) => setNewBlogForm({ ...newBlogForm, published_at: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">标题 *</label>
              <Input
                value={newBlogForm.title}
                onChange={(e) => setNewBlogForm({ ...newBlogForm, title: e.target.value })}
                placeholder="Best Sora Alternatives for Creators in 2025"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">描述 *</label>
              <Textarea
                value={newBlogForm.description}
                onChange={(e) => setNewBlogForm({ ...newBlogForm, description: e.target.value })}
                placeholder="Discover the best Sora alternatives..."
                rows={2}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">H1标题 *</label>
              <Input
                value={newBlogForm.h1}
                onChange={(e) => setNewBlogForm({ ...newBlogForm, h1: e.target.value })}
                placeholder="Best Sora Alternatives for Creators in 2025"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">内容 (HTML) *</label>
              <Textarea
                value={newBlogForm.content}
                onChange={(e) => setNewBlogForm({ ...newBlogForm, content: e.target.value })}
                placeholder="<p>文章内容...</p>"
                rows={10}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">相关文章 (逗号分隔)</label>
                <Input
                  value={newBlogForm.related_posts}
                  onChange={(e) => setNewBlogForm({ ...newBlogForm, related_posts: e.target.value })}
                  placeholder="free-sora-alternative, sora-vs-runway"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SEO关键词 (逗号分隔)</label>
                <Input
                  value={newBlogForm.seo_keywords}
                  onChange={(e) => setNewBlogForm({ ...newBlogForm, seo_keywords: e.target.value })}
                  placeholder="sora alternative, ai video generator"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="new-is-published"
                checked={newBlogForm.isPublished}
                onChange={(e) => setNewBlogForm({ ...newBlogForm, isPublished: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="new-is-published" className="text-sm">
                立即发布
              </label>
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? '创建中...' : '创建博客文章'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>博客文章列表 ({filteredBlogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="搜索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                className="px-3 py-2 border rounded"
              >
                <option value="all">全部状态</option>
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
              </select>
            </div>

            <div className="space-y-2">
              {filteredBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="border rounded-lg p-4 flex items-start justify-between gap-4"
                >
                  {editingBlogId === blog.id ? (
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={editForm.slug}
                          onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                          placeholder="slug"
                        />
                        <Input
                          type="date"
                          value={editForm.published_at}
                          onChange={(e) => setEditForm({ ...editForm, published_at: e.target.value })}
                        />
                      </div>
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="标题"
                      />
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="描述"
                        rows={2}
                      />
                      <Input
                        value={editForm.h1}
                        onChange={(e) => setEditForm({ ...editForm, h1: e.target.value })}
                        placeholder="H1"
                      />
                      <Textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        placeholder="内容 (HTML)"
                        rows={6}
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.isPublished}
                          onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                          className="rounded"
                        />
                        <label className="text-sm">已发布</label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateBlog(blog.id)}
                          disabled={updating}
                        >
                          {updating ? '保存中...' : '保存'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{blog.title}</h3>
                          <Badge className={STATUS_BADGES[blog.is_published ? 'published' : 'draft'].className}>
                            {STATUS_BADGES[blog.is_published ? 'published' : 'draft'].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Slug: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{blog.slug}</code>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {blog.description}
                        </p>
                        {blog.published_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            发布时间: {new Date(blog.published_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleStartEdit(blog)}>
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBlog(blog.id)}
                          disabled={deletingId === blog.id}
                        >
                          {deletingId === blog.id ? '删除中...' : '删除'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

