'use client'

import { useEffect, useState } from 'react'

/**
 * CosmicBackground - Lazy-loaded background effects for better LCP
 * Loads visual effects only after initial render to prioritize content rendering
 */
export default function CosmicBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Delay visual effects to prioritize content rendering
    const timer = setTimeout(() => {
      setMounted(true)
    }, 150)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    // Return minimal background during initial render
    return (
      <div className="absolute inset-0 bg-[#050b18]" aria-hidden="true" />
    )
  }

  return (
    <>
      <div className="cosmic-space absolute inset-0" aria-hidden="true" />
      <div className="cosmic-glow absolute inset-0" aria-hidden="true" />
      <div className="cosmic-stars absolute inset-0" aria-hidden="true" />
      <div className="cosmic-noise absolute inset-0" aria-hidden="true" />
    </>
  )
}

