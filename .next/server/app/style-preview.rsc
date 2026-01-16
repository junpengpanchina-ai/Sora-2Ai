2:I[4707,[],""]
3:I[6423,[],""]
4:I[8003,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],""]
6:I[3490,["6137","static/chunks/6137-d1252e602ab3c1b0.js","7601","static/chunks/app/error-6283e7e4c556e134.js"],"default"]
7:I[2972,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],""]
8:I[9197,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],"Analytics"]
9:I[1952,["2972","static/chunks/2972-b109712ff3e0f685.js","3185","static/chunks/app/layout-6e5a490215f21af7.js"],"SpeedInsights"]
5:T1e70,
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
            0:["6nQ4wpD8FHsmpo8vfCccF",[[["",{"children":["style-preview",{"children":["__PAGE__",{}]}]},"$undefined","$undefined",true],["",{"children":["style-preview",{"children":["__PAGE__",{},[["$L1",["$","main",null,{"className":"min-h-screen bg-[var(--energy-base-soft)] text-[var(--energy-deep-black)] py-16","children":["$","div",null,{"className":"mx-auto flex max-w-6xl flex-col gap-12 px-6","children":[["$","header",null,{"className":"space-y-6","children":[["$","span",null,{"className":"inline-flex items-center gap-2 rounded-full border border-[var(--energy-gold-mid)] bg-white/80 px-4 py-1 text-sm font-medium text-[var(--energy-gold-mid)] shadow-sm","children":"金白为骨 · 水蓝为脉"}],["$","h1",null,{"className":"text-4xl font-semibold tracking-tight","children":"金生水能量配色测试页"}],["$","p",null,{"className":"max-w-3xl text-lg text-[rgba(10,10,10,0.75)]","children":"该页面用于快速验证“金生水”主题在实际界面中的视觉效果，通过主色、辅色与点缀色的组合，观察层次、对比与氛围是否符合预期。"}]]}],["$","section",null,{"className":"rounded-2xl border border-white/60 bg-white p-8 shadow-custom-lg","children":[["$","h2",null,{"className":"text-2xl font-semibold","children":"色彩配比"}],["$","p",null,{"className":"mt-2 text-sm text-[rgba(10,10,10,0.65)]","children":"70% 主色 · 25% 辅助色 · 5% 点缀色"}],["$","div",null,{"className":"mt-6 overflow-hidden rounded-full border border-[rgba(10,10,10,0.1)]","children":["$","div",null,{"className":"flex h-6","children":[["$","div",null,{"className":"h-full w-[70%]","style":{"backgroundColor":"var(--energy-base-white)"}}],["$","div",null,{"className":"h-full w-[25%]","style":{"backgroundColor":"var(--energy-water-blue)"}}],["$","div",null,{"className":"h-full w-[5%]","style":{"backgroundImage":"var(--energy-gold-gradient)"}}]]}]}],["$","div",null,{"className":"mt-4 grid gap-4 text-sm text-[rgba(10,10,10,0.65)] sm:grid-cols-3","children":[["$","div",null,{"className":"rounded-lg border border-[rgba(10,10,10,0.08)] bg-white px-4 py-3","children":[["$","div",null,{"className":"font-semibold text-[var(--energy-deep-black)]","children":"主色"}],["$","div",null,{"children":"纯白/银白 · 70%"}]]}],["$","div",null,{"className":"rounded-lg border border-[rgba(10,10,10,0.08)] bg-white px-4 py-3","children":[["$","div",null,{"className":"font-semibold text-[var(--energy-deep-black)]","children":"辅助色"}],["$","div",null,{"children":"科技蓝/深海蓝 · 25%"}]]}],["$","div",null,{"className":"rounded-lg border border-[rgba(10,10,10,0.08)] bg-white px-4 py-3","children":[["$","div",null,{"className":"font-semibold text-[var(--energy-deep-black)]","children":"点缀色"}],["$","div",null,{"children":"浅金/金属渐变 · 5%"}]]}]]}]]}],["$","section",null,{"className":"grid gap-8 lg:grid-cols-2","children":[["$","div",null,{"className":"rounded-2xl border border-white/60 bg-white p-8 shadow-custom-lg","children":[["$","h2",null,{"className":"text-2xl font-semibold","children":"主色调 · 金为骨架"}],["$","p",null,{"className":"mt-2 text-sm text-[rgba(10,10,10,0.65)]","children":"奠定界面基调，构建纯净且有深度的空间。"}],["$","div",null,{"className":"mt-6 space-y-4","children":[["$","div","#FFFFFF",{"className":"flex items-center justify-between rounded-xl border border-[rgba(10,10,10,0.08)] bg-white/80 p-4 shadow-sm","children":[["$","div",null,{"className":"flex items-center gap-4","children":[["$","div",null,{"className":"h-16 w-16 rounded-xl border border-white/40 shadow-inner","style":{"backgroundColor":"#FFFFFF","backgroundImage":"$undefined","boxShadow":"inset 0 0 8px rgba(10,10,10,0.04)"}}],["$","div",null,{"children":[["$","div",null,{"className":"text-lg font-semibold text-[var(--energy-deep-black)]","children":"极致纯白"}],["$","div",null,{"className":"text-sm text-[rgba(10,10,10,0.65)]","children":"背景、大面积主色，聚焦内容与信息层次"}]]}]]}],["$","div",null,{"className":"text-right text-sm text-[rgba(10,10,10,0.55)]","children":[["$","div",null,{"children":"#FFFFFF"}],["$","div",null,{"children":"纯金"}]]}]]}],["$","div","#0A0A0A",{"className":"flex items-center justify-between rounded-xl border border-[rgba(10,10,10,0.08)] bg-white/80 p-4 shadow-sm","children":[["$","div",null,{"className":"flex items-center gap-4","children":[["$","div",null,{"className":"h-16 w-16 rounded-xl border border-white/40 shadow-inner","style":{"backgroundColor":"#0A0A0A","backgroundImage":"linear-gradient(145deg, #050505, #111111)","boxShadow":"$undefined"}}],["$","div",null,{"children":[["$","div",null,{"className":"text-lg font-semibold text-[var(--energy-deep-black)]","children":"深空黑"}],["$","div",null,{"className":"text-sm text-[rgba(10,10,10,0.65)]","children":"导航、头部或重点背景，传达权威与深度"}]]}]]}],["$","div",null,{"className":"text-right text-sm text-[rgba(10,10,10,0.55)]","children":[["$","div",null,{"children":"#0A0A0A"}],["$","div",null,{"children":"玄水"}]]}]]}]]}]]}],["$","div",null,{"className":"rounded-2xl border border-white/60 bg-white p-8 shadow-custom-lg","children":[["$","h2",null,{"className":"text-2xl font-semibold","children":"辅助色 · 水为流动"}],["$","p",null,{"className":"mt-2 text-sm text-[rgba(10,10,10,0.65)]","children":"驱动互动行为，激活“妻财星”流动。"}],["$","div",null,{"className":"mt-6 space-y-4","children":[["$","div","#0066CC",{"className":"flex items-center justify-between rounded-xl border border-[rgba(10,10,10,0.08)] bg-white/80 p-4 shadow-sm","children":[["$","div",null,{"className":"flex items-center gap-4","children":[["$","div",null,{"className":"h-16 w-16 rounded-xl border border-black/20 shadow-inner","style":{"backgroundColor":"#0066CC"}}],["$","div",null,{"children":[["$","div",null,{"className":"text-lg font-semibold text-[var(--energy-deep-black)]","children":"科技蓝"}],["$","div",null,{"className":"text-sm text-[rgba(10,10,10,0.65)]","children":"主按钮、主要链接、互动高亮"}]]}]]}],["$","div",null,{"className":"text-right text-sm text-[rgba(10,10,10,0.55)]","children":[["$","div",null,{"children":"#0066CC"}],["$","div",null,{"children":"活力之水"}]]}]]}],["$","div","#003366",{"className":"flex items-center justify-between rounded-xl border border-[rgba(10,10,10,0.08)] bg-white/80 p-4 shadow-sm","children":[["$","div",null,{"className":"flex items-center gap-4","children":[["$","div",null,{"className":"h-16 w-16 rounded-xl border border-black/20 shadow-inner","style":{"backgroundColor":"#003366"}}],["$","div",null,{"children":[["$","div",null,{"className":"text-lg font-semibold text-[var(--energy-deep-black)]","children":"深海蓝"}],["$","div",null,{"className":"text-sm text-[rgba(10,10,10,0.65)]","children":"次级按钮、悬浮态、次层强调"}]]}]]}],["$","div",null,{"className":"text-right text-sm text-[rgba(10,10,10,0.55)]","children":[["$","div",null,{"children":"#003366"}],["$","div",null,{"children":"深邃之水"}]]}]]}]]}]]}]]}],["$","section",null,{"className":"rounded-2xl border border-white/60 bg-white p-8 shadow-custom-lg","children":[["$","h2",null,{"className":"text-2xl font-semibold","children":"点缀色 · 金属之光"}],["$","p",null,{"className":"mt-2 text-sm text-[rgba(10,10,10,0.65)]","children":"用于边框、分割线、微交互，让价值感溢出而不过度。"}],["$","div",null,{"className":"mt-6 grid gap-4 md:grid-cols-2","children":[["$","div",null,{"className":"rounded-2xl border border-[rgba(10,10,10,0.08)] bg-white/80 p-6 shadow-sm","children":[["$","div",null,{"className":"h-20 w-full rounded-xl border border-white/20 shadow-inner","style":{"backgroundImage":"var(--energy-gold-gradient)"}}],["$","div",null,{"className":"mt-4 text-sm text-[rgba(10,10,10,0.65)]","children":[["$","div",null,{"className":"font-medium text-[var(--energy-deep-black)]","children":"金属渐变"}],["$","div",null,{"children":"linear-gradient(135deg, #F5D97D → #D7B14C → #F5E5B5)"}]]}]]}],["$","div",null,{"className":"flex flex-col gap-4 rounded-2xl border border-[rgba(10,10,10,0.08)] bg-white/80 p-6 shadow-sm","children":[["$","div",null,{"className":"text-sm text-[rgba(10,10,10,0.65)]","children":[["$","div",null,{"className":"font-medium text-[var(--energy-deep-black)]","children":"细节用法示例"}],["$","ul",null,{"className":"mt-3 space-y-2","children":[["$","li",null,{"children":"· LOGO 线条或首字母强调"}],["$","li",null,{"children":"· 卡片描边与分隔线（1px-2px）"}],["$","li",null,{"children":"· 数据亮点或顶部指示条"}]]}]]}],["$","div",null,{"className":"grid gap-3 sm:grid-cols-3","children":[["$","div","#F5D97D",{"className":"rounded-xl border border-[rgba(10,10,10,0.08)] bg-white/60 p-3 text-center text-sm text-[rgba(10,10,10,0.6)]","children":[["$","div",null,{"className":"h-12 w-full rounded-lg shadow-inner","style":{"backgroundColor":"#F5D97D"}}],["$","div",null,{"className":"mt-2 font-medium text-[var(--energy-deep-black)]","children":"#F5D97D"}]]}],["$","div","#D7B14C",{"className":"rounded-xl border border-[rgba(10,10,10,0.08)] bg-white/60 p-3 text-center text-sm text-[rgba(10,10,10,0.6)]","children":[["$","div",null,{"className":"h-12 w-full rounded-lg shadow-inner","style":{"backgroundColor":"#D7B14C"}}],["$","div",null,{"className":"mt-2 font-medium text-[var(--energy-deep-black)]","children":"#D7B14C"}]]}],["$","div","#F5E5B5",{"className":"rounded-xl border border-[rgba(10,10,10,0.08)] bg-white/60 p-3 text-center text-sm text-[rgba(10,10,10,0.6)]","children":[["$","div",null,{"className":"h-12 w-full rounded-lg shadow-inner","style":{"backgroundColor":"#F5E5B5"}}],["$","div",null,{"className":"mt-2 font-medium text-[var(--energy-deep-black)]","children":"#F5E5B5"}]]}]]}]]}]]}]]}],["$","section",null,{"className":"grid gap-8 lg:grid-cols-2","children":[["$","div",null,{"className":"overflow-hidden rounded-2xl border border-black/5 bg-black p-8 text-white shadow-custom-xl","children":[["$","div",null,{"className":"text-sm uppercase tracking-[0.3em] text-[rgba(255,255,255,0.65)]","children":"Hero 示例"}],["$","h3",null,{"className":"mt-4 text-3xl font-semibold text-white","children":"金生水 — 聚势引流"}],["$","p",null,{"className":"mt-3 text-sm text-[rgba(255,255,255,0.75)]","children":"深空黑作背景，金属线条与蓝色按钮作为焦点，营造科技感与高端气质。"}],["$","div",null,{"className":"mt-6 flex flex-wrap items-center gap-4","children":[["$","button",null,{"className":"rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5","style":{"backgroundColor":"var(--energy-water-blue)"},"children":"立即体验"}],["$","button",null,{"className":"rounded-full border px-6 py-3 text-sm font-semibold text-[rgba(255,255,255,0.85)] hover:text-white","style":{"borderColor":"#F5D97D","backgroundColor":"rgba(255,255,255,0.05)"},"children":"了解方案"}]]}],["$","div",null,{"className":"mt-8 h-px w-full","style":{"backgroundImage":"var(--energy-gold-gradient)"}}],["$","div",null,{"className":"mt-6 flex items-center gap-3","children":[["$","div",null,{"className":"h-10 w-10 rounded-full border border-white/30","style":{"backgroundImage":"var(--energy-gold-gradient)"}}],["$","div",null,{"className":"text-sm text-[rgba(255,255,255,0.75)]","children":[["$","div",null,{"className":"font-semibold text-white","children":"金水同源"}],["$","div",null,{"children":"四两拨千斤的能量引导叙事"}]]}]]}]]}],["$","div",null,{"className":"rounded-2xl border border-white/60 bg-white p-8 shadow-custom-lg","children":["$","div",null,{"className":"flex flex-col gap-6","children":[["$","div",null,{"children":[["$","div",null,{"className":"text-sm font-semibold text-[rgba(10,10,10,0.6)]","children":"卡片示例"}],["$","div",null,{"className":"mt-3 rounded-2xl border border-[rgba(10,10,10,0.08)] bg-white/70 p-6","children":[["$","div",null,{"className":"text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(10,10,10,0.45)]","children":"Insight"}],["$","h3",null,{"className":"mt-3 text-2xl font-semibold text-[var(--energy-deep-black)]","children":"能量路径最短"}],["$","p",null,{"className":"mt-2 text-sm text-[rgba(10,10,10,0.65)]","children":"纯白承载信息，深空黑构建对比，蓝色引导操作，金色点睛强调价值。"}],["$","div",null,{"className":"mt-6 flex items-center gap-4","children":[["$","span",null,{"className":"flex items-center gap-2 rounded-full bg-[var(--energy-water-blue)] px-4 py-2 text-xs font-semibold text-white","children":"行动 CTA"}],["$","span",null,{"className":"text-xs text-[rgba(10,10,10,0.55)]","children":"Hover 提亮 8% 即可完成状态反馈"}]]}],["$","div",null,{"className":"mt-6 h-px w-full","style":{"backgroundImage":"var(--energy-gold-gradient)"}}]]}]]}],["$","div",null,{"children":[["$","div",null,{"className":"text-sm font-semibold text-[rgba(10,10,10,0.6)]","children":"按钮状态"}],["$","div",null,{"className":"mt-3 grid gap-3 sm:grid-cols-3","children":[["$","button",null,{"className":"rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md","style":{"backgroundColor":"var(--energy-water-blue)"},"children":"默认"}],["$","button",null,{"className":"rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md","style":{"backgroundColor":"#1c7fe6"},"children":"悬浮态"}],["$","button",null,{"className":"rounded-full px-5 py-2 text-sm font-semibold text-[rgba(10,10,10,0.45)]","style":{"backgroundColor":"rgba(0,102,204,0.2)"},"disabled":true,"children":"禁用态"}]]}]]}]]}]}]]}],["$","footer",null,{"className":"rounded-2xl border border-white/60 bg-white p-8 text-sm text-[rgba(10,10,10,0.6)] shadow-custom-lg","children":["$","div",null,{"className":"flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between","children":[["$","div",null,{"children":[["$","div",null,{"className":"font-semibold text-[var(--energy-deep-black)]","children":"落地建议"}],["$","p",null,{"children":"在实际开发中可将上述变量写入主题 token，通过 Tailwind 的 `bg-[color]` 与 CSS 自定义属性结合，实现灵活调度。"}]]}],["$","div",null,{"className":"flex items-center gap-4","children":[["$","div",null,{"className":"h-10 w-24 rounded-full border border-[rgba(10,10,10,0.08)]","style":{"backgroundImage":"var(--energy-gold-gradient)"}}],["$","div",null,{"className":"text-xs text-[rgba(10,10,10,0.55)]","children":"金生水 · 能量循环演示"}]]}]]}]}]]}]}],null],null],null]},[null,["$","$L2",null,{"parallelRouterKey":"children","segmentPath":["children","style-preview","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L3",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/544674a05c909039.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","children":[["$","head",null,{"children":[["$","link",null,{"rel":"dns-prefetch","href":"https://pub-2868c824f92441499577980a0b61114c.r2.dev"}],["$","link",null,{"rel":"preconnect","href":"https://pub-2868c824f92441499577980a0b61114c.r2.dev","crossOrigin":"anonymous"}],["$","link",null,{"rel":"alternate","hrefLang":"en","href":"https://sora2aivideos.com"}],["$","link",null,{"rel":"alternate","hrefLang":"en-US","href":"https://sora2aivideos.com"}],["$","link",null,{"rel":"alternate","hrefLang":"ar","href":"https://sora2aivideos.com?lang=ar"}],["$","link",null,{"rel":"alternate","hrefLang":"ar-SA","href":"https://sora2aivideos.com?lang=ar-SA"}],["$","link",null,{"rel":"alternate","hrefLang":"x-default","href":"https://sora2aivideos.com"}],["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"Organization\",\"name\":\"Best Sora Alternative\",\"url\":\"https://sora2aivideos.com\",\"logo\":\"https://sora2aivideos.com/icon.svg\",\"description\":\"Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.\",\"sameAs\":[],\"contactPoint\":{\"@type\":\"ContactPoint\",\"contactType\":\"Customer Support\",\"url\":\"https://sora2aivideos.com/support\"}}"}}],["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"WebSite\",\"name\":\"Best Sora Alternative\",\"url\":\"https://sora2aivideos.com\",\"description\":\"Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.\",\"potentialAction\":{\"@type\":\"SearchAction\",\"target\":{\"@type\":\"EntryPoint\",\"urlTemplate\":\"https://sora2aivideos.com/prompts?search={search_term_string}\"},\"query-input\":\"required name=search_term_string\"}}"}}],["$","$L4",null,{"src":"https://js.stripe.com/v3/buy-button.js","strategy":"lazyOnload"}]]}],["$","body",null,{"children":[["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$5"}}],["$","div",null,{"className":"flex min-h-screen flex-col","children":[["$","main",null,{"className":"flex-1","children":["$","$L2",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$6","errorStyles":[],"errorScripts":[],"template":["$","$L3",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]}],["$","footer",null,{"className":"border-t border-energy-gold-outline bg-white/90 px-4 py-6 text-sm text-gray-600 backdrop-blur dark:border-gray-700 dark:bg-gray-900/85 dark:text-gray-300","children":["$","div",null,{"className":"mx-auto w-full max-w-7xl space-y-4","children":[["$","div",null,{"className":"flex flex-col items-center justify-between gap-4 sm:flex-row","children":[["$","p",null,{"className":"text-center sm:text-left","children":"This service complies with applicable United States laws and regulations and is offered to enterprise customers. For information about data handling and compliance, please review the following documents."}],["$","div",null,{"className":"flex flex-wrap items-center gap-3","children":[["$","$L7",null,{"href":"/terms","className":"inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800","children":"Terms of Service"}],["$","$L7",null,{"href":"/privacy","className":"inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800","children":"Privacy Policy"}]]}]]}],["$","div",null,{"className":"border-t border-energy-gold-outline/30 pt-4 text-center text-xs text-gray-500 dark:text-gray-400","children":["$","p",null,{"children":[["$","strong",null,{"children":"Data Usage Transparency:"}]," We use Google Sign-In to securely authenticate your account. We only request your email address and basic profile information (name, profile picture) to create your account and provide personalized video generation services. Your data is encrypted and stored securely. For more information, please review our"," ",["$","$L7",null,{"href":"/privacy","className":"font-medium underline-offset-4 hover:underline text-energy-deep dark:text-energy-soft","children":"Privacy Policy"}],"."]}]}]]}]}]]}],["$","$L8",null,{}],["$","$L9",null,{}]]}]]}]],null],null],["$La",null]]]]
a:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Sora Alternative – Best AI Video Generators Like OpenAI Sora"}],["$","meta","3",{"name":"description","content":"Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today."}],["$","link","4",{"rel":"canonical","href":"https://sora2aivideos.com"}],["$","link","5",{"rel":"alternate","hrefLang":"en","href":"https://sora2aivideos.com"}],["$","link","6",{"rel":"alternate","hrefLang":"en-US","href":"https://sora2aivideos.com"}],["$","link","7",{"rel":"alternate","hrefLang":"ar","href":"https://sora2aivideos.com?lang=ar"}],["$","link","8",{"rel":"alternate","hrefLang":"ar-SA","href":"https://sora2aivideos.com?lang=ar-SA"}],["$","link","9",{"rel":"alternate","hrefLang":"x-default","href":"https://sora2aivideos.com"}],["$","meta","10",{"property":"og:title","content":"Sora Alternative – Best AI Video Generators Like OpenAI Sora"}],["$","meta","11",{"property":"og:description","content":"Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today."}],["$","meta","12",{"property":"og:url","content":"https://sora2aivideos.com"}],["$","meta","13",{"property":"og:site_name","content":"Best Sora Alternative"}],["$","meta","14",{"property":"og:locale","content":"en_US"}],["$","meta","15",{"property":"og:locale:alternate","content":"ar_SA"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary"}],["$","meta","18",{"name":"twitter:title","content":"Sora Alternative – Best AI Video Generators Like OpenAI Sora"}],["$","meta","19",{"name":"twitter:description","content":"Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today."}],["$","link","20",{"rel":"icon","href":"/icon.svg"}]]
1:null
