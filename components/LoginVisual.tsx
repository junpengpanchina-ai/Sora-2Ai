'use client'

import { useEffect, useState } from 'react'

/**
 * LoginVisual - Lazy-loaded visual effects for login page
 * This component loads visual effects only after initial render to improve LCP
 */
export default function LoginVisual() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Delay visual effects to prioritize content rendering
    const timer = setTimeout(() => {
      setMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    // Return minimal background during initial render
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="login-visual login-visual--canvas">
          <div className="login-visual__grid" />
        </div>
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="login-visual login-visual--canvas">
        <div className="login-visual__grid" />
        <div className="login-visual__glow" />
        <div className="login-visual__orb" />
        <div className="login-visual__orb login-visual__orb--small" />
        <div className="login-visual__ring" />
        <div className="login-visual__ring login-visual__ring--delay" />
        <div className="login-visual__wave" />
        <span className="login-visual__spark login-visual__spark--one" />
        <span className="login-visual__spark login-visual__spark--two" />
        <span className="login-visual__spark login-visual__spark--three" />
      </div>
    </div>
  )
}

