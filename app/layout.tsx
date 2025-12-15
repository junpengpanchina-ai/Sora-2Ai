import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Sora2Ai Videos - AI Video Generation Platform',
    template: '%s | Sora2Ai Videos',
  },
  description: 'Sora2Ai Videos - Transform your ideas into stunning AI-generated videos using OpenAI Sora 2.0. Free credits available for new users.',
  icons: {
    icon: '/icon.svg',
  },
  alternates: {
    canonical: 'https://sora2aivideos.com',
    languages: {
      'en': 'https://sora2aivideos.com',
      'en-US': 'https://sora2aivideos.com',
      'ar': 'https://sora2aivideos.com?lang=ar', // Arabic (Saudi Arabia)
      'ar-SA': 'https://sora2aivideos.com?lang=ar-SA', // Saudi Arabic
      'x-default': 'https://sora2aivideos.com',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_SA'],
    url: 'https://sora2aivideos.com',
    siteName: 'Sora2Ai Videos',
    title: 'Sora2Ai Videos - AI Video Generation Platform',
    description: 'Transform your ideas into stunning AI-generated videos using OpenAI Sora 2.0. Free credits available for new users.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Detect language from URL or default to English
  // This will be enhanced by middleware for automatic detection
  const defaultLang = 'en'
  
  return (
    <html lang={defaultLang}>
      <head>
        {/* International SEO - hreflang tags */}
        <link rel="alternate" hrefLang="en" href="https://sora2aivideos.com" />
        <link rel="alternate" hrefLang="en-US" href="https://sora2aivideos.com" />
        <link rel="alternate" hrefLang="ar" href="https://sora2aivideos.com?lang=ar" />
        <link rel="alternate" hrefLang="ar-SA" href="https://sora2aivideos.com?lang=ar-SA" />
        <link rel="alternate" hrefLang="x-default" href="https://sora2aivideos.com" />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Sora2Ai Videos',
              url: 'https://sora2aivideos.com',
              logo: 'https://sora2aivideos.com/icon.svg',
              description: 'AI video generation platform powered by OpenAI Sora 2.0',
              sameAs: [],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                url: 'https://sora2aivideos.com/support',
              },
            }),
          }}
        />
        
        {/* Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Sora2Ai Videos',
              url: 'https://sora2aivideos.com',
              description: 'AI video generation platform powered by OpenAI Sora 2.0',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://sora2aivideos.com/prompts?search={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        
        <Script src="https://js.stripe.com/v3/buy-button.js" strategy="lazyOnload" />
      </head>
      <body>
        {/* 隐藏 Vercel Toolbar（如果出现）- 面向消费者的网站不应显示开发工具 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 隐藏 Vercel Toolbar（生产环境）
                if (typeof window !== 'undefined') {
                  const hideToolbar = () => {
                    // 查找并移除 Vercel Toolbar 相关元素
                    const selectors = [
                      '[data-custom-button*="Layout Shifts"]',
                      '[data-custom-button*="Vercel Toolbar"]',
                      '[aria-label*="Layout Shifts"]',
                      '[aria-label*="Vercel Toolbar"]',
                      '[label*="Layout Shifts"]',
                      '[label*="Vercel Toolbar"]',
                      '.tyGEe93XNeNoND3S3feO', // Vercel Toolbar 容器
                    ];
                    
                    selectors.forEach(selector => {
                      try {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(el => {
                          // 检查元素是否仍在 DOM 中
                          if (!el.isConnected || !el.parentNode) {
                            return;
                          }
                          
                          // 查找父容器并移除
                          let container = el;
                          for (let i = 0; i < 5; i++) {
                            container = container.parentElement;
                            if (!container) break;
                            if (container.classList && container.classList.toString().includes('tyGEe93XNeNoND3S3feO')) {
                              // 检查容器是否仍在 DOM 中
                              if (container.isConnected && container.parentNode) {
                                container.remove();
                              }
                              return;
                            }
                          }
                          // 如果找不到容器，直接移除元素（确保元素仍在 DOM 中）
                          if (el.isConnected && el.parentNode) {
                            el.remove();
                          }
                        });
                      } catch (e) {
                        // 忽略错误，避免干扰 React 的正常渲染
                        console.debug('Toolbar removal error (safe to ignore):', e);
                      }
                    });
                  };
                  
                  // 立即执行
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', hideToolbar);
                  } else {
                    hideToolbar();
                  }
                  
                  // 监听 DOM 变化（Vercel Toolbar 可能延迟加载）
                  // 使用防抖避免频繁执行
                  let timeoutId: ReturnType<typeof setTimeout> | null = null;
                  const debouncedHideToolbar = () => {
                    if (timeoutId) {
                      clearTimeout(timeoutId);
                    }
                    timeoutId = setTimeout(() => {
                      try {
                        hideToolbar();
                      } catch (e) {
                        console.debug('Toolbar removal error (safe to ignore):', e);
                      }
                    }, 100);
                  };
                  
                  const observer = new MutationObserver(debouncedHideToolbar);
                  observer.observe(document.body, { 
                    childList: true, 
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'data-custom-button', 'aria-label']
                  });
                  
                  // 延迟执行（确保捕获所有动态加载的元素）
                  setTimeout(() => {
                    try {
                      hideToolbar();
                    } catch (e) {
                      console.debug('Toolbar removal error (safe to ignore):', e);
                    }
                  }, 500);
                  setTimeout(() => {
                    try {
                      hideToolbar();
                    } catch (e) {
                      console.debug('Toolbar removal error (safe to ignore):', e);
                    }
                  }, 1000);
                  setTimeout(() => {
                    try {
                      hideToolbar();
                    } catch (e) {
                      console.debug('Toolbar removal error (safe to ignore):', e);
                    }
                  }, 2000);
                }
              })();
            `,
          }}
        />
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
