import type { Metadata } from 'next'
import LoginButton from '@/components/LoginButton'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign In - Login to Create AI Videos',
  description: 'Login to Sora2Ai Videos with Google authentication. New users receive 30 free credits immediately - no credit card required. Start generating AI videos now.',
}

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
          
          {/* SEO-friendly text content for better text-HTML ratio */}
          <section className="sr-only">
            <h2>About Sora2Ai Videos Platform</h2>
            <p>
              Sora2Ai Videos is a cutting-edge AI video generation platform powered by OpenAI Sora 2.0 technology. 
              Our platform enables users to transform text descriptions into stunning, professional-quality videos 
              in seconds. Whether you&apos;re creating marketing content, social media videos, educational materials, 
              or creative projects, Sora2Ai makes video generation accessible to everyone.
            </p>
            <p>
              When you sign in with your Google account, you&apos;ll receive 30 free credits immediately - no credit 
              card required. Our secure authentication system ensures your data is protected with end-to-end encryption. 
              The platform supports various video styles including cinematic shots, documentary footage, fashion content, 
              nature scenes, sports highlights, and abstract visuals.
            </p>
            <p>
              Getting started is simple: sign in with Google, receive your free credits, and begin creating videos 
              right away. Our intuitive interface guides you through the video generation process, from writing effective 
              prompts to downloading your finished videos. All videos are generated using advanced AI technology to ensure 
              high quality and creative results that match your vision.
            </p>
            <h3>Key Features</h3>
            <ul>
              <li>AI-powered video generation using OpenAI Sora 2.0</li>
              <li>Multiple video styles and categories</li>
              <li>Fast generation times, typically completed in minutes</li>
              <li>High-quality output suitable for professional use</li>
              <li>Secure Google authentication with encrypted data</li>
              <li>Free credits for new users - no credit card required</li>
            </ul>
          </section>
        </div>

        <div className="celestial-panel mt-12 w-full max-w-xl p-10">
          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
              <strong className="font-semibold">Sign in failed:</strong> {errorMessage}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-4">
              <LoginButton className="celestial-cta shadow-[0_30px_100px_-45px_rgba(59,130,246,1)] hover:-translate-y-1" />
              
              {/* Free Trial Info */}
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 backdrop-blur-sm">
                <p className="text-xs text-green-100 text-center leading-relaxed">
                  <strong className="font-semibold">Try Sora2 Free:</strong> Sign in and receive{' '}
                  <strong className="font-semibold">30 credits immediately</strong> — 
                  no payment needed, no credit card required. 
                  Your email is used solely to create your account.
                </p>
              </div>
            </div>
            
            <p className="celestial-terms text-center text-xs leading-relaxed">
              By signing in you agree to our{' '}
              <Link
                href="/terms"
                className="celestial-link font-semibold underline-offset-4 hover:underline"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="celestial-link font-semibold underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="celestial-status mt-10 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="celestial-status__item flex items-center gap-2">
            <span className="celestial-status__dot celestial-status__dot--emerald" />
            <span>Google sign-in · Encrypted</span>
          </div>
          <div className="celestial-status__item flex items-center gap-2">
            <span className="celestial-status__dot celestial-status__dot--azure" />
            <span>Starfield workspace ready</span>
          </div>
        </div>
      </div>
    </div>
  )
}

