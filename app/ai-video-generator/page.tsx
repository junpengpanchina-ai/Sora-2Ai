import type { Metadata } from 'next'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'

export const metadata: Metadata = {
  title: 'AI Video Generator – Create Professional Videos with AI',
  description: 'Generate professional AI videos instantly. Compare the best AI video generators and create stunning videos for marketing, social media, YouTube, and more. Free credits available.',
  alternates: {
    canonical: `${getBaseUrl()}/ai-video-generator`,
  },
  openGraph: {
    title: 'AI Video Generator – Create Professional Videos with AI',
    description: 'Generate professional AI videos instantly. Compare the best AI video generators.',
    url: `${getBaseUrl()}/ai-video-generator`,
    type: 'website',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'AI Video Generator – Create Professional Videos with AI',
  description: 'Generate professional AI videos instantly. Compare the best AI video generators.',
  url: `${getBaseUrl()}/ai-video-generator`,
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'AI Video Generator',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
  },
}

export default function AIVideoGeneratorPage() {
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
              <span>AI Video Generator</span>
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              AI Video Generator – Create Professional Videos Instantly
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-blue-100/80">
              Discover the best AI video generators for creating professional videos. Compare features, pricing, and use cases to find the perfect tool for your needs.
            </p>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
          <div className="space-y-12">
            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                What is an AI Video Generator?
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  An AI video generator is a tool that uses artificial intelligence to create video content automatically. These tools can generate videos from text prompts, images, or other inputs, making video creation accessible to everyone regardless of technical skills.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  AI video generators are revolutionizing content creation, enabling marketers, creators, educators, and businesses to produce high-quality videos quickly and cost-effectively.
                </p>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Best AI Video Generators
              </h2>
              <div className="space-y-6">
                <div className="border-l-4 border-energy-water pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    OpenAI Sora
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    OpenAI&apos;s Sora is one of the most advanced AI video generators, producing highly realistic videos from text prompts. It&apos;s known for its impressive quality and attention to detail.
                  </p>
                </div>

                <div className="border-l-4 border-energy-water pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Runway Gen-3
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Runway offers professional-grade AI video generation with advanced motion controls and style options. It&apos;s popular among professional creators and marketers.
                  </p>
                </div>

                <div className="border-l-4 border-energy-water pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Pika Labs
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Pika Labs focuses on creative and artistic video generation, offering unique styles and creative tools for content creators.
                  </p>
                </div>

                <div className="border-l-4 border-energy-water pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Our Platform
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    A free AI video generator that offers 30 free credits for new users. Create professional videos from text prompts with no credit card required.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Use Cases for AI Video Generators
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Marketing & Advertising
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Create promotional videos, product demos, and ad content quickly and cost-effectively.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Social Media Content
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Generate engaging videos for TikTok, Instagram, YouTube Shorts, and other platforms.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Educational Content
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Create instructional videos, explainer content, and educational materials.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Creative Projects
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Explore artistic video creation, experimental content, and creative storytelling.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Features to Look for in AI Video Generators
              </h2>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong>Video Quality:</strong> Resolution, frame rate, and overall visual quality</li>
                <li><strong>Generation Speed:</strong> How quickly videos are created</li>
                <li><strong>Customization:</strong> Style options, aspect ratios, duration controls</li>
                <li><strong>Ease of Use:</strong> User-friendly interface and workflow</li>
                <li><strong>Pricing:</strong> Free tiers, affordable plans, and value for money</li>
                <li><strong>Commercial Use:</strong> Licensing options for commercial projects</li>
              </ul>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Start Creating AI Videos
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                Ready to create professional AI videos? Try our free AI video generator and get 30 free credits to start.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/video"
                  className="inline-flex items-center justify-center rounded-lg bg-energy-water px-6 py-3 text-sm font-medium text-white transition hover:bg-energy-water/90"
                >
                  Generate Video Now
                </Link>
                <Link
                  href="/text-to-video-ai"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Learn About Text to Video AI
                </Link>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Related Resources
              </h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/blog/ai-video-generator-without-watermark" className="text-energy-water hover:underline">
                    AI Video Generator Without Watermark
                  </Link>
                </li>
                <li>
                  <Link href="/blog/ai-video-generator-for-marketing" className="text-energy-water hover:underline">
                    AI Video Generator for Marketing
                  </Link>
                </li>
                <li>
                  <Link href="/blog/ai-video-generator-for-youtube" className="text-energy-water hover:underline">
                    AI Video Generator for YouTube
                  </Link>
                </li>
                <li>
                  <Link href="/sora-alternative" className="text-energy-water hover:underline">
                    Best Sora Alternatives
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

