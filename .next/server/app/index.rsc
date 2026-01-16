2:I[9305,["2972","static/chunks/2972-b109712ff3e0f685.js","6137","static/chunks/6137-d1252e602ab3c1b0.js","4609","static/chunks/4609-ae2a8c20f580b208.js","3053","static/chunks/3053-174c24000fb4656d.js","5726","static/chunks/5726-7bd53a9b1c9c680f.js","5492","static/chunks/5492-103b2453c49aba14.js","1931","static/chunks/app/page-04447343b57ef19e.js"],"default"]
3:I[8003,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],""]
5:I[4707,[],""]
6:I[3490,["6137","static/chunks/6137-d1252e602ab3c1b0.js","7601","static/chunks/app/error-6283e7e4c556e134.js"],"default"]
7:I[6423,[],""]
8:I[2972,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],""]
9:I[9197,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],"Analytics"]
a:I[1952,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],"SpeedInsights"]
4:T1e70,
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
            0:["6nQ4wpD8FHsmpo8vfCccF",[[["",{"children":["__PAGE__",{}]},"$undefined","$undefined",true],["",{"children":["__PAGE__",{},[["$L1",[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"WebPage\",\"name\":\"Create High-Quality AI Videos from Text — Fast, Simple, No Editing Skills\",\"description\":\"Generate marketing videos, social media clips, product demos, and explainer videos using AI. No camera. No editing software. Start with 30 free credits.\",\"url\":\"https://sora2aivideos.com\",\"mainEntity\":{\"@type\":\"SoftwareApplication\",\"name\":\"Sora2Ai Video Generator\",\"applicationCategory\":\"MultimediaApplication\",\"operatingSystem\":\"Web\",\"offers\":{\"@type\":\"Offer\",\"price\":\"0\",\"priceCurrency\":\"USD\",\"description\":\"30 free credits for new users\"}}}"}}],["$","section",null,{"className":"sr-only","children":[["$","h2",null,{"children":"Create High-Quality AI Videos from Text — Text to Video AI Generator"}],["$","p",null,{"children":"Looking for the best Sora alternatives? Our platform is one of the top text-to-video AI tools that creates stunning, professional-quality videos from text prompts in seconds. Whether you're creating marketing content, social media videos, educational materials, or creative projects, we make AI video generation accessible to everyone, regardless of technical expertise."}],["$","p",null,{"children":"As a leading Sora alternative, we offer 30 free credits when you sign up - no credit card required. Our platform supports various video styles including cinematic shots, documentary footage, fashion content, nature scenes, sports highlights, and abstract visuals. Each video is generated using advanced AI technology to ensure high quality and creative results that match your vision."}],["$","p",null,{"children":"Our text-to-video AI generator process is simple: enter a detailed text description of the video you want to create, select your preferred aspect ratio and duration, and let our AI do the rest. The platform supports both portrait (9:16) and landscape (16:9) formats, with video durations of 10 or 15 seconds. All videos are generated in high quality and can be downloaded immediately after completion."}],["$","h3",null,{"children":"Why Choose Our Sora Alternative?"}],["$","ul",null,{"children":[["$","li",null,{"children":"Free AI video generator - Get started with 30 free credits"}],["$","li",null,{"children":"Text-to-video AI technology comparable to OpenAI Sora"}],["$","li",null,{"children":"Multiple video styles and categories"}],["$","li",null,{"children":"Fast generation times, typically completed in minutes"}],["$","li",null,{"children":"High-quality output suitable for professional use"}],["$","li",null,{"children":"Easy-to-use interface with prompt templates"}],["$","li",null,{"children":"Flexible pricing plans with credit-based system"}],["$","li",null,{"children":"No watermark on generated videos"}]]}],["$","h3",null,{"children":"Best Sora Alternatives Comparison"}],["$","p",null,{"children":"When comparing Sora alternatives like Runway, Pika, Luma, and our platform, we stand out with our user-friendly interface, competitive pricing, and high-quality output. Our free tier makes it easy to get started, and our credit system ensures you only pay for what you use."}],["$","h3",null,{"children":"Data Usage Transparency"}],["$","p",null,{"children":"We use Google Sign-In to securely authenticate your account. We only request your email address and basic profile information (name, profile picture) to create your account and provide personalized video generation services. Your data is encrypted and stored securely. For more information, please review our Privacy Policy at https://sora2aivideos.com/privacy."}]]}],["$","$L2",null,{"userProfile":null}]],null],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/544674a05c909039.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","children":[["$","head",null,{"children":[["$","link",null,{"rel":"dns-prefetch","href":"https://pub-2868c824f92441499577980a0b61114c.r2.dev"}],["$","link",null,{"rel":"preconnect","href":"https://pub-2868c824f92441499577980a0b61114c.r2.dev","crossOrigin":"anonymous"}],["$","link",null,{"rel":"alternate","hrefLang":"en","href":"https://sora2aivideos.com"}],["$","link",null,{"rel":"alternate","hrefLang":"en-US","href":"https://sora2aivideos.com"}],["$","link",null,{"rel":"alternate","hrefLang":"ar","href":"https://sora2aivideos.com?lang=ar"}],["$","link",null,{"rel":"alternate","hrefLang":"ar-SA","href":"https://sora2aivideos.com?lang=ar-SA"}],["$","link",null,{"rel":"alternate","hrefLang":"x-default","href":"https://sora2aivideos.com"}],["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"Organization\",\"name\":\"Best Sora Alternative\",\"url\":\"https://sora2aivideos.com\",\"logo\":\"https://sora2aivideos.com/icon.svg\",\"description\":\"Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.\",\"sameAs\":[],\"contactPoint\":{\"@type\":\"ContactPoint\",\"contactType\":\"Customer Support\",\"url\":\"https://sora2aivideos.com/support\"}}"}}],["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"WebSite\",\"name\":\"Best Sora Alternative\",\"url\":\"https://sora2aivideos.com\",\"description\":\"Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.\",\"potentialAction\":{\"@type\":\"SearchAction\",\"target\":{\"@type\":\"EntryPoint\",\"urlTemplate\":\"https://sora2aivideos.com/prompts?search={search_term_string}\"},\"query-input\":\"required name=search_term_string\"}}"}}],["$","$L3",null,{"src":"https://js.stripe.com/v3/buy-button.js","strategy":"lazyOnload"}]]}],["$","body",null,{"children":[["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$4"}}],["$","div",null,{"className":"flex min-h-screen flex-col","children":[["$","main",null,{"className":"flex-1","children":["$","$L5",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$6","errorStyles":[],"errorScripts":[],"template":["$","$L7",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]}],["$","footer",null,{"className":"border-t border-energy-gold-outline bg-white/90 px-4 py-6 text-sm text-gray-600 backdrop-blur dark:border-gray-700 dark:bg-gray-900/85 dark:text-gray-300","children":["$","div",null,{"className":"mx-auto w-full max-w-7xl space-y-4","children":[["$","div",null,{"className":"flex flex-col items-center justify-between gap-4 sm:flex-row","children":[["$","p",null,{"className":"text-center sm:text-left","children":"This service complies with applicable United States laws and regulations and is offered to enterprise customers. For information about data handling and compliance, please review the following documents."}],["$","div",null,{"className":"flex flex-wrap items-center gap-3","children":[["$","$L8",null,{"href":"/terms","className":"inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800","children":"Terms of Service"}],["$","$L8",null,{"href":"/privacy","className":"inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800","children":"Privacy Policy"}]]}]]}],["$","div",null,{"className":"border-t border-energy-gold-outline/30 pt-4 text-center text-xs text-gray-500 dark:text-gray-400","children":["$","p",null,{"children":[["$","strong",null,{"children":"Data Usage Transparency:"}]," We use Google Sign-In to securely authenticate your account. We only request your email address and basic profile information (name, profile picture) to create your account and provide personalized video generation services. Your data is encrypted and stored securely. For more information, please review our"," ",["$","$L8",null,{"href":"/privacy","className":"font-medium underline-offset-4 hover:underline text-energy-deep dark:text-energy-soft","children":"Privacy Policy"}],"."]}]}]]}]}]]}],["$","$L9",null,{}],["$","$La",null,{}]]}]]}]],null],null],["$Lb",null]]]]
b:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Create High-Quality AI Videos from Text — Fast, Simple, No Editing Skills | Sora2Ai"}],["$","meta","3",{"name":"description","content":"Generate marketing videos, social media clips, product demos, and explainer videos using AI. No camera. No editing software. Just type and create. Start with 30 free credits."}],["$","link","4",{"rel":"canonical","href":"https://sora2aivideos.com"}],["$","link","5",{"rel":"alternate","hrefLang":"en","href":"https://sora2aivideos.com"}],["$","link","6",{"rel":"alternate","hrefLang":"en-US","href":"https://sora2aivideos.com"}],["$","link","7",{"rel":"alternate","hrefLang":"ar","href":"https://sora2aivideos.com?lang=ar"}],["$","link","8",{"rel":"alternate","hrefLang":"ar-SA","href":"https://sora2aivideos.com?lang=ar-SA"}],["$","link","9",{"rel":"alternate","hrefLang":"x-default","href":"https://sora2aivideos.com"}],["$","meta","10",{"property":"og:title","content":"Sora Alternative – Best AI Video Generators Like OpenAI Sora"}],["$","meta","11",{"property":"og:description","content":"Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today."}],["$","meta","12",{"property":"og:url","content":"https://sora2aivideos.com"}],["$","meta","13",{"property":"og:site_name","content":"Best Sora Alternative"}],["$","meta","14",{"property":"og:locale","content":"en_US"}],["$","meta","15",{"property":"og:locale:alternate","content":"ar_SA"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary"}],["$","meta","18",{"name":"twitter:title","content":"Sora Alternative – Best AI Video Generators Like OpenAI Sora"}],["$","meta","19",{"name":"twitter:description","content":"Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today."}],["$","link","20",{"rel":"icon","href":"/icon.svg"}]]
1:null
