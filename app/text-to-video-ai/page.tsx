import type { Metadata } from 'next'
import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'

export const metadata: Metadata = {
  title: 'Text to Video AI – Best AI Video Generator from Text',
  description: 'Create stunning videos from text prompts using AI. Compare the best text-to-video AI generators and start creating professional videos in seconds. Free credits available.',
  alternates: {
    canonical: `${getBaseUrl()}/text-to-video-ai`,
  },
  openGraph: {
    title: 'Text to Video AI – Best AI Video Generator from Text',
    description: 'Create stunning videos from text prompts using AI. Compare the best text-to-video AI generators.',
    url: `${getBaseUrl()}/text-to-video-ai`,
    type: 'website',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Text to Video AI – Best AI Video Generator from Text',
  description: 'Create stunning videos from text prompts using AI. Compare the best text-to-video AI generators.',
  url: `${getBaseUrl()}/text-to-video-ai`,
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'Text to Video AI Generator',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free credits for new users',
    },
  },
}

export default function TextToVideoAIPage() {
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
              <span>Text to Video AI</span>
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Best Text to Video AI Tools
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-blue-100/80">
              Transform your text descriptions into professional AI-generated videos. Discover the best text-to-video AI tools and learn how to create stunning videos from simple text prompts.
            </p>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
          <div className="space-y-12">
            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                What is Text to Video AI?
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Text to Video AI is a revolutionary technology that converts written text descriptions into video content. Using advanced artificial intelligence and machine learning, these tools understand your text prompts and generate corresponding video footage.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Whether you&apos;re creating marketing videos, social media content, educational materials, or creative projects, text-to-video AI makes video creation accessible to everyone—no video editing skills required.
                </p>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                How Text to Video AI Works
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-energy-water/10 text-sm font-semibold text-energy-water">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      Write Your Text Prompt
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Describe the video you want to create in detail. Include information about the scene, style, mood, and any specific elements you want to see.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-energy-water/10 text-sm font-semibold text-energy-water">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      AI Processes Your Request
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Advanced AI models analyze your text, understand the context, and generate corresponding video frames and motion.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-energy-water/10 text-sm font-semibold text-energy-water">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      Receive Your Video
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Get your generated video in seconds or minutes, ready to download, share, or use in your projects.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Best Text to Video AI Tools
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  The text-to-video AI market has grown rapidly, with many excellent tools available. Here are some of the best options:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li><strong>OpenAI Sora:</strong> High-quality video generation with impressive realism</li>
                  <li><strong>Runway Gen-3:</strong> Professional-grade tool with advanced controls</li>
                  <li><strong>Pika Labs:</strong> Creative-focused with artistic styles</li>
                  <li><strong>Luma Dream Machine:</strong> Fast generation with good quality</li>
                  <li><strong>Our Platform:</strong> Free text-to-video AI generator with 30 free credits</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Tips for Writing Effective Text Prompts
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  To get the best results from text-to-video AI, follow these prompt writing tips:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Be specific about the scene, setting, and subjects</li>
                  <li>Include style descriptors (cinematic, documentary, animated, etc.)</li>
                  <li>Mention camera movements (aerial shot, close-up, pan, etc.)</li>
                  <li>Specify lighting conditions (golden hour, neon lights, natural light)</li>
                  <li>Add mood and atmosphere descriptions</li>
                  <li>Include technical details (8K, slow motion, depth of field)</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Start Creating Videos from Text
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                Ready to transform your text into videos? Try our free text-to-video AI generator and create professional videos in seconds.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/video"
                  className="inline-flex items-center justify-center rounded-lg bg-energy-water px-6 py-3 text-sm font-medium text-white transition hover:bg-energy-water/90"
                >
                  Create Video from Text
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
                Related Resources
              </h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/blog/text-to-video-ai-free" className="text-energy-water hover:underline">
                    Free Text to Video AI Tools
                  </Link>
                </li>
                <li>
                  <Link href="/ai-video-generator" className="text-energy-water hover:underline">
                    AI Video Generator Guide
                  </Link>
                </li>
                <li>
                  <Link href="/blog/ai-video-generator-for-youtube" className="text-energy-water hover:underline">
                    AI Video Generator for YouTube
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

