import LoginButton from '@/components/LoginButton'
import Link from 'next/link'

interface LoginPageProps {
  searchParams?: {
    error?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const errorMessage = searchParams?.error

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030b2c] text-white">
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

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-3xl text-center space-y-6">
          <div className="celestial-chip inline-flex items-center gap-2 rounded-full px-5 py-2 text-[0.65rem] uppercase tracking-[0.45em]">
            Sora Control Hub
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.9)]" />
          </div>
          <h1 className="celestial-heading text-4xl font-semibold leading-tight sm:text-5xl">
            Welcome to Sora2Ai
          </h1>
          <p className="celestial-subtitle mx-auto max-w-2xl text-base sm:text-lg">
            Sign in with your Google account to create, monitor, and ship AI videos inside a single
            starfield console that keeps everything encrypted end-to-end.
          </p>
        </div>

        <div className="mt-12 w-full max-w-xl rounded-[32px] border border-white/20 bg-white/10 p-10 shadow-[0_45px_140px_-60px_rgba(59,130,246,1)] backdrop-blur-2xl">
          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
              <strong className="font-semibold">Sign in failed:</strong> {errorMessage}
            </div>
          )}

          <div className="space-y-6">
            <LoginButton className="celestial-cta shadow-[0_30px_100px_-45px_rgba(59,130,246,1)] hover:-translate-y-1" />
            <p className="text-center text-xs leading-relaxed text-blue-100/80">
              By signing in you agree to our{' '}
              <Link
                href="/terms"
                className="font-semibold text-white underline-offset-4 hover:text-sky-200 hover:underline"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="font-semibold text-white underline-offset-4 hover:text-sky-200 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-blue-100/75">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
            <span>Google sign-in · Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
            <span>Starfield workspace ready</span>
          </div>
        </div>
      </div>
    </div>
  )
}

