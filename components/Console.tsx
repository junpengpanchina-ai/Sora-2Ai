'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

export interface ConsoleLogData {
  level: LogLevel
  message: string
  data?: unknown
}

export interface ConsoleLogAPI {
  log: (msg: string, data?: unknown) => void
  info: (msg: string, data?: unknown) => void
  warn: (msg: string, data?: unknown) => void
  error: (msg: string, data?: unknown) => void
  debug: (msg: string, data?: unknown) => void
  _queue?: ConsoleLogData[]
}

declare global {
  interface Window {
    consoleLog?: ConsoleLogAPI
  }
}

// Initialize placeholder consoleLog - only in browser environment
// This function is called from useEffect to avoid SSR issues
function initializePlaceholderConsole(): void {
  if (typeof window === 'undefined') return
  
  if (!window.consoleLog) {
    // Create a queue to store logs before the component is mounted
    const logQueue: ConsoleLogData[] = []
    
    // Placeholder that queues logs until the real console is ready
    window.consoleLog = {
      log: (msg: string, data?: unknown) => {
        logQueue.push({ level: 'log', message: msg, data })
        console.log('[Console Queue]', msg, data)
      },
      info: (msg: string, data?: unknown) => {
        logQueue.push({ level: 'info', message: msg, data })
        console.info('[Console Queue]', msg, data)
      },
      warn: (msg: string, data?: unknown) => {
        logQueue.push({ level: 'warn', message: msg, data })
        console.warn('[Console Queue]', msg, data)
      },
      error: (msg: string, data?: unknown) => {
        logQueue.push({ level: 'error', message: msg, data })
        console.error('[Console Queue]', msg, data)
      },
      debug: (msg: string, data?: unknown) => {
        logQueue.push({ level: 'debug', message: msg, data })
        console.debug('[Console Queue]', msg, data)
      },
      _queue: logQueue, // Expose queue for component to process
    }
  }
}

export interface ConsoleLog {
  id: string
  level: LogLevel
  message: string
  timestamp: Date
  data?: unknown
}

interface ConsoleProps {
  className?: string
  defaultHeight?: number
  maxLogs?: number
  onCommand?: (command: string) => void
}

