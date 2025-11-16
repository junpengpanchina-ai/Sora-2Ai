'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Alert } from '@/components/ui'
import { getPublicUrl } from '@/lib/r2/client'
import Link from 'next/link'
import Image from 'next/image'

interface FileInfo {
  key: string | null
  size: number | undefined
  lastModified: Date | undefined
  url: string | null
}

export default function StorageTestClient() {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<FileInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [testKey, setTestKey] = useState('')
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null)
  const [imageUrl, setImageUrl] = useState('')

  // List files
  const handleListFiles = async (prefix?: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ action: 'list' })
      if (prefix) params.append('prefix', prefix)
      
      const response = await fetch(`/api/storage/test?${params}`)
      const data = await response.json()

      if (data.success) {
        setFiles(data.files || [])
        setTestResult(data)
      } else {
        setError(data.error || 'Failed to list files')
        setTestResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list files')
    } finally {
      setLoading(false)
    }
  }

  // Check file
  const handleCheckFile = async (key: string) => {
    if (!key) {
      setError('Please enter a file key')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/storage/test?action=check&key=${encodeURIComponent(key)}`)
      const data = await response.json()

      if (data.success) {
        setTestResult(data)
        if (data.exists) {
          setImageUrl(data.url)
        }
      } else {
        setError(data.error || 'Failed to check file')
        setTestResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check file')
    } finally {
      setLoading(false)
    }
  }

  // Get image URL
  const handleGetImageUrl = async (key: string) => {
    if (!key) {
      setError('Please enter a file key')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/storage/test?action=image&key=${encodeURIComponent(key)}`)
      const data = await response.json()

      if (data.success) {
        setTestResult(data)
        setImageUrl(data.url)
      } else {
        setError(data.error || 'Failed to get image URL')
        setTestResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get image URL')
    } finally {
      setLoading(false)
    }
  }

  // Quick test with tool function
  const handleQuickTest = (key: string) => {
    if (!key) {
      setError('Please enter a file key')
      return
    }
    const url = getPublicUrl(key)
    setImageUrl(url)
    setTestResult({
      success: true,
      action: 'quick',
      key,
      url,
      message: 'URL generated using getPublicUrl() function',
    })
  }

  return (
    <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                Sora2Ai Videos
              </Link>
              <span className="text-sm text-gray-600 dark:text-gray-400">R2 Storage Test</span>
            </div>
            <Link href="/">
              <Button variant="secondary" size="sm">Back to Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            R2 Storage Test
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Test accessing files from Cloudflare R2 storage
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Test Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* List Files */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  List Files
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleListFiles()}
                    disabled={loading}
                  >
                    List All Files
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleListFiles('images/')}
                    disabled={loading}
                  >
                    List Images
                  </Button>
                </div>
              </div>

              {/* Test File Key */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Test File Access
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={testKey}
                    onChange={(e) => setTestKey(e.target.value)}
                    placeholder="e.g., images/test.jpg"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-energy-water focus:outline-none focus:ring-energy-water dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => handleGetImageUrl(testKey)}
                      disabled={loading || !testKey}
                    >
                      Get Image URL
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleCheckFile(testKey)}
                      disabled={loading || !testKey}
                    >
                      Check File
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleQuickTest(testKey)}
                      disabled={loading || !testKey}
                    >
                      Quick Test
                    </Button>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="error">
                  {error}
                </Alert>
              )}

              {testResult && (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Test Result
                  </h4>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Image Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {imageUrl ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <Image
                      src={imageUrl}
                      alt="R2 Image"
                      width={800}
                      height={450}
                      className="h-auto w-full"
                      onError={() => {
                        setError('Failed to load image. File may not exist or URL is incorrect.')
                      }}
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Image URL
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white break-all">
                      {imageUrl}
                    </p>
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-energy-water hover:text-energy-water-deep dark:text-energy-soft"
                    >
                      Open in new tab →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>No image URL yet</p>
                  <p className="text-xs mt-2">Enter a file key and click &quot;Get Image URL&quot;</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Files List ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.key || 'Unknown'}
                      </p>
                      {file.size && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {file.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTestKey(file.key || '')
                            setImageUrl(file.url || '')
                          }}
                        >
                          Load
                        </Button>
                      )}
                      {file.url && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-energy-water hover:text-energy-water-deep dark:text-energy-soft"
                        >
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

