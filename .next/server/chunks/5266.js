exports.id=5266,exports.ids=[5266],exports.modules={72881:(e,r,t)=>{Promise.resolve().then(t.bind(t,67733))},63748:(e,r,t)=>{Promise.resolve().then(t.bind(t,27670))},18630:(e,r,t)=>{Promise.resolve().then(t.bind(t,54452)),Promise.resolve().then(t.bind(t,60270)),Promise.resolve().then(t.t.bind(t,79404,23)),Promise.resolve().then(t.t.bind(t,44064,23))},2891:(e,r,t)=>{Promise.resolve().then(t.t.bind(t,12994,23)),Promise.resolve().then(t.t.bind(t,96114,23)),Promise.resolve().then(t.t.bind(t,9727,23)),Promise.resolve().then(t.t.bind(t,79671,23)),Promise.resolve().then(t.t.bind(t,41868,23)),Promise.resolve().then(t.t.bind(t,84759,23))},67733:(e,r,t)=>{"use strict";t.r(r),t.d(r,{default:()=>s});var a=t(10326);t(17577);var o=t(985);function s({error:e,reset:r}){return e.message?.includes("removeChild")||e.message?.includes("not a child")||"NotFoundError"===e.name&&e.message?.includes("removeChild")?null:a.jsx("div",{className:"min-h-screen flex items-center justify-center bg-energy-hero dark:bg-energy-hero-dark p-4",children:(0,a.jsxs)("div",{className:"max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center",children:[a.jsx("h2",{className:"text-2xl font-bold text-gray-900 dark:text-white mb-4",children:"Something went wrong!"}),a.jsx("p",{className:"text-gray-600 dark:text-gray-400 mb-6",children:e.message||"An unexpected error occurred"}),(0,a.jsxs)("div",{className:"flex gap-3 justify-center",children:[a.jsx(o.zx,{variant:"primary",onClick:r,children:"Try again"}),a.jsx(o.zx,{variant:"secondary",onClick:()=>window.location.href="/",children:"Go home"})]})]})})}},27670:(e,r,t)=>{"use strict";t.r(r),t.d(r,{default:()=>s});var a=t(10326);t(17577);var o=t(985);function s({error:e,reset:r}){return e.message?.includes("removeChild")||e.message?.includes("not a child")||"NotFoundError"===e.name&&e.message?.includes("removeChild")?null:a.jsx("html",{children:a.jsx("body",{children:a.jsx("div",{className:"min-h-screen flex items-center justify-center bg-energy-hero dark:bg-energy-hero-dark p-4",children:(0,a.jsxs)("div",{className:"max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center",children:[a.jsx("h2",{className:"text-2xl font-bold text-gray-900 dark:text-white mb-4",children:"Something went wrong!"}),a.jsx("p",{className:"text-gray-600 dark:text-gray-400 mb-6",children:e.message||"An unexpected error occurred"}),(0,a.jsxs)("div",{className:"flex gap-3 justify-center",children:[a.jsx(o.zx,{variant:"primary",onClick:r,children:"Try again"}),a.jsx(o.zx,{variant:"secondary",onClick:()=>window.location.href="/",children:"Go home"})]})]})})})})}},53771:(e,r,t)=>{"use strict";t.d(r,{Z:()=>d});var a=t(10326),o=t(17577),s=t.n(o),n=t(77863);let i=s().forwardRef(({className:e,variant:r="info",title:t,children:o,...s},i)=>(0,a.jsxs)("div",{ref:i,role:"alert",className:(0,n.cn)("rounded-lg p-4 text-sm",{success:"bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400",error:"bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400",warning:"bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",info:"bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft"}[r],e),...s,children:[t&&a.jsx("p",{className:"font-semibold mb-1",children:t}),a.jsx("div",{children:o})]}));i.displayName="Alert";let d=i},85833:(e,r,t)=>{"use strict";t.d(r,{Z:()=>d});var a=t(10326),o=t(17577),s=t.n(o),n=t(77863);let i=s().forwardRef(({className:e,variant:r="default",children:t,...o},s)=>a.jsx("span",{ref:s,className:(0,n.cn)("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",{success:"text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20",error:"text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20",warning:"text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20",info:"text-energy-water bg-energy-water-surface dark:text-energy-soft dark:bg-energy-water-muted",default:"text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800",secondary:"text-energy-deep bg-energy-water-surface ring-1 ring-energy-gold-outline dark:text-white dark:bg-gray-800 dark:ring-gray-600"}[r],e),...o,children:t}));i.displayName="Badge";let d=i},3679:(e,r,t)=>{"use strict";t.d(r,{Z:()=>c});var a=t(10326),o=t(17577),s=t.n(o),n=t(77863);let i={primary:"bg-gradient-to-r from-[#1f75ff] via-[#3f8cff] to-[#6fd6ff] text-white shadow-[0_18px_45px_-18px_rgba(33,122,255,0.75)] hover:brightness-110 active:translate-y-[1px]",secondary:"bg-gradient-to-r from-[#151a2b] via-[#1f2741] to-[#2a3c5f] text-white border border-white/15 shadow-[0_18px_35px_-22px_rgba(4,12,32,0.8)] hover:border-white/40 hover:bg-white/10 active:translate-y-[1px]",danger:"bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",ghost:"text-energy-deep hover:bg-energy-water-surface dark:text-gray-300 dark:hover:bg-gray-800",outline:"border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"},d={sm:"px-3 py-1.5 text-xs",md:"px-4 py-2 text-sm",lg:"px-6 py-3 text-base"},l=s().forwardRef(({className:e,variant:r="primary",size:t="md",isLoading:o,disabled:s,children:l,...c},g)=>a.jsx("button",{ref:g,className:(0,n.cn)("inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed",i[r],d[t],e),disabled:s||o,...c,children:o?(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("svg",{className:"animate-spin -ml-1 mr-2 h-4 w-4",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[a.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),a.jsx("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),a.jsx("span",{children:"Loading..."})]}):l}));l.displayName="Button";let c=l},21021:(e,r,t)=>{"use strict";t.d(r,{Ol:()=>d,Zb:()=>i,aY:()=>c,ll:()=>l});var a=t(10326),o=t(17577),s=t.n(o),n=t(77863);let i=s().forwardRef(({className:e,variant:r="default",children:t,...o},s)=>a.jsx("div",{ref:s,className:(0,n.cn)({default:"rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800",bordered:"rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800",elevated:"rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"}[r],e),...o,children:t}));i.displayName="Card";let d=s().forwardRef(({className:e,children:r,...t},o)=>a.jsx("div",{ref:o,className:(0,n.cn)("mb-4",e),...t,children:r}));d.displayName="CardHeader";let l=s().forwardRef(({className:e,children:r,...t},o)=>a.jsx("h3",{ref:o,className:(0,n.cn)("text-xl font-semibold text-gray-900 dark:text-white",e),...t,children:r}));l.displayName="CardTitle";let c=s().forwardRef(({className:e,children:r,...t},o)=>a.jsx("div",{ref:o,className:(0,n.cn)("",e),...t,children:r}));c.displayName="CardContent"},84231:(e,r,t)=>{"use strict";t.d(r,{Z:()=>d});var a=t(10326),o=t(17577),s=t.n(o),n=t(77863);let i=s().forwardRef(({className:e,label:r,error:t,helperText:o,id:i,...d},l)=>{let c=s().useId(),g=i??c;return(0,a.jsxs)("div",{className:"w-full",children:[r&&(0,a.jsxs)("label",{htmlFor:g,className:"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",children:[r,d.required&&a.jsx("span",{className:"text-red-500 ml-1",children:"*"})]}),a.jsx("input",{ref:l,id:g,className:(0,n.cn)("w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm transition-colors","focus:border-energy-water focus:outline-none focus:ring-energy-water","dark:border-gray-600 dark:bg-gray-700 dark:text-white","disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed","dark:disabled:bg-gray-800 dark:disabled:text-gray-400",t?"border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600":"border-gray-300 dark:border-gray-600",e),"aria-invalid":t?"true":"false","aria-describedby":t?`${g}-error`:o?`${g}-helper`:void 0,...d}),t&&a.jsx("p",{id:`${g}-error`,className:"mt-1 text-sm text-red-600 dark:text-red-400",role:"alert",children:t}),o&&!t&&a.jsx("p",{id:`${g}-helper`,className:"mt-1 text-sm text-gray-500 dark:text-gray-400",children:o})]})});i.displayName="Input";let d=i},71954:(e,r,t)=>{"use strict";t.d(r,{Z:()=>d});var a=t(10326),o=t(17577),s=t.n(o),n=t(77863);let i=s().forwardRef(({className:e,label:r,error:t,helperText:o,id:s,...i},d)=>{let l=s||`textarea-${Math.random().toString(36).substr(2,9)}`;return(0,a.jsxs)("div",{className:"w-full",children:[r&&(0,a.jsxs)("label",{htmlFor:l,className:"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",children:[r,i.required&&a.jsx("span",{className:"text-red-500 ml-1",children:"*"})]}),a.jsx("textarea",{ref:d,id:l,className:(0,n.cn)("w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm transition-colors","focus:border-energy-water focus:outline-none focus:ring-energy-water","dark:border-gray-600 dark:bg-gray-700 dark:text-white","disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed","dark:disabled:bg-gray-800 dark:disabled:text-gray-400",t?"border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600":"border-gray-300 dark:border-gray-600",e),"aria-invalid":t?"true":"false","aria-describedby":t?`${l}-error`:o?`${l}-helper`:void 0,...i}),t&&a.jsx("p",{id:`${l}-error`,className:"mt-1 text-sm text-red-600 dark:text-red-400",role:"alert",children:t}),o&&!t&&a.jsx("p",{id:`${l}-helper`,className:"mt-1 text-sm text-gray-500 dark:text-gray-400",children:o})]})});i.displayName="Textarea";let d=i},985:(e,r,t)=>{"use strict";t.d(r,{bZ:()=>d.Z,Ct:()=>i.Z,zx:()=>a.Z,Zb:()=>o.Zb,aY:()=>o.aY,Ol:()=>o.Ol,ll:()=>o.ll,II:()=>s.Z,gx:()=>n.Z});var a=t(3679),o=t(21021),s=t(84231),n=t(71954),i=t(85833),d=t(53771),l=t(10326),c=t(17577),g=t.n(c),m=t(77863);g().forwardRef(({className:e,value:r,max:t=100,showLabel:a=!1,size:o="md",variant:s="default",...n},i)=>{let d=Math.min(Math.max(r/t*100,0),100),c={sm:"h-2",md:"h-3",lg:"h-4"};return(0,l.jsxs)("div",{ref:i,className:(0,m.cn)("w-full",e),...n,children:[a&&(0,l.jsxs)("div",{className:"flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2",children:[l.jsx("span",{children:"Progress"}),(0,l.jsxs)("span",{children:[Math.round(d),"%"]})]}),l.jsx("div",{className:(0,m.cn)("w-full rounded-full bg-gray-200 dark:bg-gray-700",c[o]),children:l.jsx("div",{className:(0,m.cn)("rounded-full transition-all duration-300",c[o],{default:"bg-energy-water",success:"bg-green-600",warning:"bg-yellow-600",error:"bg-red-600"}[s]),style:{width:`${d}%`},role:"progressbar","aria-valuenow":r,"aria-valuemin":0,"aria-valuemax":t})})]})}).displayName="Progress"},77863:(e,r,t)=>{"use strict";t.d(r,{cn:()=>s});var a=t(41135),o=t(31009);function s(...e){return(0,o.m6)((0,a.W)(e))}},26083:(e,r,t)=>{"use strict";t.r(r),t.d(r,{default:()=>a});let a=(0,t(68570).createProxy)(String.raw`/Users/p/Documents/GitHub/Sora-2Ai/app/error.tsx#default`)},48001:(e,r,t)=>{"use strict";t.d(r,{Z:()=>a});let a=(0,t(68570).createProxy)(String.raw`/Users/p/Documents/GitHub/Sora-2Ai/app/global-error.tsx#default`)},11506:(e,r,t)=>{"use strict";t.r(r),t.d(r,{default:()=>l,metadata:()=>d});var a=t(19510),o=t(57371),s=t(9720),n=t(441),i=t(25787);t(67272);let d={title:{default:"Sora Alternative – Best AI Video Generators Like OpenAI Sora",template:"%s | Best Sora Alternative"},description:"Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today.",icons:{icon:"/icon.svg"},alternates:{canonical:"https://sora2aivideos.com",languages:{en:"https://sora2aivideos.com","en-US":"https://sora2aivideos.com",ar:"https://sora2aivideos.com?lang=ar","ar-SA":"https://sora2aivideos.com?lang=ar-SA","x-default":"https://sora2aivideos.com"}},openGraph:{type:"website",locale:"en_US",alternateLocale:["ar_SA"],url:"https://sora2aivideos.com",siteName:"Best Sora Alternative",title:"Sora Alternative – Best AI Video Generators Like OpenAI Sora",description:"Find the best Sora alternatives for AI video generation. Create stunning text-to-video content with our free AI video generator. Compare top Sora alternatives and start creating videos today."}};function l({children:e}){return(0,a.jsxs)("html",{lang:"en",children:[(0,a.jsxs)("head",{children:[a.jsx("link",{rel:"dns-prefetch",href:"https://pub-2868c824f92441499577980a0b61114c.r2.dev"}),a.jsx("link",{rel:"preconnect",href:"https://pub-2868c824f92441499577980a0b61114c.r2.dev",crossOrigin:"anonymous"}),a.jsx("link",{rel:"alternate",hrefLang:"en",href:"https://sora2aivideos.com"}),a.jsx("link",{rel:"alternate",hrefLang:"en-US",href:"https://sora2aivideos.com"}),a.jsx("link",{rel:"alternate",hrefLang:"ar",href:"https://sora2aivideos.com?lang=ar"}),a.jsx("link",{rel:"alternate",hrefLang:"ar-SA",href:"https://sora2aivideos.com?lang=ar-SA"}),a.jsx("link",{rel:"alternate",hrefLang:"x-default",href:"https://sora2aivideos.com"}),a.jsx("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify({"@context":"https://schema.org","@type":"Organization",name:"Best Sora Alternative",url:"https://sora2aivideos.com",logo:"https://sora2aivideos.com/icon.svg",description:"Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.",sameAs:[],contactPoint:{"@type":"ContactPoint",contactType:"Customer Support",url:"https://sora2aivideos.com/support"}})}}),a.jsx("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify({"@context":"https://schema.org","@type":"WebSite",name:"Best Sora Alternative",url:"https://sora2aivideos.com",description:"Best Sora alternative for AI video generation. Create text-to-video content with our free AI video generator.",potentialAction:{"@type":"SearchAction",target:{"@type":"EntryPoint",urlTemplate:"https://sora2aivideos.com/prompts?search={search_term_string}"},"query-input":"required name=search_term_string"}})}}),a.jsx(s.default,{src:"https://js.stripe.com/v3/buy-button.js",strategy:"lazyOnload"})]}),(0,a.jsxs)("body",{children:[a.jsx("script",{dangerouslySetInnerHTML:{__html:`
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
            `}}),(0,a.jsxs)("div",{className:"flex min-h-screen flex-col",children:[a.jsx("main",{className:"flex-1",children:e}),a.jsx("footer",{className:"border-t border-energy-gold-outline bg-white/90 px-4 py-6 text-sm text-gray-600 backdrop-blur dark:border-gray-700 dark:bg-gray-900/85 dark:text-gray-300",children:(0,a.jsxs)("div",{className:"mx-auto w-full max-w-7xl space-y-4",children:[(0,a.jsxs)("div",{className:"flex flex-col items-center justify-between gap-4 sm:flex-row",children:[a.jsx("p",{className:"text-center sm:text-left",children:"This service complies with applicable United States laws and regulations and is offered to enterprise customers. For information about data handling and compliance, please review the following documents."}),(0,a.jsxs)("div",{className:"flex flex-wrap items-center gap-3",children:[a.jsx(o.default,{href:"/terms",className:"inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800",children:"Terms of Service"}),a.jsx(o.default,{href:"/privacy",className:"inline-flex items-center rounded-full border border-energy-gold-outline px-4 py-2 text-sm font-medium text-energy-deep transition-colors hover:bg-energy-water-surface dark:border-gray-600 dark:text-energy-soft dark:hover:bg-gray-800",children:"Privacy Policy"})]})]}),a.jsx("div",{className:"border-t border-energy-gold-outline/30 pt-4 text-center text-xs text-gray-500 dark:text-gray-400",children:(0,a.jsxs)("p",{children:[a.jsx("strong",{children:"Data Usage Transparency:"})," We use Google Sign-In to securely authenticate your account. We only request your email address and basic profile information (name, profile picture) to create your account and provide personalized video generation services. Your data is encrypted and stored securely. For more information, please review our"," ",a.jsx(o.default,{href:"/privacy",className:"font-medium underline-offset-4 hover:underline text-energy-deep dark:text-energy-soft",children:"Privacy Policy"}),"."]})})]})})]}),a.jsx(n.c,{}),a.jsx(i.c,{})]})]})}},67272:()=>{}};