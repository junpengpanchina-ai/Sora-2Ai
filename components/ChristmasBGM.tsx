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
      audioRef.current = new Audio('/sounds/christmas-bgm.mp3')
      audioRef.current.loop = true
      audioRef.current.volume = 0.3
      audioRef.current.preload = 'auto'

      // Handle audio errors gracefully (file might not exist yet)
      audioRef.current.addEventListener('error', () => {
        console.warn('Christmas BGM file not found. Please add /public/sounds/christmas-bgm.mp3')
      })
    }

    // Try to play audio (may be blocked by browser autoplay policy)
    const tryPlay = async () => {
      if (audioRef.current) {
        try {
          await audioRef.current.play()
        } catch {
          // Autoplay blocked - audio will play on user interaction
          console.log('Autoplay blocked. Audio will play on user interaction.')
        }
      }
    }

    // Try to play after a small delay to ensure audio is loaded
    const timeoutId = setTimeout(tryPlay, 500)

    // Also try on user interaction
    const handleInteraction = () => {
      tryPlay()
    }

    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('keydown', handleInteraction, { once: true })

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [enabled])

  return null
}

