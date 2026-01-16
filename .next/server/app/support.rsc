2:I[2972,["2972","static/chunks/2972-b109712ff3e0f685.js","6137","static/chunks/6137-d1252e602ab3c1b0.js","5451","static/chunks/app/support/page-ab85b7b21a0becb4.js"],""]
3:I[9250,["2972","static/chunks/2972-b109712ff3e0f685.js","6137","static/chunks/6137-d1252e602ab3c1b0.js","5451","static/chunks/app/support/page-ab85b7b21a0becb4.js"],"default"]
4:I[4707,[],""]
5:I[6423,[],""]
6:I[8003,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],""]
8:I[3490,["6137","static/chunks/6137-d1252e602ab3c1b0.js","7601","static/chunks/app/error-6283e7e4c556e134.js"],"default"]
9:I[9197,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],"Analytics"]
a:I[1952,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],"SpeedInsights"]
7:T1e70,
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
            0:["6nQ4wpD8FHsmpo8vfCccF",[[["",{"children":["support",{"children":["__PAGE__",{}]}]},"$undefined","$undefined",true],["",{"children":["support",{"children":["__PAGE__",{},[["$L1",[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"ContactPage\",\"name\":\"Customer Support Feedback\",\"description\":\"Share customer complaints and after-sales feedback so our support team can assist you promptly.\",\"url\":\"https://sora2aivideos.com/support\",\"mainEntity\":{\"@type\":\"Organization\",\"name\":\"Sora2Ai Videos\",\"contactPoint\":{\"@type\":\"ContactPoint\",\"contactType\":\"Customer Support\",\"availableLanguage\":[\"en\",\"ar\"]}}}"}}],["$","div",null,{"className":"flex min-h-screen flex-col bg-energy-hero/20 py-16 dark:bg-gray-900/80","children":["$","div",null,{"className":"mx-auto w-full max-w-4xl rounded-3xl bg-white px-8 py-12 shadow-2xl dark:bg-gray-800 sm:px-10 lg:px-12","children":["$","div",null,{"className":"mx-auto max-w-3xl space-y-6","children":[["$","div",null,{"className":"flex items-center justify-start","children":["$","$L2",null,{"href":"/","className":"inline-flex items-center gap-2 rounded-full border border-transparent bg-energy-water px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-x-0.5 hover:bg-energy-water-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-energy-water dark:bg-energy-soft dark:text-gray-900 dark:hover:bg-energy-water light:shadow-energy","children":[["$","span",null,{"aria-hidden":"true","className":"text-lg","children":"←"}],"Back to Dashboard"]}]}],["$","div",null,{"className":"mb-8 space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900/40","children":[["$","h2",null,{"className":"text-2xl font-semibold text-gray-900 dark:text-white","children":"How We Can Help You"}],["$","p",null,{"className":"text-base text-gray-600 dark:text-gray-300","children":"Our support team is dedicated to resolving your issues quickly and efficiently. Whether you're experiencing technical difficulties with video generation, have questions about your account or credits, need help understanding how to use our platform, or encounter any errors during the video creation process, we're here to assist you."}],["$","p",null,{"className":"text-base text-gray-600 dark:text-gray-300","children":"Please provide as much detail as possible about your issue, including when it occurred, what you were trying to do, any error messages you may have seen, and your account information if relevant. This information helps us diagnose and resolve your issue faster, ensuring you can get back to creating amazing videos as soon as possible."}],["$","h3",null,{"className":"text-xl font-semibold text-gray-900 dark:text-white mt-6","children":"Common Issues We Can Help With"}],["$","ul",null,{"className":"list-disc list-inside space-y-2 text-base text-gray-600 dark:text-gray-300 ml-4","children":[["$","li",null,{"children":"Video generation errors or failures"}],["$","li",null,{"children":"Account and credit management questions"}],["$","li",null,{"children":"Payment and billing inquiries"}],["$","li",null,{"children":"Technical support for platform features"}],["$","li",null,{"children":"Prompt writing assistance and best practices"}],["$","li",null,{"children":"Video quality or output concerns"}]]}]]}],["$","div",null,{"className":"space-y-3 text-center","children":[["$","h1",null,{"className":"text-3xl font-bold text-gray-900 dark:text-white","children":"Customer Support Feedback"}],["$","p",null,{"className":"text-base text-gray-600 dark:text-gray-300","children":"Help us resolve your bottlenecks faster by sharing detailed context about the issue, who we can reach, and when you prefer to be contacted."}]]}],["$","div",null,{"className":"rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900/60","children":["$","$L3",null,{}]}]]}]}]}]],null],null],null]},[null,["$","$L4",null,{"parallelRouterKey":"children","segmentPath":["children","support","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L5",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/544674a05c909039.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","children":[["$","head",null,{"children":[["$","link",null,{"rel":"dns-prefetch","href":"https://pub-2868c824f92441499577980a0b61114c.r2.dev"}],["$","link",null,{"rel":"preconnect","href":"https://pub-2868c824f92441499577980a0b61114c.r2.dev","crossOrigin":"anonymous"}],["$","link",null,{"rel":"alternate","hrefLang":"en","href":"https://sora2aivideos.com"}],["$","link",null,{"rel":"alternate","hrefLang":"en-US","href":"https://sora2aivideos.com"}],["$","link",null,{"rel":"alternate","hrefLang":"ar","href":"https://sora2aivideos.com?lang=ar"}],["$","link",null,{"rel":"alternate","hrefLang":"ar-SA","href":"https://sora2aivideos.com?lang=ar-SA"}],["$","link",null,{"rel":"alternate","hrefLang":"x-default","href":"https://sora2aivideos.com"}],["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"Organization\",\"name\":\"Best Sora Alternative\",\"url\":\"https://sora2aivideos.com\",\"logo\":\"https://sora2aivideos.com/icon.svg\",\"description\":\"Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.\",\"sameAs\":[],\"contactPoint\":{\"@type\":\"ContactPoint\",\"contactType\":\"Customer Support\",\"url\":\"https://sora2aivideos.com/support\"}}"}}],["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"WebSite\",\"name\":\"Best Sora Alternative\",\"url\":\"https://sora2aivideos.com\",\"description\":\"Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.\",\"potentialAction\":{\"@type\":\"SearchAction\",\"target\":{\"@type\":\"EntryPoint\",\"urlTemplate\":\"https://sora2aivideos.com/prompts?search={search_term_string}\"},\"query-input\":\"required name=search_term_string\"}}"}}],["$","$L6",null,{"src":"https://js.stripe.com/v3/buy-button.js","strategy":"lazyOnload"}]]}],["$","body",null,{"children":[["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$7"}}],["$","div",null,{"className":"flex min-h-screen flex-col","children":[["$","main",null,{"className":"flex-1","children":["$","$L4",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$8","errorStyles":[],"errorScripts":[],"template":["$","$L5",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]}],["$","footer",null,{"className":"border-t border-energy-gold-outline bg-white/90 px-4 py-6 text-sm text-gray-600 backdrop-blur dark:border-gray-700 dark:bg-gray-900/85 dark:text-gray-300","children":["$","div",null,{"className":"mx-auto w-full max-w-7xl space-y-4","children":[["$","div",null,{"className":"flex flex-col items-center justify-between gap-4 sm:flex-row","children":[["$","p",null,{"className":"text-center sm:text-left","children":"This service complies with applicable United States laws and regulations and is offered to enterprise customers. For information about data handling and compliance, please review the following documents."}],["$","div",null,{"className":"flex flex-wrap items-center gap-3","children":[["$","$L2",null,{"href":"/terms","className":"inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800","children":"Terms of Service"}],["$","$L2",null,{"href":"/privacy","className":"inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800","children":"Privacy Policy"}]]}]]}],["$","div",null,{"className":"border-t border-energy-gold-outline/30 pt-4 text-center text-xs text-gray-500 dark:text-gray-400","children":["$","p",null,{"children":[["$","strong",null,{"children":"Data Usage Transparency:"}]," We use Google Sign-In to securely authenticate your account. We only request your email address and basic profile information (name, profile picture) to create your account and provide personalized video generation services. Your data is encrypted and stored securely. For more information, please review our"," ",["$","$L2",null,{"href":"/privacy","className":"font-medium underline-offset-4 hover:underline text-energy-deep dark:text-energy-soft","children":"Privacy Policy"}],"."]}]}]]}]}]]}],["$","$L9",null,{}],["$","$La",null,{}]]}]]}]],null],null],["$Lb",null]]]]
b:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Customer Feedback | Sora2Ai | Best Sora Alternative"}],["$","meta","3",{"name":"description","content":"Share customer complaints and after-sales feedback so our support team can assist you promptly."}],["$","link","4",{"rel":"canonical","href":"https://sora2aivideos.com"}],["$","link","5",{"rel":"alternate","hrefLang":"en","href":"https://sora2aivideos.com"}],["$","link","6",{"rel":"alternate","hrefLang":"en-US","href":"https://sora2aivideos.com"}],["$","link","7",{"rel":"alternate","hrefLang":"ar","href":"https://sora2aivideos.com?lang=ar"}],["$","link","8",{"rel":"alternate","hrefLang":"ar-SA","href":"https://sora2aivideos.com?lang=ar-SA"}],["$","link","9",{"rel":"alternate","hrefLang":"x-default","href":"https://sora2aivideos.com"}],["$","meta","10",{"property":"og:title","content":"Sora Alternative – Best AI Video Generators Like OpenAI Sora"}],["$","meta","11",{"property":"og:description","content":"Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today."}],["$","meta","12",{"property":"og:url","content":"https://sora2aivideos.com"}],["$","meta","13",{"property":"og:site_name","content":"Best Sora Alternative"}],["$","meta","14",{"property":"og:locale","content":"en_US"}],["$","meta","15",{"property":"og:locale:alternate","content":"ar_SA"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary"}],["$","meta","18",{"name":"twitter:title","content":"Sora Alternative – Best AI Video Generators Like OpenAI Sora"}],["$","meta","19",{"name":"twitter:description","content":"Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today."}],["$","link","20",{"rel":"icon","href":"/icon.svg"}]]
1:null
