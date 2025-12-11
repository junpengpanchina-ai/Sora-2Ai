'use client'

import { useEffect, useRef } from 'react'

interface ChristmasBGMProps {
  enabled: boolean
}

export default function ChristmasBGM({ enabled }: ChristmasBGMProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!enabled) {
      // Stop and cleanup audio when disabled
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      return
    }

    // Create and play Christmas background music
    if (!audioRef.current) {
      const audioPath = '/sounds/christmas-bgm.mp3'
      audioRef.current = new Audio(audioPath)
      audioRef.current.loop = true
      audioRef.current.volume = 0.3
      audioRef.current.preload = 'auto'

      // Handle audio errors gracefully (file might not exist yet)
      const handleError = () => {
        console.error('❌ Christmas BGM 文件未找到:', audioPath)
        console.error('💡 请将音频文件添加到: public/sounds/christmas-bgm.mp3')
        console.error('📖 详细说明请查看: ADD_CHRISTMAS_MUSIC.md')
        
        // 尝试直接访问文件来验证路径
        fetch(audioPath, { method: 'HEAD' })
          .then((response) => {
            if (!response.ok) {
              console.error('🔍 文件不存在或无法访问:', audioPath)
              console.error('🔍 HTTP 状态:', response.status, response.statusText)
            }
          })
          .catch((err) => {
            console.error('🔍 无法检查文件:', audioPath, err)
          })
      }

      audioRef.current.addEventListener('error', handleError)

      // 监听加载成功
      audioRef.current.addEventListener('loadeddata', () => {
        console.log('✅ Christmas BGM 加载成功，准备播放')
      })

      // 监听加载开始
      audioRef.current.addEventListener('loadstart', () => {
        console.log('🔄 开始加载 Christmas BGM...')
      })

      // 监听可以播放
      audioRef.current.addEventListener('canplay', () => {
        console.log('🎵 Christmas BGM 可以播放')
      })
    }

    // Try to play audio (may be blocked by browser autoplay policy)
    const tryPlay = async (force = false) => {
      if (!audioRef.current) return
      
      // 如果音频还没准备好，等待加载
      if (audioRef.current.readyState < 2) {
        if (!force) {
          const waitForReady = () => {
            if (audioRef.current && audioRef.current.readyState >= 2) {
              tryPlay(force)
            } else {
              setTimeout(waitForReady, 100)
            }
          }
          waitForReady()
          return
        }
      }

      try {
        // 尝试播放
        await audioRef.current.play()
        console.log('🎵 Christmas BGM 开始播放')
      } catch {
        // Autoplay blocked - audio will play on user interaction
        if (!force) {
          console.log('⚠️ 自动播放被阻止，等待用户交互后播放')
          console.log('💡 用户点击页面任意位置后音乐将开始播放')
        }
      }
    }

    // 策略 1: 尝试静音播放然后取消静音（某些浏览器允许）
    const tryMutedPlay = async () => {
      if (!audioRef.current) return
      try {
        audioRef.current.muted = true
        await audioRef.current.play()
        // 播放成功后取消静音
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.muted = false
            console.log('🎵 Christmas BGM 开始播放（静音后取消）')
          }
        }, 100)
      } catch {
        // 静音播放也失败，等待用户交互
      }
    }

    // 策略 2: 延迟尝试正常播放
    const timeoutId1 = setTimeout(() => tryPlay(false), 300)
    const timeoutId2 = setTimeout(() => tryMutedPlay(), 500)

    // 策略 3: 监听用户交互后立即播放
    const handleInteraction = () => {
      tryPlay(true)
    }

    // 监听多种交互事件
    const events = ['click', 'keydown', 'touchstart', 'mousedown', 'pointerdown']
    events.forEach(eventType => {
      document.addEventListener(eventType, handleInteraction, { once: true, passive: true })
    })

    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      // 清理所有事件监听器
      const events = ['click', 'keydown', 'touchstart', 'mousedown', 'pointerdown']
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleInteraction)
      })
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [enabled])

  return null
}
