'use client'

import { useEffect } from 'react'
import Console from '@/components/Console'

export default function ConsolePage() {
  useEffect(() => {
    // window.consoleLog is now available immediately (placeholder or real)
    if (typeof window !== 'undefined' && window.consoleLog) {
      const consoleLog = window.consoleLog
      
      // 示例：添加一些初始日志
      consoleLog.info('Console initialized')
      consoleLog.log('Welcome to the Console!')
      consoleLog.warn('This is a warning message')
      consoleLog.error('This is an error message')
      consoleLog.debug('Debug information', { timestamp: new Date().toISOString() })
      
      // 模拟一些日志
      setTimeout(() => {
        consoleLog.info('System ready')
      }, 1000)
      
      setTimeout(() => {
        consoleLog.log('You can type commands in the input below')
      }, 2000)
    }
  }, [])

  const handleCommand = (command: string) => {
    // 自定义命令处理
    if (typeof window !== 'undefined' && window.consoleLog) {
      const consoleLog = window.consoleLog
      
      if (command.startsWith('help')) {
        consoleLog.info('Available commands:')
        consoleLog.log('  help - Show this help message')
        consoleLog.log('  clear - Clear the console')
        consoleLog.log('  time - Show current time')
        consoleLog.log('  eval <code> - Evaluate JavaScript code')
      } else if (command.startsWith('time')) {
        consoleLog.log(`Current time: ${new Date().toLocaleString()}`)
      } else if (command.startsWith('clear')) {
        // Clear is handled by the component itself
        consoleLog.info('Console cleared')
      } else {
        // Try to evaluate as JavaScript
        try {
          const result = eval(command)
          if (result !== undefined) {
            consoleLog.log(String(result))
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          consoleLog.error(`Error: ${errorMessage}`)
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">Console Demo</h1>
        <div className="bg-gray-900 rounded-lg p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Usage</h2>
          <p className="text-gray-400 mb-4">
            This is a browser-like console component. You can:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4">
            <li>View logs with different levels (log, info, warn, error, debug)</li>
            <li>Filter logs by level or search text</li>
            <li>Execute commands in the input field</li>
            <li>Use arrow keys to navigate command history</li>
            <li>Clear all logs with the Clear button</li>
          </ul>
          <div className="bg-gray-800 rounded p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Try these commands:</h3>
            <code className="text-xs text-gray-400 block mb-1">help</code>
            <code className="text-xs text-gray-400 block mb-1">time</code>
            <code className="text-xs text-gray-400 block mb-1">2 + 2</code>
            <code className="text-xs text-gray-400 block">Math.PI</code>
          </div>
          <div className="bg-gray-800 rounded p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Programmatic usage:</h3>
            <pre className="text-xs text-gray-400 overflow-x-auto">
{`// In your code:
window.consoleLog.info('Info message')
window.consoleLog.warn('Warning message')
window.consoleLog.error('Error message')
window.consoleLog.log('Log message', { data: 'optional' })
window.consoleLog.debug('Debug message')`}
            </pre>
          </div>
        </div>
      </div>
      
      <Console onCommand={handleCommand} />
    </div>
  )
}
