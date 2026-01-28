'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'sora_emergency_repair_start_time'
const DURATION_MS = 24 * 60 * 60 * 1000 // 24小时

/**
 * 紧急修复横幅组件
 * 显示"24小时内紧急修复sora中"的消息，24小时后自动隐藏
 */
export function EmergencyRepairBanner() {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // 只在客户端运行
    if (typeof window === 'undefined') return

    const checkAndSetBanner = () => {
      const storedTime = localStorage.getItem(STORAGE_KEY)
      const now = Date.now()

      if (!storedTime) {
        // 首次显示，记录当前时间
        localStorage.setItem(STORAGE_KEY, now.toString())
        setShouldShow(true)
        return
      }

      const startTime = parseInt(storedTime, 10)
      const elapsed = now - startTime

      if (elapsed < DURATION_MS) {
        // 还在24小时内，显示横幅
        setShouldShow(true)
      } else {
        // 超过24小时，隐藏横幅并清除存储
        setShouldShow(false)
        localStorage.removeItem(STORAGE_KEY)
      }
    }

    checkAndSetBanner()

    // 每分钟检查一次（避免频繁检查）
    const interval = setInterval(checkAndSetBanner, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (!shouldShow) {
    return null
  }

  return (
    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-500"></div>
        <span>24小时内紧急修复sora中</span>
      </div>
    </div>
  )
}
