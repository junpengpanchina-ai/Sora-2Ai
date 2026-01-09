import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import LoginVisual from '@/components/LoginVisual'

// Lazy load debug panel
const LoginDebugPanel = dynamic(() => import('@/components/LoginDebugPanel'), {
  ssr: false,
})

// Lazy load error logger
const OAuthErrorLogger = dynamic(() => import('@/components/OAuthErrorLogger'), {
  ssr: false,
})

// Lazy load login components to improve initial page load
// Temporarily disabled until Google OAuth configuration is fixed
// const LoginButton = dynamic(() => import('@/components/LoginButton'), {
//   loading: () => (
//     <div className="w-full h-12 rounded-xl bg-white/10 animate-pulse" />
//   ),
// })

const EmailLoginForm = dynamic(() => import('@/components/EmailLoginForm'), {
  loading: () => (
    <div className="w-full h-32 rounded-xl bg-white/10 animate-pulse" />
  ),
})

export const metadata: Metadata = {
  title: 'Sign In - Login to Create AI Videos',
  description: 'Login to Sora2Ai Videos with Google authentication or email magic link. New users receive 30 free credits immediately - no credit card required. Start generating AI videos now.',
}

interface LoginPageProps {
  searchParams?: {
    error?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const errorMessage = searchParams?.error

  return (
    <>
      {/* 🔥 防回归护栏 #2: OAuth 错误可观测性 */}
      <OAuthErrorLogger error={errorMessage} pathname="/login" />
    <div className="relative min-h-screen overflow-hidden bg-[#030b2c] text-white">
      {/* Lazy load visual effects to improve LCP */}
      <LoginVisual />

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
            Sign in with your email to create, monitor, and ship AI videos inside a single
            starfield console that keeps everything encrypted end-to-end.
          </p>
          
          {/* Data Usage Transparency - Required by Google OAuth App Homepage Requirements */}
          <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100/90 backdrop-blur-sm">
            <p className="text-center leading-relaxed">
              <strong className="font-semibold text-blue-100">Data Usage Transparency:</strong> We use Google Sign-In to securely authenticate your account. We only request your email address and basic profile information (name, profile picture) to create your account and provide personalized video generation services. Your data is encrypted and stored securely. For more information, please review our{' '}
              <Link
                href="/privacy"
                className="font-semibold underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          
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
              <strong className="font-semibold">⚠️ Sign in failed:</strong>
              <p className="mt-2">{errorMessage}</p>
              <p className="mt-2 text-xs opacity-90">
                Having trouble? Try using email magic link instead, or check your browser settings.
              </p>
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-4">
              {/* Google Sign-in temporarily disabled - Immediate fix for access_denied issue */}
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 flex-shrink-0 text-yellow-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-100 mb-1">
                      Google sign-in is temporarily unavailable.
                    </p>
                    <p className="text-xs text-yellow-100/90">
                      Please use Email Magic Link to continue. We&apos;ll restore Google sign-in shortly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Google login button temporarily hidden until OAuth configuration is fixed */}
              {/* Uncomment below and remove the warning above once Google OAuth is properly configured */}
              {/* <LoginButton className="celestial-cta shadow-[0_30px_100px_-45px_rgba(59,130,246,1)] hover:-translate-y-1" /> */}
              
              {/* Divider - only show when Google login is enabled */}
              {/* <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#030b2c] px-2 text-white/60">Or continue with</span>
                </div>
              </div> */}

              {/* Email Magic Link Login */}
              <EmailLoginForm />
              
              {/* Data Usage Transparency - Required by Google OAuth App Homepage Requirements */}
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm">
                <p className="text-xs text-blue-100 text-center leading-relaxed">
                  <strong className="font-semibold text-blue-100">Data Usage Transparency:</strong> We use Google Sign-In to securely authenticate your account. We only request your email address and basic profile information (name, profile picture) to create your account and provide personalized video generation services. Your data is encrypted and stored securely. For more information, please review our{' '}
                  <Link
                    href="/privacy"
                    className="font-semibold underline-offset-4 hover:underline text-blue-100"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
              
              {/* Free Trial Info */}
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 backdrop-blur-sm">
                <p className="text-xs text-green-100 text-center leading-relaxed">
                  <strong className="font-semibold">Try Sora2 Free:</strong> Sign in and receive{' '}
                  <strong className="font-semibold">30 credits immediately</strong> — 
                  no payment needed, no credit card required. 
                  Your email is used solely to create your account.
                </p>
              </div>
              
              {/* Debug Panel (only shown with ?debug=1 or in dev mode) */}
              <LoginDebugPanel />
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
            <span>Email sign-in · Encrypted</span>
          </div>
          <div className="celestial-status__item flex items-center gap-2">
            <span className="celestial-status__dot celestial-status__dot--azure" />
            <span>Starfield workspace ready</span>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

