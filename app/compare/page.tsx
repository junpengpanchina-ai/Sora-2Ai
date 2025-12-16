import type { Metadata } from 'next'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'

export const metadata: Metadata = {
  title: 'Sora vs Runway vs Pika vs Luma – AI Video Generator Comparison',
  description: 'Compare the best AI video generators: Sora, Runway, Pika, and Luma. Find out which tool is best for your needs with our detailed comparison of features, pricing, and quality.',
  alternates: {
    canonical: `${getBaseUrl()}/compare`,
  },
  openGraph: {
    title: 'Sora vs Runway vs Pika vs Luma – AI Video Generator Comparison',
    description: 'Compare the best AI video generators: Sora, Runway, Pika, and Luma.',
    url: `${getBaseUrl()}/compare`,
    type: 'website',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Sora vs Runway vs Pika vs Luma – AI Video Generator Comparison',
  description: 'Compare the best AI video generators: Sora, Runway, Pika, and Luma.',
  url: `${getBaseUrl()}/compare`,
  mainEntity: {
    '@type': 'ComparisonTable',
    name: 'AI Video Generator Comparison',
  },
}

export default function ComparePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="bg-slate-50 dark:bg-gray-950">
        <div className="relative overflow-hidden border-b border-white/20 bg-gradient-to-br from-[#050b18] via-[#09122C] to-[#050b18]">
          <div className="cosmic-space absolute inset-0 opacity-60" aria-hidden="true" />
          <div className="cosmic-glow absolute inset-0 opacity-50" aria-hidden="true" />
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 text-white">
            <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-energy-water">
              <span>AI Video Generator Comparison</span>
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Sora vs Runway vs Pika vs Luma – Complete Comparison
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-blue-100/80">
              Compare the top AI video generators side-by-side. Find out which tool offers the best features, quality, and value for your video creation needs.
            </p>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
          <div className="space-y-12">
            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Quick Comparison Table
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Feature</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Sora</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Runway</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Pika</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Luma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Video Quality</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Excellent</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Excellent</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Very Good</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Very Good</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Generation Speed</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Medium</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Fast</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Fast</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Very Fast</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Ease of Use</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Good</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Excellent</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Excellent</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Excellent</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Free Tier</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Limited</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Yes</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Yes</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Yes</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Commercial Use</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Restricted</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Available</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Available</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Available</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Detailed Comparisons
              </h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Sora vs Runway
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Both Sora and Runway produce high-quality videos, but Runway offers more control and is more accessible. Runway has better motion controls and style options, while Sora excels in realism.
                  </p>
                  <Link href="/blog/sora-vs-runway" className="text-energy-water hover:underline text-sm font-medium">
                    Read full comparison →
                  </Link>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Sora vs Pika
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Pika Labs focuses on creative and artistic video generation, while Sora prioritizes realism. Pika offers more creative tools and styles, making it better for artistic projects.
                  </p>
                  <Link href="/blog/sora-vs-pika" className="text-energy-water hover:underline text-sm font-medium">
                    Read full comparison →
                  </Link>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Sora vs Luma
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Luma Dream Machine is known for its speed, generating videos faster than Sora. While Sora may have slightly better quality, Luma&apos;s speed makes it ideal for quick iterations.
                  </p>
                  <Link href="/blog/sora-vs-luma" className="text-energy-water hover:underline text-sm font-medium">
                    Read full comparison →
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Which Tool Should You Choose?
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  The best AI video generator depends on your specific needs:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li><strong>For Professional Use:</strong> Runway offers the best balance of quality and control</li>
                  <li><strong>For Creative Projects:</strong> Pika Labs provides more artistic options</li>
                  <li><strong>For Speed:</strong> Luma Dream Machine generates videos fastest</li>
                  <li><strong>For Maximum Quality:</strong> Sora produces the most realistic results (when available)</li>
                  <li><strong>For Free Access:</strong> Our platform offers 30 free credits to get started</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Try Our Free AI Video Generator
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                Compare our platform with these tools yourself. Get 30 free credits and start creating videos today.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/video"
                  className="inline-flex items-center justify-center rounded-lg bg-energy-water px-6 py-3 text-sm font-medium text-white transition hover:bg-energy-water/90"
                >
                  Start Creating Videos
                </Link>
                <Link
                  href="/sora-alternative"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  View Sora Alternatives
                </Link>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Related Comparison Articles
              </h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/blog/sora-vs-runway" className="text-energy-water hover:underline">
                    Sora vs Runway: Complete Comparison
                  </Link>
                </li>
                <li>
                  <Link href="/blog/sora-vs-pika" className="text-energy-water hover:underline">
                    Sora vs Pika: Which is Better?
                  </Link>
                </li>
                <li>
                  <Link href="/blog/sora-vs-luma" className="text-energy-water hover:underline">
                    Sora vs Luma: Speed vs Quality
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </main>
      </div>
    </>
  )
}

