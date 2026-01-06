'use client'

import { createClient } from '@/lib/supabase/client'
import { setPostLoginRedirect } from '@/lib/auth/post-login-redirect'
import { useState } from 'react'

interface EmailLoginFormProps {
  className?: string
}

export default function EmailLoginForm({ className = '' }: EmailLoginFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || !email.trim()) return

    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      // Persist the post-login destination
      try {
        const params = new URLSearchParams(window.location.search)
        const redirectParam = params.get('redirect')
        const isLoginPage = window.location.pathname === '/login'
        const currentPath = `${window.location.pathname}${window.location.search}`
        const intended = redirectParam || (isLoginPage ? '/' : currentPath) || '/'
        setPostLoginRedirect(intended)
      } catch {
        // ignore
      }

      const redirectTo = `${window.location.origin}/auth/callback`

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      })

      if (signInError) {
        console.error('Magic link error:', signInError)
        setError(signInError.message || 'Failed to send magic link. Please try again.')
        setLoading(false)
        return
      }

      setSent(true)
      setLoading(false)
    } catch (err) {
      console.error('Email login error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-100">
          <p className="font-semibold mb-2">✓ Check your email</p>
          <p>
            We&apos;ve sent a magic link to <strong>{email}</strong>. Click the link in the email to sign in.
          </p>
          <p className="mt-2 text-xs opacity-90">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button
              onClick={() => {
                setSent(false)
                setEmail('')
                setError(null)
              }}
              className="underline font-semibold"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={loading}
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/60 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="w-full rounded-xl bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-lg ring-1 ring-gray-200 transition-all duration-200 hover:bg-gray-50 hover:shadow-xl hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending magic link...
          </span>
        ) : (
          'Send magic link'
        )}
      </button>
      
      <p className="text-xs text-center text-white/60">
        We&apos;ll send you a secure link to sign in. No password needed.
      </p>
    </form>
  )
}

