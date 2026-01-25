import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Sora Alternative – Best AI Video Generators Like OpenAI Sora',
    template: '%s | Best Sora Alternative',
  },
  description: 'Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today.',
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
    siteName: 'Best Sora Alternative',
    title: 'Sora Alternative – Best AI Video Generators Like OpenAI Sora',
    description: 'Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today.',
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
        {/* Performance optimization - DNS prefetch and preconnect for R2 CDN */}
        <link rel="dns-prefetch" href="https://pub-2868c824f92441499577980a0b61114c.r2.dev" />
        <link rel="preconnect" href="https://pub-2868c824f92441499577980a0b61114c.r2.dev" crossOrigin="anonymous" />
        
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
              name: 'Best Sora Alternative',
              url: 'https://sora2aivideos.com',
              logo: 'https://sora2aivideos.com/icon.svg',
              description: 'Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.',
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
              name: 'Best Sora Alternative',
              url: 'https://sora2aivideos.com',
              description: 'Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.',
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
                        // Use Array.from to avoid iterating over a live NodeList that might change
                        Array.from(elements).forEach(el => {
                          try {
                            // Check if element is still connected to DOM
                            if (!el.isConnected) {
                              return;
                            }
                            
                            // Find parent container and remove
                            let container = el;
                            for (let i = 0; i < 5; i++) {
                              container = container?.parentElement || null;
                              if (!container) break;
                              if (container.classList && container.classList.toString().includes('tyGEe93XNeNoND3S3feO')) {
                                // Check if container is still connected before removing
                                if (container.isConnected) {
                                  container.remove();
                                }
                                return;
                              }
                            }
                            // If container not found, remove element directly (ensure it's still connected)
                            if (el.isConnected) {
                              el.remove();
                            }
                          } catch (elementError) {
                            // Ignore errors for individual elements
                            console.debug('Element removal error (safe to ignore):', elementError);
                          }
                        });
                      } catch (e) {
                        // Ignore errors, avoid interfering with React's normal rendering
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
                  // 使用防抖避免频繁执行，并添加错误边界
                  let timeoutId = null;
                  let observer = null;
                  
                  const debouncedHideToolbar = () => {
                    if (timeoutId) {
                      clearTimeout(timeoutId);
                    }
                    timeoutId = setTimeout(() => {
                      try {
                        // Check if document still exists and is ready
                        if (!document || !document.body) {
                          return;
                        }
                        hideToolbar();
                      } catch (e) {
                        // Silently ignore errors to prevent React rendering issues
                        // These errors are harmless and occur during React's concurrent rendering
                        if (process.env.NODE_ENV === 'development') {
                          console.debug('Toolbar removal error (safe to ignore):', e);
                        }
                      }
                    }, 200); // Increased debounce time to reduce frequency
                  };
                  
                  try {
                    if (document.body) {
                      observer = new MutationObserver((mutations) => {
                        // Only process if mutations actually contain relevant elements
                        const hasRelevantMutations = mutations.some(mutation => {
                          if (mutation.type === 'childList') {
                            const addedNodes = Array.from(mutation.addedNodes);
                            return addedNodes.some(node => 
                              node.nodeType === 1 && // Element node
                              (node.classList?.toString().includes('tyGEe93XNeNoND3S3feO') ||
                               node.querySelector && node.querySelector('[data-custom-button*="Vercel Toolbar"]'))
                            );
                          }
                          return false;
                        });
                        
                        if (hasRelevantMutations) {
                          debouncedHideToolbar();
                        }
                      });
                      
                      observer.observe(document.body, { 
                        childList: true, 
                        subtree: true,
                        attributes: false, // Disable attribute observation to reduce calls
                      });
                    }
                  } catch (observerError) {
                    // Silently fail if observer cannot be created
                    if (process.env.NODE_ENV === 'development') {
                      console.debug('MutationObserver creation error (safe to ignore):', observerError);
                    }
                  }
                  
                  // Disconnect observer on page unload to prevent errors during navigation
                  const handleBeforeUnload = () => {
                    try {
                      if (observer) {
                        observer.disconnect();
                        observer = null;
                      }
                      if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                      }
                    } catch (e) {
                      // Ignore cleanup errors
                    }
                  };
                  window.addEventListener('beforeunload', handleBeforeUnload);
                  
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
            <div className="mx-auto w-full max-w-7xl space-y-4">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
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
              {/* Data Usage Transparency - Required by Google OAuth App Homepage Requirements */}
              <div className="border-t border-energy-gold-outline/30 pt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                <p>
                  <strong>Data Usage Transparency:</strong> We use Google Sign-In to securely authenticate your account. We only request your email address and basic profile information (name, profile picture) to create your account and provide personalized video generation services. Your data is encrypted and stored securely. For more information, please review our{' '}
                  <Link
                    href="/privacy"
                    className="font-medium underline-offset-4 hover:underline text-energy-deep dark:text-energy-soft"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
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
