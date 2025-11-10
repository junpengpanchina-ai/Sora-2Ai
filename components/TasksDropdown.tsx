'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Badge, Button } from '@/components/ui'

interface RecentTask {
  id: string
  prompt: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  created_at: string
  video_url: string | null
}

interface TasksDropdownProps {
  tasks: RecentTask[]
  stats: {
    total: number
    succeeded: number
    processing: number
    failed: number
  } | null
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'succeeded':
      return <Badge variant="success">Success</Badge>
    case 'processing':
    case 'pending':
      return <Badge variant="info">Processing</Badge>
    case 'failed':
      return <Badge variant="error">Failed</Badge>
    default:
      return <Badge variant="default">{status}</Badge>
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })
}

export default function TasksDropdown({ tasks, stats }: TasksDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="secondary"
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        Generation Status
        {stats && stats.processing > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
            {stats.processing}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-y-auto">
          <div className="p-4">
            {/* Stats Summary */}
            {stats && (
              <div className="grid grid-cols-4 gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Success</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {stats.succeeded}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Processing</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {stats.processing}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Failed</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {stats.failed}
                  </p>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Recent Tasks
              </h3>
              {tasks.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    No tasks created yet
                  </p>
                  <Link href="/video">
                    <Button variant="primary" size="sm">Create First Task</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                            {task.prompt}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(task.status)}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(task.created_at)}
                            </span>
                          </div>
                        </div>
                        {task.video_url && (
                          <Link
                            href={task.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open
                          </Link>
                        )}
                      </div>
                      {task.video_url && task.status === 'succeeded' && (
                        <div className="mt-2 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <video
                            src={task.video_url}
                            controls
                            className="w-full max-h-32 object-contain"
                            preload="metadata"
                            playsInline
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                    </div>
                  ))}
                  {tasks.length > 5 && (
                    <div className="text-center pt-2">
                      <Link href="/video">
                        <Button variant="secondary" size="sm" className="w-full">
                          View All Tasks
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

