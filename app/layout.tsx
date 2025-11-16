import type { Metadata } from 'next'
import Link from 'next/link'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sora2Ai Videos - AI Video Generation Platform',
  description: 'Generate high-quality video content easily with Sora2Ai Videos and the latest OpenAI Sora 2.0 model',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script async src="https://js.stripe.com/v3/buy-button.js" />
      </head>
      <body>
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
          <footer className="border-t border-energy-gold-outline bg-white/90 px-4 py-6 text-sm text-gray-600 backdrop-blur dark:border-gray-700 dark:bg-gray-900/85 dark:text-gray-300">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-center sm:text-left">
                This service complies with applicable United States laws and regulations and is offered to enterprise customers. For information about data handling and compliance, please review the following documents.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/terms"
                  className="inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/privacy"
                  className="inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </footer>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
