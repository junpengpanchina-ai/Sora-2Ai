2:I[2972,["2972","static/chunks/2972-b109712ff3e0f685.js","5571","static/chunks/app/terms/page-eccc09d79a5fd924.js"],""]
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
            0:["6nQ4wpD8FHsmpo8vfCccF",[[["",{"children":["terms",{"children":["__PAGE__",{}]}]},"$undefined","$undefined",true],["",{"children":["terms",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"relative min-h-screen overflow-hidden bg-[#050b18] text-white","children":[["$","div",null,{"className":"cosmic-space absolute inset-0","aria-hidden":"true"}],["$","div",null,{"className":"cosmic-glow absolute inset-0","aria-hidden":"true"}],["$","div",null,{"className":"cosmic-stars absolute inset-0","aria-hidden":"true"}],["$","div",null,{"className":"cosmic-noise absolute inset-0","aria-hidden":"true"}],["$","div",null,{"className":"relative z-10 cosmic-content","children":["$","div",null,{"className":"mx-auto max-w-4xl px-6 py-16","children":["$","div",null,{"className":"rounded-3xl border border-white/10 bg-white/5 p-10 text-sm leading-relaxed text-blue-100/85 shadow-[0_35px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur-xl","children":[["$","h1",null,{"className":"mb-6 text-3xl font-semibold text-white","children":"Sora2Ai Videos Terms of Service"}],["$","p",null,{"className":"mb-4","children":"These Terms of Service (“Terms”) reference applicable federal and state regulations in the United States, including but not limited to the Federal Trade Commission Act, the Electronic Communications Privacy Act, the Computer Fraud and Abuse Act, and state privacy statutes such as the California Consumer Privacy Act (CCPA). They govern the relationship between Sora2Ai Videos (“we,” “us,” or “the Service Provider”) and enterprise customers and their authorized users (“you”)."}],["$","h2",null,{"className":"mt-8 mb-3 text-xl font-semibold text-white","children":"1. Service Description"}],["$","p",null,{"className":"mb-4","children":"Sora2Ai Videos provides AI-powered video and media generation tools, account administration, and data processing capabilities. You must ensure that your use is lawful, compliant, and aligned with your contractual and regulatory obligations, including downstream communications to your end clients."}],["$","h2",null,{"className":"mt-8 mb-3 text-xl font-semibold text-white","children":"2. Account Enrollment and Authentication"}],["$","ul",null,{"className":"mb-4 list-disc space-y-2 pl-6","children":[["$","li",null,{"children":"You agree to supply accurate, current, and complete corporate or individual information for onboarding and verification."}],["$","li",null,{"children":"You are responsible for maintaining the security of your credentials and safeguarding access to the platform."}],["$","li",null,{"children":"If inaccurate information results in regulatory investigations, third-party complaints, or damages, you assume all associated liability."}]]}],["$","h2",null,{"className":"mt-8 mb-3 text-xl font-semibold text-white","children":"3. Data Compliance and Content Standards"}],["$","ul",null,{"className":"mb-4 list-disc space-y-2 pl-6","children":[["$","li",null,{"children":"You must ensure that prompts, uploads, and generated outputs do not infringe intellectual property rights, violate applicable laws, or contain restricted content. An internal review workflow is strongly encouraged."}],["$","li",null,{"children":"When handling personal data or regulated information, you must obtain all necessary consents and follow principles such as data minimization and lawful basis requirements under U.S. privacy statutes."}],["$","li",null,{"children":"We reserve the right to disable, remove, or suspend content or accounts in response to enforcement inquiries or credible reports of misuse."}]]}],["$","h2",null,{"className":"mt-8 mb-3 text-xl font-semibold text-white","children":"4. Fees and Billing"}],["$","p",null,{"className":"mb-4","children":"Billing terms follow the executed commercial agreement or published pricing. Once payment is received, we provision the corresponding quotas and features. Any excess usage attributable to your activity will be charged per the agreed-upon rate card."}],["$","h2",null,{"className":"mt-8 mb-3 text-xl font-semibold text-white","children":"5. Intellectual Property"}],["$","ul",null,{"className":"mb-4 list-disc space-y-2 pl-6","children":[["$","li",null,{"children":"We retain all rights to the platform infrastructure, models, algorithms, documentation, and branding assets."}],["$","li",null,{"children":"Generated outputs are licensed to you for lawful use. We do not guarantee that outputs are free from third-party claims, and you remain responsible for downstream clearance."}]]}],["$","h2",null,{"className":"mt-8 mb-3 text-xl font-semibold text-white","children":"6. Limitations of Liability"}],["$","ul",null,{"className":"mb-4 list-disc space-y-2 pl-6","children":[["$","li",null,{"children":"We strive for high availability but are not liable for interruptions caused by force majeure, changes in law, service providers, or infrastructure outages."}],["$","li",null,{"children":"If your use of the service triggers consumer complaints, regulatory scrutiny, or litigation, you agree to address the issue promptly and bear related consequences."}]]}],["$","h2",null,{"className":"mt-8 mb-3 text-xl font-semibold text-white","children":"7. Modification of Terms"}],["$","p",null,{"className":"mb-4","children":"We may update these Terms to reflect changes in law, best practices, or service scope. Updated Terms will be posted on the platform or communicated via email. Continued use of the service after the effective date constitutes acceptance of the revised Terms."}],["$","h2",null,{"className":"mt-8 mb-3 text-xl font-semibold text-white","children":"8. Governing Law and Dispute Resolution"}],["$","p",null,{"className":"mb-4","children":"These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles. Any dispute that cannot be resolved through good-faith negotiations shall be submitted to the state or federal courts located in Wilmington, Delaware, and the parties consent to their jurisdiction."}],["$","p",null,{"className":"mt-10 text-xs text-blue-100/70","children":"For questions about these Terms or to request a signed master services agreement, please contact us through your account representative or official support channels."}],["$","div",null,{"className":"mt-8 flex justify-center","children":["$","$L2",null,{"href":"/","className":"inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10","children":"Back to Home"}]}]]}]}]}]]}],null],null],null]},[null,["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children","terms","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/544674a05c909039.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","children":[["$","head",null,{"children":[["$","link",null,{"rel":"dns-prefetch","href":"https://pub-2868c824f92441499577980a0b61114c.r2.dev"}],["$","link",null,{"rel":"preconnect","href":"https://pub-2868c824f92441499577980a0b61114c.r2.dev","crossOrigin":"anonymous"}],["$","link",null,{"rel":"alternate","hrefLang":"en","href":"https://sora2aivideos.com"}],["$","link",null,{"rel":"alternate","hrefLang":"en-US","href":"https://sora2aivideos.com"}],["$","link",null,{"rel":"alternate","hrefLang":"ar","href":"https://sora2aivideos.com?lang=ar"}],["$","link",null,{"rel":"alternate","hrefLang":"ar-SA","href":"https://sora2aivideos.com?lang=ar-SA"}],["$","link",null,{"rel":"alternate","hrefLang":"x-default","href":"https://sora2aivideos.com"}],["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"Organization\",\"name\":\"Best Sora Alternative\",\"url\":\"https://sora2aivideos.com\",\"logo\":\"https://sora2aivideos.com/icon.svg\",\"description\":\"Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.\",\"sameAs\":[],\"contactPoint\":{\"@type\":\"ContactPoint\",\"contactType\":\"Customer Support\",\"url\":\"https://sora2aivideos.com/support\"}}"}}],["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"WebSite\",\"name\":\"Best Sora Alternative\",\"url\":\"https://sora2aivideos.com\",\"description\":\"Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.\",\"potentialAction\":{\"@type\":\"SearchAction\",\"target\":{\"@type\":\"EntryPoint\",\"urlTemplate\":\"https://sora2aivideos.com/prompts?search={search_term_string}\"},\"query-input\":\"required name=search_term_string\"}}"}}],["$","$L5",null,{"src":"https://js.stripe.com/v3/buy-button.js","strategy":"lazyOnload"}]]}],["$","body",null,{"children":[["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$6"}}],["$","div",null,{"className":"flex min-h-screen flex-col","children":[["$","main",null,{"className":"flex-1","children":["$","$L3",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$7","errorStyles":[],"errorScripts":[],"template":["$","$L4",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]}],["$","footer",null,{"className":"border-t border-energy-gold-outline bg-white/90 px-4 py-6 text-sm text-gray-600 backdrop-blur dark:border-gray-700 dark:bg-gray-900/85 dark:text-gray-300","children":["$","div",null,{"className":"mx-auto w-full max-w-7xl space-y-4","children":[["$","div",null,{"className":"flex flex-col items-center justify-between gap-4 sm:flex-row","children":[["$","p",null,{"className":"text-center sm:text-left","children":"This service complies with applicable United States laws and regulations and is offered to enterprise customers. For information about data handling and compliance, please review the following documents."}],["$","div",null,{"className":"flex flex-wrap items-center gap-3","children":[["$","$L2",null,{"href":"/terms","className":"inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800","children":"Terms of Service"}],["$","$L2",null,{"href":"/privacy","className":"inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800","children":"Privacy Policy"}]]}]]}],["$","div",null,{"className":"border-t border-energy-gold-outline/30 pt-4 text-center text-xs text-gray-500 dark:text-gray-400","children":["$","p",null,{"children":[["$","strong",null,{"children":"Data Usage Transparency:"}]," We use Google Sign-In to securely authenticate your account. We only request your email address and basic profile information (name, profile picture) to create your account and provide personalized video generation services. Your data is encrypted and stored securely. For more information, please review our"," ",["$","$L2",null,{"href":"/privacy","className":"font-medium underline-offset-4 hover:underline text-energy-deep dark:text-energy-soft","children":"Privacy Policy"}],"."]}]}]]}]}]]}],["$","$L8",null,{}],["$","$L9",null,{}]]}]]}]],null],null],["$La",null]]]]
a:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Terms of Service | Sora2Ai Videos | Best Sora Alternative"}],["$","meta","3",{"name":"description","content":"Sora2Ai Videos enterprise-facing Terms of Service aligned with U.S. regulations."}],["$","link","4",{"rel":"canonical","href":"https://sora2aivideos.com"}],["$","link","5",{"rel":"alternate","hrefLang":"en","href":"https://sora2aivideos.com"}],["$","link","6",{"rel":"alternate","hrefLang":"en-US","href":"https://sora2aivideos.com"}],["$","link","7",{"rel":"alternate","hrefLang":"ar","href":"https://sora2aivideos.com?lang=ar"}],["$","link","8",{"rel":"alternate","hrefLang":"ar-SA","href":"https://sora2aivideos.com?lang=ar-SA"}],["$","link","9",{"rel":"alternate","hrefLang":"x-default","href":"https://sora2aivideos.com"}],["$","meta","10",{"property":"og:title","content":"Sora Alternative – Best AI Video Generators Like OpenAI Sora"}],["$","meta","11",{"property":"og:description","content":"Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today."}],["$","meta","12",{"property":"og:url","content":"https://sora2aivideos.com"}],["$","meta","13",{"property":"og:site_name","content":"Best Sora Alternative"}],["$","meta","14",{"property":"og:locale","content":"en_US"}],["$","meta","15",{"property":"og:locale:alternate","content":"ar_SA"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary"}],["$","meta","18",{"name":"twitter:title","content":"Sora Alternative – Best AI Video Generators Like OpenAI Sora"}],["$","meta","19",{"name":"twitter:description","content":"Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today."}],["$","link","20",{"rel":"icon","href":"/icon.svg"}]]
1:null