const Console: React.FC<ConsoleProps> = ({
  className,
  defaultHeight = 400,
  maxLogs = 1000,
  onCommand,
}) => {
  const [logs, setLogs] = useState<ConsoleLog[]>([])
  const [filter, setFilter] = useState('')
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all')
  const [command, setCommand] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  // Initialize placeholder console on mount (client-side only)
  useEffect(() => {
    initializePlaceholderConsole()
  }, [])

  // Auto scroll to bottom when new logs arrive
  useEffect(() => {
    if (!isMinimized) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isMinimized])

  // Add log function - use useCallback to ensure stable reference
  const addLog = useCallback((level: LogLevel, message: string, data?: unknown) => {
    const newLog: ConsoleLog = {
      id: `${Date.now()}-${Math.random()}`,
      level,
      message,
      timestamp: new Date(),
      data,
    }
    setLogs((prev) => {
      const updated = [...prev, newLog]
      return updated.slice(-maxLogs)
    })
  }, [maxLogs])

  // Expose addLog to window for global access - initialize immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Replace placeholder with real implementation
      const realConsoleLog: ConsoleLogAPI = {
        log: (msg: string, data?: unknown) => addLog('log', msg, data),
        info: (msg: string, data?: unknown) => addLog('info', msg, data),
        warn: (msg: string, data?: unknown) => addLog('warn', msg, data),
        error: (msg: string, data?: unknown) => addLog('error', msg, data),
        debug: (msg: string, data?: unknown) => addLog('debug', msg, data),
      }
      
      window.consoleLog = realConsoleLog

      // Process queued logs if any
      const placeholder = window.consoleLog?._queue
      if (Array.isArray(placeholder)) {
        placeholder.forEach((queued: ConsoleLogData) => {
          addLog(queued.level, queued.message, queued.data)
        })
        // Clear the queue
        placeholder.length = 0
      }

      // Cleanup on unmount
      return () => {
        // Restore placeholder on unmount
        if (typeof window !== 'undefined') {
          const logQueue: ConsoleLogData[] = []
          window.consoleLog = {
            log: (msg: string, data?: unknown) => {
              logQueue.push({ level: 'log', message: msg, data })
              console.log('[Console Unmounted]', msg, data)
            },
            info: (msg: string, data?: unknown) => {
              logQueue.push({ level: 'info', message: msg, data })
              console.info('[Console Unmounted]', msg, data)
            },
            warn: (msg: string, data?: unknown) => {
              logQueue.push({ level: 'warn', message: msg, data })
              console.warn('[Console Unmounted]', msg, data)
            },
            error: (msg: string, data?: unknown) => {
              logQueue.push({ level: 'error', message: msg, data })
              console.error('[Console Unmounted]', msg, data)
            },
            debug: (msg: string, data?: unknown) => {
              logQueue.push({ level: 'debug', message: msg, data })
              console.debug('[Console Unmounted]', msg, data)
            },
            _queue: logQueue,
          }
        }
      }
    }
  }, [addLog])

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === '' || log.message.toLowerCase().includes(filter.toLowerCase())
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel
    return matchesFilter && matchesLevel
  })

  // Handle command execution
  const handleCommand = (cmd: string) => {
    if (!cmd.trim()) return

    // Add command to history
    setCommandHistory((prev) => [...prev, cmd].slice(-50))
    setHistoryIndex(-1)

    // Add command to logs
    addLog('log', `> ${cmd}`)

    // Execute command
    if (onCommand) {
      onCommand(cmd)
    } else {
      // Default command handling
      try {
        // Try to evaluate as JavaScript
        const result = eval(cmd)
        if (result !== undefined) {
          addLog('log', String(result))
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        addLog('error', errorMessage)
      }
    }

    setCommand('')
  }

  // Handle input key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(command)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCommand(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setCommand('')
        } else {
          setHistoryIndex(newIndex)
          setCommand(commandHistory[newIndex])
        }
      }
    }
  }

  // Clear logs
  const clearLogs = () => {
    setLogs([])
  }

  // Get log level styles
  const getLogStyles = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-500/10 border-l-red-500'
      case 'warn':
        return 'text-yellow-400 bg-yellow-500/10 border-l-yellow-500'
      case 'info':
        return 'text-blue-400 bg-blue-500/10 border-l-blue-500'
      case 'debug':
        return 'text-purple-400 bg-purple-500/10 border-l-purple-500'
      default:
        return 'text-gray-300 bg-gray-800/50 border-l-gray-600'
    }
  }

  // Get log icon
  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return '✕'
      case 'warn':
        return '⚠'
      case 'info':
        return 'ℹ'
      case 'debug':
        return '🐛'
      default:
        return '•'
    }
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
  }

  if (isMinimized) {
    return (
      <div
        className={cn(
          'fixed bottom-0 right-0 z-50 bg-gray-900 border-t border-gray-700 shadow-lg',
          className
        )}
      >
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm text-gray-400">Console</span>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ↑
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 right-0 z-50 bg-gray-900 border-t border-l border-gray-700 shadow-2xl flex flex-col',
        className
      )}
      style={{ height: `${defaultHeight}px`, width: '600px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-300">Console</span>
          <span className="text-xs text-gray-500">({filteredLogs.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            title="Clear console"
          >
            Clear
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            title="Minimize"
          >
            ↓
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center gap-2">
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value as LogLevel | 'all')}
          className="px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All</option>
          <option value="log">Log</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>
      </div>

      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No logs to display</div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={cn(
                'mb-1 px-3 py-1 rounded border-l-2',
                getLogStyles(log.level)
              )}
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-12 text-gray-500">{formatTime(log.timestamp)}</span>
                <span className="flex-shrink-0 w-4 text-center">{getLogIcon(log.level)}</span>
                <div className="flex-1 min-w-0">
                  <div className="break-words">{log.message}</div>
                  {log.data !== undefined && log.data !== null && (
                    <pre className="mt-1 text-xs opacity-75 overflow-x-auto">
                      {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Command Input */}
      <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center gap-2">
        <span className="text-blue-400">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          className="flex-1 bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none"
        />
      </div>
    </div>
  )
}

export default Console
