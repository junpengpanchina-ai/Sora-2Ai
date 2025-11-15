'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setLoading(true)
      
      // Clear client-side session first
      const supabase = createClient()
      await supabase.auth.signOut()

      // Clear all Supabase-related localStorage items
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key)
          }
        })
      }

      // Call server-side logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
      })

      // Force full page reload to clear all state and redirect to home
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      // Even if there's an error, try to redirect to home
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}

