2:I[2972,["2972","static/chunks/2972-b109712ff3e0f685.js","6886","static/chunks/app/text-to-video-ai/page-418af549f25682c0.js"],""]
3:I[4707,[],""]
4:I[6423,[],""]
5:I[8003,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],""]
7:I[3490,["6137","static/chunks/6137-d1252e602ab3c1b0.js","7601","static/chunks/app/error-6283e7e4c556e134.js"],"default"]
8:I[9197,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],"Analytics"]
9:I[1952,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],"SpeedInsights"]
6:T1e70,
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
            0:["6nQ4wpD8FHsmpo8vfCccF",[[["",{"children":["text-to-video-ai",{"children":["__PAGE__",{}]}]},"$undefined","$undefined",true],["",{"children":["text-to-video-ai",{"children":["__PAGE__",{},[["$L1",[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"WebPage\",\"name\":\"Text to Video AI – Best AI Video Generator from Text\",\"description\":\"Create stunning videos from text prompts using AI. Compare the best text-to-video AI generators.\",\"url\":\"https://sora2aivideos.com/text-to-video-ai\",\"mainEntity\":{\"@type\":\"SoftwareApplication\",\"name\":\"Text to Video AI Generator\",\"applicationCategory\":\"MultimediaApplication\",\"operatingSystem\":\"Web\",\"offers\":{\"@type\":\"Offer\",\"price\":\"0\",\"priceCurrency\":\"USD\",\"description\":\"Free credits for new users\"}}}"}}],["$","div",null,{"className":"bg-slate-50 dark:bg-gray-950","children":[["$","div",null,{"className":"relative overflow-hidden border-b border-white/20 bg-gradient-to-br from-[#050b18] via-[#09122C] to-[#050b18]","children":[["$","div",null,{"className":"cosmic-space absolute inset-0 opacity-60","aria-hidden":"true"}],["$","div",null,{"className":"cosmic-glow absolute inset-0 opacity-50","aria-hidden":"true"}],["$","div",null,{"className":"relative z-10 mx-auto max-w-6xl px-6 py-16 text-white","children":[["$","div",null,{"className":"flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-energy-water","children":["$","span",null,{"children":"Text to Video AI"}]}],["$","h1",null,{"className":"mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl","children":"Best Text to Video AI Tools"}],["$","p",null,{"className":"mt-4 max-w-3xl text-lg text-blue-100/80","children":"Transform your text descriptions into professional AI-generated videos. Discover the best text-to-video AI tools and learn how to create stunning videos from simple text prompts."}]]}]]}],["$","main",null,{"className":"mx-auto max-w-6xl px-6 py-12 lg:py-16","children":["$","div",null,{"className":"space-y-12","children":[["$","section",null,{"className":"rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60","children":[["$","h2",null,{"className":"text-2xl font-semibold text-gray-900 dark:text-white mb-6","children":"What is Text to Video AI?"}],["$","div",null,{"className":"prose prose-gray dark:prose-invert max-w-none","children":[["$","p",null,{"className":"text-gray-600 dark:text-gray-300 leading-relaxed mb-4","children":"Text to Video AI is a revolutionary technology that converts written text descriptions into video content. Using advanced artificial intelligence and machine learning, these tools understand your text prompts and generate corresponding video footage."}],["$","p",null,{"className":"text-gray-600 dark:text-gray-300 leading-relaxed","children":"Whether you're creating marketing videos, social media content, educational materials, or creative projects, text-to-video AI makes video creation accessible to everyone—no video editing skills required."}]]}]]}],["$","section",null,{"className":"rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60","children":[["$","h2",null,{"className":"text-2xl font-semibold text-gray-900 dark:text-white mb-6","children":"How Text to Video AI Works"}],["$","div",null,{"className":"space-y-4","children":[["$","div",null,{"className":"flex items-start gap-4","children":[["$","div",null,{"className":"flex h-10 w-10 items-center justify-center rounded-full bg-energy-water/10 text-sm font-semibold text-energy-water","children":"1"}],["$","div",null,{"children":[["$","h3",null,{"className":"text-lg font-medium text-gray-900 dark:text-white mb-1","children":"Write Your Text Prompt"}],["$","p",null,{"className":"text-gray-600 dark:text-gray-300","children":"Describe the video you want to create in detail. Include information about the scene, style, mood, and any specific elements you want to see."}]]}]]}],["$","div",null,{"className":"flex items-start gap-4","children":[["$","div",null,{"className":"flex h-10 w-10 items-center justify-center rounded-full bg-energy-water/10 text-sm font-semibold text-energy-water","children":"2"}],["$","div",null,{"children":[["$","h3",null,{"className":"text-lg font-medium text-gray-900 dark:text-white mb-1","children":"AI Processes Your Request"}],["$","p",null,{"className":"text-gray-600 dark:text-gray-300","children":"Advanced AI models analyze your text, understand the context, and generate corresponding video frames and motion."}]]}]]}],["$","div",null,{"className":"flex items-start gap-4","children":[["$","div",null,{"className":"flex h-10 w-10 items-center justify-center rounded-full bg-energy-water/10 text-sm font-semibold text-energy-water","children":"3"}],["$","div",null,{"children":[["$","h3",null,{"className":"text-lg font-medium text-gray-900 dark:text-white mb-1","children":"Receive Your Video"}],["$","p",null,{"className":"text-gray-600 dark:text-gray-300","children":"Get your generated video in seconds or minutes, ready to download, share, or use in your projects."}]]}]]}]]}]]}],["$","section",null,{"className":"rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60","children":[["$","h2",null,{"className":"text-2xl font-semibold text-gray-900 dark:text-white mb-6","children":"Best Text to Video AI Tools"}],["$","div",null,{"className":"prose prose-gray dark:prose-invert max-w-none","children":[["$","p",null,{"className":"text-gray-600 dark:text-gray-300 leading-relaxed mb-4","children":"The text-to-video AI market has grown rapidly, with many excellent tools available. Here are some of the best options:"}],["$","ul",null,{"className":"list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2","children":[["$","li",null,{"children":[["$","strong",null,{"children":"OpenAI Sora:"}]," High-quality video generation with impressive realism"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Runway Gen-3:"}]," Professional-grade tool with advanced controls"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Pika Labs:"}]," Creative-focused with artistic styles"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Luma Dream Machine:"}]," Fast generation with good quality"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Our Platform:"}]," Free text-to-video AI generator with 30 free credits"]}]]}]]}]]}],["$","section",null,{"className":"rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60","children":[["$","h2",null,{"className":"text-2xl font-semibold text-gray-900 dark:text-white mb-6","children":"Tips for Writing Effective Text Prompts"}],["$","div",null,{"className":"prose prose-gray dark:prose-invert max-w-none","children":[["$","p",null,{"className":"text-gray-600 dark:text-gray-300 leading-relaxed mb-4","children":"To get the best results from text-to-video AI, follow these prompt writing tips:"}],["$","ul",null,{"className":"list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2","children":[["$","li",null,{"children":"Be specific about the scene, setting, and subjects"}],["$","li",null,{"children":"Include style descriptors (cinematic, documentary, animated, etc.)"}],["$","li",null,{"children":"Mention camera movements (aerial shot, close-up, pan, etc.)"}],["$","li",null,{"children":"Specify lighting conditions (golden hour, neon lights, natural light)"}],["$","li",null,{"children":"Add mood and atmosphere descriptions"}],["$","li",null,{"children":"Include technical details (8K, slow motion, depth of field)"}]]}]]}]]}],["$","section",null,{"className":"rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60","children":[["$","h2",null,{"className":"text-2xl font-semibold text-gray-900 dark:text-white mb-6","children":"Start Creating Videos from Text"}],["$","p",null,{"className":"text-gray-600 dark:text-gray-300 leading-relaxed mb-6","children":"Ready to transform your text into videos? Try our free text-to-video AI generator and create professional videos in seconds."}],["$","div",null,{"className":"flex flex-wrap gap-4","children":[["$","$L2",null,{"href":"/video","className":"inline-flex items-center justify-center rounded-lg bg-energy-water px-6 py-3 text-sm font-medium text-white transition hover:bg-energy-water/90","children":"Create Video from Text"}],["$","$L2",null,{"href":"/sora-alternative","className":"inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700","children":"View Sora Alternatives"}]]}]]}],["$","section",null,{"className":"rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900/60","children":[["$","h2",null,{"className":"text-2xl font-semibold text-gray-900 dark:text-white mb-6","children":"Related Resources"}],["$","ul",null,{"className":"space-y-2","children":[["$","li",null,{"children":["$","$L2",null,{"href":"/blog/text-to-video-ai-free","className":"text-energy-water hover:underline","children":"Free Text to Video AI Tools"}]}],["$","li",null,{"children":["$","$L2",null,{"href":"/ai-video-generator","className":"text-energy-water hover:underline","children":"AI Video Generator Guide"}]}],["$","li",null,{"children":["$","$L2",null,{"href":"/blog/ai-video-generator-for-youtube","className":"text-energy-water hover:underline","children":"AI Video Generator for YouTube"}]}]]}]]}]]}]}]]}]],null],null],null]},[null,["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children","text-to-video-ai","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/544674a05c909039.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","children":[["$","head",null,{"children":[["$","link",null,{"rel":"dns-prefetch","href":"https://pub-2868c824f92441499577980a0b61114c.r2.dev"}],["$","link",null,{"rel":"preconnect","href":"https://pub-2868c824f92441499577980a0b61114c.r2.dev","crossOrigin":"anonymous"}],["$","link",null,{"rel":"alternate","hrefLang":"en","href":"https://sora2aivideos.com"}],["$","link",null,{"rel":"alternate","hrefLang":"en-US","href":"https://sora2aivideos.com"}],["$","link",null,{"rel":"alternate","hrefLang":"ar","href":"https://sora2aivideos.com?lang=ar"}],["$","link",null,{"rel":"alternate","hrefLang":"ar-SA","href":"https://sora2aivideos.com?lang=ar-SA"}],["$","link",null,{"rel":"alternate","hrefLang":"x-default","href":"https://sora2aivideos.com"}],["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"Organization\",\"name\":\"Best Sora Alternative\",\"url\":\"https://sora2aivideos.com\",\"logo\":\"https://sora2aivideos.com/icon.svg\",\"description\":\"Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.\",\"sameAs\":[],\"contactPoint\":{\"@type\":\"ContactPoint\",\"contactType\":\"Customer Support\",\"url\":\"https://sora2aivideos.com/support\"}}"}}],["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"WebSite\",\"name\":\"Best Sora Alternative\",\"url\":\"https://sora2aivideos.com\",\"description\":\"Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.\",\"potentialAction\":{\"@type\":\"SearchAction\",\"target\":{\"@type\":\"EntryPoint\",\"urlTemplate\":\"https://sora2aivideos.com/prompts?search={search_term_string}\"},\"query-input\":\"required name=search_term_string\"}}"}}],["$","$L5",null,{"src":"https://js.stripe.com/v3/buy-button.js","strategy":"lazyOnload"}]]}],["$","body",null,{"children":[["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$6"}}],["$","div",null,{"className":"flex min-h-screen flex-col","children":[["$","main",null,{"className":"flex-1","children":["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$7","errorStyles":[],"errorScripts":[],"template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]}],["$","footer",null,{"className":"border-t border-energy-gold-outline bg-white/90 px-4 py-6 text-sm text-gray-600 backdrop-blur dark:border-gray-700 dark:bg-gray-900/85 dark:text-gray-300","children":["$","div",null,{"className":"mx-auto w-full max-w-7xl space-y-4","children":[["$","div",null,{"className":"flex flex-col items-center justify-between gap-4 sm:flex-row","children":[["$","p",null,{"className":"text-center sm:text-left","children":"This service complies with applicable United States laws and regulations and is offered to enterprise customers. For information about data handling and compliance, please review the following documents."}],["$","div",null,{"className":"flex flex-wrap items-center gap-3","children":[["$","$L2",null,{"href":"/terms","className":"inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800","children":"Terms of Service"}],["$","$L2",null,{"href":"/privacy","className":"inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800","children":"Privacy Policy"}]]}]]}],["$","div",null,{"className":"border-t border-energy-gold-outline/30 pt-4 text-center text-xs text-gray-500 dark:text-gray-400","children":["$","p",null,{"children":[["$","strong",null,{"children":"Data Usage Transparency:"}]," We use Google Sign-In to securely authenticate your account. We only request your email address and basic profile information (name, profile picture) to create your account and provide personalized video generation services. Your data is encrypted and stored securely. For more information, please review our"," ",["$","$L2",null,{"href":"/privacy","className":"font-medium underline-offset-4 hover:underline text-energy-deep dark:text-energy-soft","children":"Privacy Policy"}],"."]}]}]]}]}]]}],["$","$L8",null,{}],["$","$L9",null,{}]]}]]}]],null],null],["$La",null]]]]
a:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Text to Video AI – Best AI Video Generator from Text | Best Sora Alternative"}],["$","meta","3",{"name":"description","content":"Create stunning videos from text prompts using AI. Compare the best text-to-video AI generators and start creating professional videos in seconds. Free credits available."}],["$","link","4",{"rel":"canonical","href":"https://sora2aivideos.com/text-to-video-ai"}],["$","meta","5",{"property":"og:title","content":"Text to Video AI – Best AI Video Generator from Text"}],["$","meta","6",{"property":"og:description","content":"Create stunning videos from text prompts using AI. Compare the best text-to-video AI generators."}],["$","meta","7",{"property":"og:url","content":"https://sora2aivideos.com/text-to-video-ai"}],["$","meta","8",{"property":"og:type","content":"website"}],["$","meta","9",{"name":"twitter:card","content":"summary"}],["$","meta","10",{"name":"twitter:title","content":"Text to Video AI – Best AI Video Generator from Text"}],["$","meta","11",{"name":"twitter:description","content":"Create stunning videos from text prompts using AI. Compare the best text-to-video AI generators."}],["$","link","12",{"rel":"icon","href":"/icon.svg"}]]
1:null
