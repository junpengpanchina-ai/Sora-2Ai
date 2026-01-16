(()=>{var e={};e.id=1929,e.ids=[1929],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},15338:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>n.Z,__next_app__:()=>u,originalPathname:()=>c,pages:()=>d,routeModule:()=>g,tree:()=>l}),r(86637),r(11506),r(26083),r(35866);var a=r(23191),s=r(88716),n=r(48001),i=r(95231),o={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>i[e]);r.d(t,o);let l=["",{children:["chat",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,86637)),"/Users/p/Documents/GitHub/Sora-2Ai/app/chat/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,11506)),"/Users/p/Documents/GitHub/Sora-2Ai/app/layout.tsx"],error:[()=>Promise.resolve().then(r.bind(r,26083)),"/Users/p/Documents/GitHub/Sora-2Ai/app/error.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,35866,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/p/Documents/GitHub/Sora-2Ai/app/chat/page.tsx"],c="/chat/page",u={require:r,loadChunk:()=>Promise.resolve()},g=new a.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/chat/page",pathname:"/chat",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},77453:(e,t,r)=>{Promise.resolve().then(r.bind(r,46627))},46627:(e,t,r)=>{"use strict";r.d(t,{default:()=>c});var a=r(10326),s=r(17577),n=r(985),i=r(90434),o=r(57317);function l({onSelectTemplate:e,onClose:t}){let[r,i]=(0,s.useState)(null),[l,d]=(0,s.useState)({}),[c,u]=(0,s.useState)(""),g=e=>{i(e);let t={};e.parameters.forEach(e=>{t[e.key]=""}),d(t),u("")},m=(e,t)=>{d(a=>{let s={...a,[e]:t};return r&&u((0,o.SM)(r.template,s)),s})};return a.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",children:(0,a.jsxs)("div",{className:"w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-gray-900",children:[a.jsx("div",{className:"sticky top-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900",children:(0,a.jsxs)("div",{className:"flex items-center justify-between",children:[a.jsx("h2",{className:"text-xl font-semibold text-gray-900 dark:text-white",children:"SEO 内容生成模板"}),a.jsx(n.zx,{variant:"ghost",size:"sm",onClick:t,children:"✕"})]})}),a.jsx("div",{className:"p-6",children:r?(0,a.jsxs)("div",{className:"space-y-6",children:[a.jsx(n.zx,{variant:"ghost",size:"sm",onClick:()=>i(null),children:"← 返回模板列表"}),(0,a.jsxs)("div",{children:[a.jsx("h3",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:r.name}),a.jsx("p",{className:"mt-1 text-sm text-gray-600 dark:text-gray-400",children:r.description})]}),(0,a.jsxs)("div",{className:"space-y-4",children:[a.jsx("h4",{className:"font-medium text-gray-900 dark:text-white",children:"填写参数："}),r.parameters.map(e=>(0,a.jsxs)("div",{children:[(0,a.jsxs)("label",{className:"mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300",children:[e.label,e.required&&a.jsx("span",{className:"text-red-500",children:" *"})]}),a.jsx("input",{type:"text",value:l[e.key]||"",onChange:t=>m(e.key,t.target.value),placeholder:e.placeholder||`请输入${e.label}`,className:"w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"})]},e.key))]}),c&&(0,a.jsxs)("div",{children:[a.jsx("h4",{className:"mb-2 font-medium text-gray-900 dark:text-white",children:"预览 Prompt："}),a.jsx("div",{className:"max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs dark:border-gray-700 dark:bg-gray-800",children:a.jsx("pre",{className:"whitespace-pre-wrap text-gray-700 dark:text-gray-300",children:c})})]}),(0,a.jsxs)("div",{className:"flex gap-2",children:[a.jsx(n.zx,{onClick:()=>{if(!r)return;let a=r.parameters.filter(e=>e.required&&(!l[e.key]||""===l[e.key].trim())).map(e=>e.label);if(a.length>0){alert(`请填写必填参数：${a.join("、")}`);return}e((0,o.SM)(r.template,l)),t()},className:"flex-1",children:"使用此模板"}),a.jsx(n.zx,{variant:"secondary",onClick:()=>i(null),children:"取消"})]})]}):a.jsx("div",{className:"grid gap-4 md:grid-cols-2",children:o.Le.map(e=>(0,a.jsxs)("button",{onClick:()=>g(e),className:"rounded-lg border-2 border-gray-200 bg-white p-4 text-left transition hover:border-energy-water hover:bg-energy-water/5 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-energy-water",children:[a.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white",children:e.name}),a.jsx("p",{className:"mt-1 text-sm text-gray-600 dark:text-gray-400",children:e.description}),(0,a.jsxs)("div",{className:"mt-3 flex flex-wrap gap-2",children:[e.parameters.slice(0,3).map(e=>(0,a.jsxs)("span",{className:"rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300",children:[e.label,e.required&&" *"]},e.key)),e.parameters.length>3&&(0,a.jsxs)("span",{className:"rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300",children:["+",e.parameters.length-3]})]})]},e.id))})})]})})}let d=[{value:"gemini-2.5-flash",label:"gemini-2.5-flash ⭐ 推荐 - 大量内容首选",price:"Input: ￥0.1~￥0.2 /M tokens | Output: ￥0.4~￥0.8 /M tokens",strategy:"适合：使用场景、对比文章、关键词解释、教程指南等大量内容（占网站 90% 内容）"},{value:"gemini-2.5-pro",label:"gemini-2.5-pro \uD83D\uDC8E 核心内容",price:"价格较高",strategy:"适合：首页主框架、重点流量词、顶级 pillar page（5000+ 字）、高竞争关键词、权威内容（全站 10-20 篇）"},{value:"gemini-2.5-flash-lite",label:"gemini-2.5-flash-lite",price:"Input: ￥0.1~￥0.2 /M tokens | Output: ￥0.4~￥0.8 /M tokens",strategy:"轻量级模型，适合简单内容"},{value:"gemini-3-pro",label:"gemini-3-pro"},{value:"gpt-4o-mini",label:"gpt-4o-mini"},{value:"nano-banana-fast",label:"nano-banana-fast"},{value:"nano-banana",label:"nano-banana"}];function c(){let[e,t]=(0,s.useState)([]),[r,o]=(0,s.useState)(""),[c,u]=(0,s.useState)(!1),[g,m]=(0,s.useState)("gemini-2.5-flash"),[p,h]=(0,s.useState)("You are a professional SEO content assistant, specializing in generating high-quality content for use cases, comparisons, and other SEO purposes. All output must be in English."),[x,y]=(0,s.useState)(!1),[b,f]=(0,s.useState)(!1),v=(0,s.useRef)(null),k=(0,s.useRef)(null),w=(0,s.useCallback)(async()=>{if(!r.trim()||c)return;let a={id:Date.now().toString(),role:"user",content:r.trim(),timestamp:new Date};t(e=>[...e,a]),o(""),u(!0);try{let r=[];p.trim()&&r.push({role:"system",content:p.trim()});let s=e.filter(e=>"system"!==e.role).map(e=>({role:e.role,content:e.content}));r.push(...s),r.push({role:"user",content:a.content});let n=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:g,stream:!0,messages:r})});if(!n.ok){let e=await n.json().catch(()=>({}));throw Error(e.error||`HTTP ${n.status}`)}let i=n.body?.getReader();if(!i)throw Error("无法读取流式响应");let o=new TextDecoder,l="",d="",c=(Date.now()+1).toString(),u={id:c,role:"assistant",content:"",timestamp:new Date};for(t(e=>[...e,u]);;){let{done:e,value:r}=await i.read();if(e)break;let a=(l+=o.decode(r,{stream:!0})).split("\n");for(let e of(l=a.pop()||"",a)){let r=e.trim();if(r&&"data: [DONE]"!==r&&r.startsWith("data: "))try{let e=JSON.parse(r.slice(6));if(e.choices&&e.choices.length>0){let r=e.choices[0].delta;r?.content&&(d+=r.content,t(e=>{let t=[...e],r=t.length-1;return r>=0&&t[r].id===c&&(t[r]={...t[r],content:d}),t}))}}catch(e){console.warn("解析流式响应失败:",r,e)}}}}catch(a){console.error("Chat API 错误:",a);let e=a instanceof Error?a.message:"请求失败",r={id:Date.now().toString(),role:"assistant",content:`错误: ${e}`,timestamp:new Date};t(e=>[...e,r])}finally{u(!1)}},[r,c,e,g,p]);return(0,a.jsxs)("div",{className:"flex h-screen flex-col bg-gray-50 dark:bg-gray-950",children:[a.jsx("header",{className:"border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900",children:(0,a.jsxs)("div",{className:"mx-auto flex max-w-4xl items-center justify-between",children:[(0,a.jsxs)("div",{className:"flex items-center gap-3",children:[a.jsx("h1",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:"AI 文案助手"}),a.jsx("span",{className:"rounded-full bg-energy-water/10 px-2 py-0.5 text-xs font-medium text-energy-water",children:g})]}),(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[a.jsx(n.zx,{variant:"ghost",size:"sm",onClick:()=>f(!0),children:"\uD83D\uDCDD 模板"}),a.jsx(n.zx,{variant:"ghost",size:"sm",onClick:()=>y(!x),children:"⚙️ 设置"}),a.jsx(i.default,{href:"/",className:"text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",children:"返回首页"})]})]})}),x&&a.jsx("div",{className:"border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900",children:(0,a.jsxs)("div",{className:"mx-auto max-w-4xl space-y-3",children:[(0,a.jsxs)("div",{children:[a.jsx("label",{className:"mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300",children:"模型选择"}),a.jsx("select",{className:"w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",value:g,onChange:e=>m(e.target.value),children:d.map(e=>a.jsx("option",{value:e.value,children:e.label},e.value))}),d.find(e=>e.value===g)?.strategy&&(0,a.jsxs)("div",{className:"mt-2 rounded-lg bg-green-50 p-3 text-xs text-gray-700 dark:bg-green-900/20 dark:text-gray-300",children:[a.jsx("p",{className:"font-medium text-gray-900 dark:text-gray-100 mb-1",children:"\uD83D\uDCCC 使用场景："}),a.jsx("p",{children:d.find(e=>e.value===g)?.strategy})]}),(0,a.jsxs)("div",{className:"mt-2 rounded-lg bg-blue-50 p-3 text-xs text-gray-600 dark:bg-blue-900/20 dark:text-gray-400",children:[a.jsx("p",{className:"font-medium text-gray-900 dark:text-gray-200 mb-1",children:"\uD83D\uDCA1 Token 计费说明："}),(0,a.jsxs)("ul",{className:"space-y-1 ml-4 list-disc",children:[(0,a.jsxs)("li",{children:[a.jsx("strong",{children:"Input tokens"}),"：你发送的内容（问题 + 历史对话 + 系统提示词）"]}),(0,a.jsxs)("li",{children:[a.jsx("strong",{children:"Output tokens"}),"：AI 生成回复的内容"]}),a.jsx("li",{children:a.jsx("strong",{children:"1M = 100万 tokens"})}),d.find(e=>e.value===g)?.price&&(0,a.jsxs)("li",{className:"mt-2 pt-2 border-t border-blue-200 dark:border-blue-800",children:[a.jsx("strong",{children:"当前模型价格："}),a.jsx("div",{className:"mt-1 font-mono text-xs",children:d.find(e=>e.value===g)?.price})]})]})]}),(0,a.jsxs)("div",{className:"mt-2 rounded-lg bg-amber-50 p-3 text-xs text-gray-700 dark:bg-amber-900/20 dark:text-gray-300",children:[a.jsx("p",{className:"font-medium text-gray-900 dark:text-gray-100 mb-1",children:"\uD83C\uDFAF 最佳策略："}),(0,a.jsxs)("ul",{className:"space-y-1 ml-4 list-disc",children:[(0,a.jsxs)("li",{children:[a.jsx("strong",{children:"大量内容（90%）"}),"：使用 ",a.jsx("code",{className:"bg-amber-100 dark:bg-amber-900/30 px-1 rounded",children:"gemini-2.5-flash"})]}),(0,a.jsxs)("li",{children:[a.jsx("strong",{children:"核心内容（10%）"}),"：使用 ",a.jsx("code",{className:"bg-amber-100 dark:bg-amber-900/30 px-1 rounded",children:"gemini-2.5-pro"})]}),a.jsx("li",{children:"一天产几十至几百篇，成本可控，质量保证"})]})]})]}),(0,a.jsxs)("div",{children:[a.jsx("label",{className:"mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300",children:"系统提示词"}),a.jsx("textarea",{className:"w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",value:p,onChange:e=>h(e.target.value),rows:3,placeholder:"你是一个专业的 SEO 文案助手..."})]})]})}),a.jsx("div",{className:"flex-1 overflow-y-auto",children:a.jsx("div",{className:"mx-auto max-w-4xl px-4 py-6",children:0===e.length?a.jsx("div",{className:"flex h-full items-center justify-center",children:(0,a.jsxs)("div",{className:"text-center",children:[a.jsx("h2",{className:"mb-2 text-2xl font-semibold text-gray-900 dark:text-white",children:"开始对话"}),a.jsx("p",{className:"text-gray-600 dark:text-gray-400",children:"输入你的问题，AI 助手会帮助你生成专业的文案内容"}),(0,a.jsxs)("div",{className:"mt-6 space-y-2 text-left",children:[a.jsx("p",{className:"text-sm font-medium text-gray-700 dark:text-gray-300",children:"示例问题："}),a.jsx("button",{onClick:()=>o('为"AI 做 YouTube 视频"这个使用场景写一篇 SEO 文案'),className:"block w-full rounded-lg border border-gray-200 bg-white p-3 text-left text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",children:"\uD83D\uDCA1 为“AI 做 YouTube 视频”这个使用场景写一篇 SEO 文案"}),a.jsx("button",{onClick:()=>o('写一篇"Sora vs Runway"的对比文案'),className:"block w-full rounded-lg border border-gray-200 bg-white p-3 text-left text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",children:"\uD83D\uDCA1 写一篇“Sora vs Runway”的对比文案"}),a.jsx("button",{onClick:()=>o('为长尾词"ai video generator for youtube"写一篇 SEO 页面内容'),className:"block w-full rounded-lg border border-gray-200 bg-white p-3 text-left text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",children:"\uD83D\uDCA1 为长尾词“ai video generator for youtube”写一篇 SEO 页面内容"})]})]})}):(0,a.jsxs)("div",{className:"space-y-6",children:[e.map(e=>(0,a.jsxs)("div",{className:`flex gap-4 ${"user"===e.role?"justify-end":"justify-start"}`,children:["assistant"===e.role&&a.jsx("div",{className:"flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-energy-water text-white",children:"AI"}),(0,a.jsxs)("div",{className:`group relative max-w-[80%] rounded-2xl px-4 py-3 ${"user"===e.role?"bg-energy-water text-white":"bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"}`,children:[a.jsx("div",{className:"whitespace-pre-wrap text-sm leading-relaxed",children:e.content}),"assistant"===e.role&&e.content&&a.jsx("button",{onClick:()=>{navigator.clipboard.writeText(e.content)},className:"absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100",title:"复制",children:a.jsx("svg",{className:"h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:a.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"})})})]}),"user"===e.role&&a.jsx("div",{className:"flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200",children:"你"})]},e.id)),c&&(0,a.jsxs)("div",{className:"flex gap-4 justify-start",children:[a.jsx("div",{className:"flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-energy-water text-white",children:"AI"}),a.jsx("div",{className:"rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-gray-800",children:(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[a.jsx("div",{className:"h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"}),a.jsx("div",{className:"h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"}),a.jsx("div",{className:"h-2 w-2 animate-bounce rounded-full bg-gray-400"})]})})]}),a.jsx("div",{ref:v})]})})}),a.jsx("div",{className:"border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900",children:(0,a.jsxs)("div",{className:"mx-auto max-w-4xl",children:[(0,a.jsxs)("div",{className:"flex items-end gap-2",children:[a.jsx("div",{className:"flex-1 rounded-lg border border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800",children:a.jsx("textarea",{ref:k,value:r,onChange:e=>o(e.target.value),onKeyDown:e=>{"Enter"===e.key&&(e.metaKey||e.ctrlKey)&&(e.preventDefault(),w())},placeholder:"输入你的问题... (Cmd/Ctrl + Enter 发送)",className:"w-full resize-none border-0 bg-transparent px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none dark:text-gray-100 dark:placeholder-gray-400",rows:1,style:{minHeight:"52px",maxHeight:"200px"},onInput:e=>{let t=e.target;t.style.height="auto",t.style.height=`${Math.min(t.scrollHeight,200)}px`}})}),a.jsx(n.zx,{onClick:w,disabled:!r.trim()||c,className:"h-12 px-6",children:c?a.jsx("div",{className:"h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"}):"发送"}),e.length>0&&a.jsx(n.zx,{variant:"ghost",onClick:()=>{t([])},disabled:c,className:"h-12",children:"清空"})]}),a.jsx("p",{className:"mt-2 text-xs text-gray-500 dark:text-gray-400",children:"按 Cmd/Ctrl + Enter 发送，Shift + Enter 换行"})]})}),b&&a.jsx(l,{onSelectTemplate:e=>{o(e),f(!1),k.current?.focus()},onClose:()=>f(!1)})]})}},57317:(e,t,r)=>{"use strict";r.d(t,{Le:()=>a,SM:()=>s});let a=[{id:"use-case",name:"使用场景页面生成",description:"批量生成使用场景介绍页面（适合 90% 内容）",parameters:[{key:"scene",label:"使用场景",required:!0,placeholder:"例如：健身课程视频"},{key:"industry",label:"目标行业",required:!1,placeholder:"例如：体育培训"},{key:"keyword",label:"目标关键词",required:!1,placeholder:"例如：ai fitness video generator"},{key:"style",label:"视频风格",required:!1,placeholder:"例如：真实写实、动漫、商业"}],template:`You are an experienced SEO content writer specializing in both SEO (Google ranking) and GEO (Generative Engine Optimization - AI search citation). Generate a high-quality, indexable use case page for an AI video generation platform (Sora2) that can be directly quoted by ChatGPT, Gemini, and Perplexity. All content must be in English.

CRITICAL: The AI video platform ONLY supports 10-second or 15-second videos. NEVER mention any duration longer than 15 seconds (such as 20 seconds, 30 seconds, 45 seconds, 60 seconds, 1 minute, 2 minutes, etc.). When describing video examples, ALWAYS use "10 seconds" or "15 seconds" only.

【Platform Features】
- Text-to-video generation
- Image-to-video generation
- Multiple styles (realistic, anime, commercial, educational)
- Video duration: 10 seconds or 15 seconds (NOT 2 minutes or longer)
- Can generate product videos, marketing videos, educational content, TikTok videos, etc.

【Content Requirements】
- Do not stuff keywords
- Natural, human-like tone
- Each paragraph should be 60-120 words
- Fixed structure with H2/H3 headings
- All content must be in English
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds". NEVER mention "2 minutes", "1 minute", or any duration longer than 15 seconds.

【GEO Optimization Requirements】
1. Answer-First Structure (GEO-1): Start with "In [industry], AI-generated videos are commonly used for [use case]." Follow with typical applications list (noun phrases).
2. List Format (GEO-2): Use noun phrases, NOT marketing sentences (e.g., "Product demo videos", not "Boost your brand visibility").
3. FAQ Style (GEO-4): Answer questions non-experts would ask (e.g., "Is AI video suitable for [industry]?", "Do I need [equipment]?"). Keep answers 2-4 sentences, no marketing jargon.
4. Industry + Scene + Platform (GEO-5): Must clearly identify at least 2 of: industry, use case scenario, platform.

【Parameters】
Use Case: {{scene}}
Target Industry: {{industry}}
Target Keyword: {{keyword}}
Video Style: {{style}}

【Content Structure - SEO + GEO Optimized】
H1: [Main title based on the use case, e.g., "AI Video Generation for {{scene}}"]

H2: Introduction (GEO-1: Answer-First Structure - 150-200 words)
Start with: "In {{industry}}, AI-generated videos are commonly used for {{scene}}."
Follow with:
- Typical applications include: [list of noun phrases]
- This page explains how teams use AI video tools for this purpose, which platforms are most suitable, and practical steps to get started.

🛡️ AUTHORITATIVENESS ANCHOR (After Answer-first paragraph):
Add this sentence immediately after the Answer-first paragraph (1-2 sentences, factual, non-promotional):
"This page is part of a structured knowledge base on AI video use cases, covering multiple industries and scenarios."
Purpose: Tell AI this is a systematic knowledge base, not an isolated page.

H2: Why AI video is suitable for this scenario (3-5 points)
Use noun phrases in lists:
✅ Good: "Product demo videos", "Onboarding clips", "Social media ads"
❌ Bad: "Boost your brand visibility", "Increase engagement dramatically"

H2: What Sora2 can do in this scenario (3-6 sub-scenarios with H3 headings)
List format with noun phrases

🛡️ INDUSTRY CONSTRAINTS (After "Why AI video is suitable", before "What Sora2 can do"):
H2: Industry Constraints and Considerations

Add a 2-3 sentence paragraph about real limitations specific to {{industry}}:
"In the {{industry}} sector, AI-generated video may have limitations when [specific constraint 1], [specific constraint 2], or [specific constraint 3]. Teams should consider [consideration] before applying this approach to [specific scenario]."

Purpose: Provide industry-specific constraints to reduce thin content and template spam risks.

H2: Video generation examples (text-to-video examples)
Use noun phrases for examples

H2: Frequently Asked Questions (GEO-4: "傻问题化" - Answer questions non-experts would ask)
Must include at least 3 questions. You MUST include at least 1 FAQ-A (beginner cognitive) AND at least 1 FAQ-B (decision boundary).

🛡️ FAQ-A (Beginner Cognitive - Newcomer Questions):
- "Is AI video suitable for {{industry}}?"
- "Do I need filming equipment for {{scene}}?"
- "Is this expensive?"
- "Can small teams use this?"

🛡️ FAQ-B (Decision Boundary - When NOT to Use):
- "When should AI video not be used in {{industry}}?"
- "What are common limitations of AI-generated video for {{scene}}?"
- "What scenarios are not suitable for AI-generated video in {{industry}}?"

Keep answers 2-4 sentences, no marketing jargon. FAQ-B answers should be honest about limitations.

H2: Target Audience / Applicable Industries

IMPORTANT: You MUST start with an H1 heading (single #). The H1 should be the main title of the page.

Please output high-quality SEO + GEO optimized content in English.`},{id:"long-tail-keyword",name:"长尾关键词页面生成",description:"批量生成长尾关键词解释页面（提高收录）",parameters:[{key:"keyword",label:"关键词",required:!0,placeholder:"例如：ai fitness video generator"},{key:"scene",label:"相关使用场景",required:!1,placeholder:"例如：健身课程视频"},{key:"industry",label:"行业",required:!1,placeholder:"例如：体育培训"}],template:`You are an SEO content expert. Please generate a dedicated long-tail keyword page based on the following parameters.

【Parameters】
Keyword: {{keyword}}
Related Use Case: {{scene}}
Industry: {{industry}}

【Writing Requirements】
- Use natural language, do not stuff keywords
- Each paragraph: 60-100 words
- Total length: 400-700 words (suitable for long-tail keyword pages)
- Friendly, readable, informative
- All content must be in English
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds". NEVER mention "2 minutes", "1 minute", or any duration longer than 15 seconds.

【Page Structure】
H1: What is {{keyword}}?
H2: Its practical business applications
H2: A simple example (explain with a story or scenario)
H2: How to solve this problem with AI video (Sora2)
H2: Frequently Asked Questions (2-3 questions)

Please output high-quality content in English.`},{id:"blog-post",name:"博客文章生成",description:"生成高质量博客文章（Pillar + Cluster，抢竞争词流量）",parameters:[{key:"title",label:"文章标题",required:!0,placeholder:"例如：Best Sora Alternatives for Creators"},{key:"keyword",label:"目标关键词",required:!0,placeholder:"例如：sora alternative"},{key:"audience",label:"读者群体",required:!1,placeholder:"例如：内容创作者、营销人员"},{key:"scene",label:"相关场景",required:!1,placeholder:"例如：YouTube 视频制作"}],template:`You are a professional SEO blog writer. Please generate a high-quality blog article based on the article title and target keyword.

【Parameters】
Article Title: {{title}}
Target Keyword: {{keyword}}
Target Audience: {{audience}}
Related Scenario: {{scene}}

【Overall Requirements】
- Clear structure with logical paragraphs
- Do not stuff keywords or repeat content
- Use real examples
- Write like a human, avoid AI-like tone
- Content must satisfy search intent
- Word count: 1500-2500 words
- Fixed H2/H3 structure as below
- All content must be in English
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds". NEVER mention "2 minutes", "1 minute", or any duration longer than 15 seconds.

【Article Structure Template】
H1: {{title}}
H2: What problem does this article solve? (Introduction)
H2: Core concept explanation (related to keyword)
H2: Common misconceptions (3-5 points)
H2: How to truly solve this problem (step-by-step explanation)
H2: Applications of AI video (Sora2) in this scenario
    H3: Sub-scenario 1
    H3: Sub-scenario 2
    H3: Sub-scenario 3
H2: Real-world examples (can be fictional but must be specific)
H2: Conclusion (give readers a clear takeaway)

Please output high-quality SEO blog content in English.`},{id:"industry-page",name:"行业页面生成",description:"生成特定行业的介绍页面（可扩展后台功能）",parameters:[{key:"industry",label:"行业",required:!0,placeholder:"例如：教育行业、电商行业"},{key:"keyword",label:"关键词",required:!1,placeholder:"例如：ai video for education"}],template:`You are an SEO content expert. Please generate an industry-specific introduction page.

【Parameters】
Industry: {{industry}}
Keyword: {{keyword}}

【Writing Requirements】
- Emphasize industry pain points
- Combine with the practical value of AI video
- List real application scenarios (avoid generic statements)
- All content must be in English
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds". NEVER mention "2 minutes", "1 minute", or any duration longer than 15 seconds.

【Structure】
H1: Applications of AI Video in the {{industry}} Industry
H2: Problems facing the industry (4-6 points)
H2: Why AI video is suitable for this industry
H2: Typical application scenarios of Sora2 in this industry
    H3: Scenario 1
    H3: Scenario 2
    H3: Scenario 3
H2: Video generation examples
H2: Conclusion (provide industry future trends)

Please output high-quality SEO content in English.`},{id:"compare-page",name:"对比页面生成",description:"生成工具对比页面（Sora vs 其他工具）",parameters:[{key:"tool_a",label:"工具 A（默认 Sora）",required:!1,placeholder:"例如：OpenAI Sora"},{key:"tool_b",label:"工具 B",required:!0,placeholder:"例如：Runway、Pika、Luma"},{key:"keyword",label:"目标关键词",required:!1,placeholder:"例如：sora vs runway"}],template:`You are a professional tool comparison article writer. Please generate an AI video tool comparison page.

【Parameters】
Tool A: {{tool_a}} (default: OpenAI Sora)
Tool B: {{tool_b}}
Target Keyword: {{keyword}}

【Writing Requirements】
- Objective, fair, data-supported
- Do not favor any side
- Use real comparison points
- Clear structure, easy to read
- All content must be in English
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds". NEVER mention "2 minutes", "1 minute", or any duration longer than 15 seconds.

【Structure】
H1: {{tool_a}} vs {{tool_b}}: Which AI Video Generator is Better?
H2: Quick Comparison Table (price, features, quality, speed, etc.)
H2: Advantages of {{tool_a}} (3-5 points)
H2: Advantages of {{tool_b}} (3-5 points)
H2: Detailed Feature Comparison
    H3: Video Quality
    H3: Generation Speed
    H3: Price Comparison
    H3: Ease of Use
H2: Recommended Use Cases
    H3: Scenarios for choosing {{tool_a}}
    H3: Scenarios for choosing {{tool_b}}
H2: Conclusion and Recommendations

Please output high-quality comparison content in English.`}];function s(e,t){let r=e;for(let[e,a]of Object.entries(t)){let t=`{{${e}}}`;r=a&&""!==a.trim()?r.replace(RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"),a.trim()):(r=r.replace(RegExp(`^.*${t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}.*$`,"gm"),"")).replace(RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"),"")}return(r=r.replace(/\n{3,}/g,"\n\n")).trim()}},90434:(e,t,r)=>{"use strict";r.d(t,{default:()=>s.a});var a=r(79404),s=r.n(a)},86637:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>i,metadata:()=>n});var a=r(19510);let s=(0,r(68570).createProxy)(String.raw`/Users/p/Documents/GitHub/Sora-2Ai/app/chat/ChatClient.tsx#default`),n={title:"AI Chat - 文案助手 | Sora Alternative",description:"使用 AI 助手为你的场景应用、对比词等生成专业文案"};function i(){return a.jsx(s,{})}},97049:(e,t,r)=>{"use strict";e.exports=r(23191).vendored["react-rsc"].ReactDOM},51749:(e,t,r)=>{"use strict";e.exports=r(23191).vendored["react-rsc"].ReactServerDOMWebpackServerEdge},38238:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"ReflectAdapter",{enumerable:!0,get:function(){return r}});class r{static get(e,t,r){let a=Reflect.get(e,t,r);return"function"==typeof a?a.bind(e):a}static set(e,t,r,a){return Reflect.set(e,t,r,a)}static has(e,t){return Reflect.has(e,t)}static deleteProperty(e,t){return Reflect.deleteProperty(e,t)}}}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[8948,111,5266],()=>r(15338));module.exports=a})();