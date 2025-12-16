import type { Metadata } from 'next'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'

export const metadata: Metadata = {
  title: 'Sora Alternative – Best AI Video Generators Like OpenAI Sora',
  description: 'Find the best Sora alternatives for AI video generation. Compare top text-to-video AI tools like Runway, Pika, Luma, and more. Create professional videos from text prompts.',
  alternates: {
    canonical: `${getBaseUrl()}/sora-alternative`,
  },
  openGraph: {
    title: 'Sora Alternative – Best AI Video Generators Like OpenAI Sora',
    description: 'Find the best Sora alternatives for AI video generation. Compare top text-to-video AI tools and create professional videos from text prompts.',
    url: `${getBaseUrl()}/sora-alternative`,
    type: 'website',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Sora Alternative – Best AI Video Generators Like OpenAI Sora',
  description: 'Find the best Sora alternatives for AI video generation. Compare top text-to-video AI tools.',
  url: `${getBaseUrl()}/sora-alternative`,
  mainEntity: {
    '@type': 'ItemList',
    name: 'Best Sora Alternatives',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Runway Gen-3',
        description: 'Professional AI video generation tool',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Pika Labs',
        description: 'AI video generator with creative tools',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Luma Dream Machine',
        description: 'Fast AI video generation platform',
      },
    ],
  },
}

export default function SoraAlternativePage() {
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
              <span>Sora Alternative</span>
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Best Sora Alternatives in 2025
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-blue-100/80">
              Looking for OpenAI Sora alternatives? Discover the best text-to-video AI tools that let you create professional videos from text prompts. Compare features, pricing, and quality of top Sora competitors.
            </p>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
          <div className="space-y-12">
            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Why Look for Sora Alternatives?
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  OpenAI Sora has set a high bar for AI video generation, but it&apos;s not always accessible or available. Whether you need a free alternative, different features, or simply want to explore other options, there are excellent Sora competitors that can help you create stunning videos from text.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  This guide covers the best Sora alternatives, comparing their strengths, pricing, and use cases to help you find the perfect AI video generator for your needs.
                </p>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Top Sora Alternatives in 2025
              </h2>
              <div className="space-y-6">
                <div className="border-l-4 border-energy-water pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    1. Runway Gen-3
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Runway is one of the most popular Sora alternatives, offering professional-grade AI video generation. It features advanced motion control, style consistency, and high-quality output suitable for commercial use.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    <li>Professional video quality</li>
                    <li>Advanced motion controls</li>
                    <li>Multiple video styles</li>
                    <li>Commercial licensing available</li>
                  </ul>
                </div>

                <div className="border-l-4 border-energy-water pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    2. Pika Labs
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Pika Labs offers creative AI video generation with a focus on artistic and cinematic results. It&apos;s great for creators who want more control over the creative process.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    <li>Creative video styles</li>
                    <li>User-friendly interface</li>
                    <li>Active community</li>
                    <li>Regular feature updates</li>
                  </ul>
                </div>

                <div className="border-l-4 border-energy-water pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    3. Luma Dream Machine
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Luma Dream Machine is known for fast generation times and high-quality results. It&apos;s an excellent choice for users who need quick turnaround times.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    <li>Fast generation speed</li>
                    <li>High-quality output</li>
                    <li>Easy to use</li>
                    <li>Free tier available</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                How to Choose the Right Sora Alternative
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  When choosing a Sora alternative, consider these factors:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                  <li><strong>Video Quality:</strong> Compare output quality and resolution options</li>
                  <li><strong>Generation Speed:</strong> Some tools are faster than others</li>
                  <li><strong>Pricing:</strong> Look for free tiers or affordable plans</li>
                  <li><strong>Features:</strong> Motion control, style options, aspect ratios</li>
                  <li><strong>Use Case:</strong> Commercial vs. personal, specific industries</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Start Creating Videos Today
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                Ready to create AI videos? Try our free text-to-video AI generator and see how it compares to Sora and other alternatives.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/video"
                  className="inline-flex items-center justify-center rounded-lg bg-energy-water px-6 py-3 text-sm font-medium text-white transition hover:bg-energy-water/90"
                >
                  Create Video Now
                </Link>
                <Link
                  href="/compare"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Compare Tools
                </Link>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Related Resources
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
                  <Link href="/blog/best-sora-alternatives" className="text-energy-water hover:underline">
                    Best Sora Alternatives for Creators
                  </Link>
                </li>
                <li>
                  <Link href="/text-to-video-ai" className="text-energy-water hover:underline">
                    Text to Video AI Tools Guide
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

