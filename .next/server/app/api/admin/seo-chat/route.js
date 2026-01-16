"use strict";(()=>{var e={};e.id=4202,e.ids=[4202],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},84770:e=>{e.exports=require("crypto")},24806:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>I,patchFetch:()=>E,requestAsyncStorage:()=>w,routeModule:()=>A,serverHooks:()=>b,staticGenerationAsyncStorage:()=>S});var s={};n.r(s),n.d(s,{GET:()=>f,POST:()=>g,dynamic:()=>h,revalidate:()=>m});var o=n(49303),a=n(88716),r=n(60670),i=n(87070),l=n(64363),c=n(49606);function u(e){let t=e.toLowerCase(),n=[],s="general",o=!1,a=!1,r=["使用场景","use case","场景","应用场景","用途","use case page","场景页面","use case generation","生成使用场景"];r.some(e=>t.includes(e))&&(s="use-case",n.push(...r.filter(e=>t.includes(e))));let i=["关键词","keyword","长尾词","long tail","seo keyword","关键词页面","keyword page","长尾关键词","关键词生成"];i.some(e=>t.includes(e))&&(s="keyword",n.push(...i.filter(e=>t.includes(e))));let l=["博客","blog","文章","article","博客文章","blog post","pillar page","cluster","博客生成","article generation"];l.some(e=>t.includes(e))&&(s="blog",n.push(...l.filter(e=>t.includes(e))));let c=["对比","compare","vs","versus","比较","comparison","对比页面","compare page","工具对比","tool comparison"];c.some(e=>t.includes(e))&&(s="compare",n.push(...c.filter(e=>t.includes(e))));let u=["行业","industry","行业页面","industry page","行业分析","industry analysis"];u.some(e=>t.includes(e))&&(s="industry",n.push(...u.filter(e=>t.includes(e))));let d=["pillar page","cluster content","内容策略","content strategy","seo 策略","seo strategy","内容规划","content planning","关键词研究","keyword research","竞争分析","competitor analysis"];return d.some(e=>t.includes(e))&&(o=!0,n.push(...d.filter(e=>t.includes(e))),(e.length>1500||n.length>=3)&&(a=!0)),{taskType:s,needsAdvancedModel:o,needsProModel:a,keywords:n}}var d=n(23770);let p=[{id:"use-case",name:"使用场景页面生成",description:"批量生成使用场景介绍页面（适合 90% 内容）",parameters:[{key:"scene",label:"使用场景",required:!0,placeholder:"例如：健身课程视频"},{key:"industry",label:"目标行业",required:!1,placeholder:"例如：体育培训"},{key:"keyword",label:"目标关键词",required:!1,placeholder:"例如：ai fitness video generator"},{key:"style",label:"视频风格",required:!1,placeholder:"例如：真实写实、动漫、商业"}],template:`You are an experienced SEO content writer specializing in both SEO (Google ranking) and GEO (Generative Engine Optimization - AI search citation). Generate a high-quality, indexable use case page for an AI video generation platform (Sora2) that can be directly quoted by ChatGPT, Gemini, and Perplexity. All content must be in English.

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

Please output high-quality comparison content in English.`}],h="force-dynamic",m=0;async function g(e){try{let t=await (0,l.i7)();if(!t)return i.NextResponse.json({success:!1,error:"未授权"},{status:401});let{sessionId:n,message:s,images:o=[],model:a,stream:r=!0,saveHistory:h=!0,useTemplate:m,templateId:g,templateParams:f={}}=await e.json();if(!s&&(!o||0===o.length))return i.NextResponse.json({success:!1,error:"消息内容或图片至少需要提供一个"},{status:400});let A=u(s||""),w=a;w||(w=function(e,t=[]){if(t.length>0){let t=u(e);return t.needsProModel?"gemini-3-pro":(t.needsAdvancedModel,"gemini-3-flash")}let n=u(e);return n.needsProModel?"gemini-3-pro":n.needsAdvancedModel?"gemini-3-flash":"gemini-2-flash"}(s||"",o));let S=function(e){let t=`You are a professional SEO content writer and strategist specializing in AI video generation platforms (Sora2). Your expertise includes:

- SEO content generation (use cases, keywords, blog posts, comparison pages)
- Content strategy and planning
- Keyword research and optimization
- On-page SEO optimization
- Content structure and formatting for search engines

All content must be:
- High-quality and indexable
- Natural, human-like tone (no keyword stuffing)
- Properly structured with H1/H2/H3 headings
- Written in English
- Focused on Sora2 platform capabilities

When generating content, always:
- Start with an H1 heading
- Use clear, logical structure
- Include specific examples and use cases
- Emphasize Sora2's actual features and benefits
- Follow SEO best practices (proper heading hierarchy, natural keyword usage, etc.)

IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds". NEVER mention "2 minutes", "1 minute", or any duration longer than 15 seconds.`;return e?t+(({"use-case":`

Current Task: Generate a use case page for Sora2.
Focus on:
- Specific use cases and scenarios
- How Sora2 solves real problems
- Step-by-step guides
- Real-world examples
- Target audience and industries`,keyword:`

Current Task: Generate a long-tail keyword page for Sora2.
Focus on:
- Keyword-focused content
- Search intent satisfaction
- Step-by-step instructions
- FAQ sections
- Clear, actionable content`,blog:`

Current Task: Generate a blog article for Sora2.
Focus on:
- In-depth, comprehensive content (1500-2500 words)
- Pillar page or cluster content structure
- Problem-solving approach
- Real examples and case studies
- Clear takeaways for readers`,compare:`

Current Task: Generate a comparison page (Sora2 vs other tools).
Focus on:
- Objective, fair comparison
- Feature-by-feature analysis
- Use case recommendations
- Clear advantages and disadvantages
- Data-supported conclusions`,industry:`

Current Task: Generate an industry-specific page for Sora2.
Focus on:
- Industry-specific problems and solutions
- How Sora2 applies to this industry
- Industry use cases and examples
- Target audience within the industry
- Industry trends and future applications`})[e]||""):t}(A.taskType),b=s||"";if(m&&g){let e=p.find(e=>e.id===g);if(e){let t=function(e,t){let n=e;for(let[e,s]of Object.entries(t)){let t=`{{${e}}}`;n=s&&""!==s.trim()?n.replace(RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"),s.trim()):(n=n.replace(RegExp(`^.*${t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}.*$`,"gm"),"")).replace(RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"),"")}return(n=n.replace(/\n{3,}/g,"\n\n")).trim()}(e.template,f);b=`Please generate SEO content based on the following template:

${t}`,s&&s.trim()&&(b+=`

Additional requirements: ${s}`)}}o&&o.length>0&&(b?b+=`

[包含 ${o.length} 张图片，请分析这些图片并生成相应的 SEO 内容]`:b=`[包含 ${o.length} 张图片，请分析这些图片并生成相应的 SEO 内容]`,console.log(`[SEO Chat] 用户上传了 ${o.length} 张图片`));let I=[{role:"system",content:S},{role:"user",content:b}];if(n&&h){let e=await (0,d.createServiceClient)(),{data:t,error:s}=await e.from("admin_chat_messages").select("role, content, images").eq("session_id",n).order("created_at",{ascending:!0});if(!s&&t&&t.length>0){let e=[];for(let n of t){if("system"===n.role)continue;let t=n.content||"";n.images&&Array.isArray(n.images)&&n.images.length>0&&(t?t+=`

[包含 ${n.images.length} 张图片]`:t=`[包含 ${n.images.length} 张图片]`),e.push({role:n.role,content:t})}I.splice(1,0,...e)}}let E={model:w,stream:r,messages:I};if(("gemini-3-flash"===w||"gemini-3-pro"===w)&&(E.tools=[{type:"google_search_retrieval"}]),r){let e=new TextEncoder,s=new ReadableStream({async start(s){try{let a="";for await(let t of(0,c.z4)(E)){let n=`data: ${JSON.stringify(t)}

`;if(s.enqueue(e.encode(n)),t.choices&&t.choices.length>0){let e=t.choices[0].delta;e?.content&&(a+=e.content)}}s.enqueue(e.encode("data: [DONE]\n\n")),s.close(),h&&n&&await y(n,t.id,I,a,w,o,A.taskType)}catch(t){let e=t instanceof Error?t.message:"未知错误";s.error(Error(e))}}});return new i.NextResponse(s,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive"}})}let v=process.env.GRSAI_API_KEY;if(!v)return console.error("[SEO Chat] GRSAI_API_KEY 未配置"),i.NextResponse.json({success:!1,error:"API Key 未配置",debug:{suggestion:"请检查环境变量 GRSAI_API_KEY 是否已设置"}},{status:500});let k=await (0,c.createChatCompletion)(E);if(!k.choices||0===k.choices.length){let e=v?v.substring(0,10)+"...":"未配置",t=process.env.GRSAI_CHAT_HOST||"https://api.grsai.com";console.error("[SEO Chat] ⚠️⚠️⚠️ API 返回空 choices 数组！",{model:w,apiKeyConfigured:!!v,apiKeyPrefix:e,chatHost:t,responseStructure:{hasChoices:!!k.choices,choicesLength:k.choices?.length||0,hasId:!!k.id,hasModel:!!k.model,hasObject:!!k.object,fullResponseKeys:Object.keys(k||{})},requestInfo:{messageLength:b?.length||0,imagesCount:o?.length||0,taskType:A.taskType}});let n=k?.error;return i.NextResponse.json({success:!1,error:n?.message||"API 返回空 choices 数组，可能请求被拒绝或格式错误",debug:{model:w,apiKeyConfigured:!!v,apiKeyPrefix:e,chatHost:t,errorInfo:n,responseStructure:{hasChoices:!!k.choices,choicesLength:k.choices?.length||0,hasId:!!k.id,hasModel:!!k.model,fullResponse:void 0},suggestions:[v?null:"检查 GRSAI_API_KEY 环境变量是否已配置","检查 API Key 是否有效（未过期、有足够权限）","检查 API 服务是否可用（https://api.grsai.com）","检查请求内容是否被过滤或拒绝","查看服务器日志获取更多详细信息"].filter(Boolean)}},{status:500})}if(!k.choices[0]?.message?.content)return console.error("[SEO Chat] API 返回空 content！完整响应:",JSON.stringify(k,null,2)),i.NextResponse.json({success:!1,error:"API 返回空 content，可能内容被过滤或拒绝",debug:{model:w,responseStructure:{hasChoices:!!k.choices,choicesLength:k.choices?.length||0,hasContent:!!k.choices[0]?.message?.content,finishReason:k.choices[0]?.finish_reason,fullResponse:void 0}}},{status:500});let R=k.choices[0].message.content;return h&&n&&await y(n,t.id,I,R,w,o,A.taskType),i.NextResponse.json({success:!0,data:k,model:w,taskType:A.taskType})}catch(n){console.error("SEO Chat API 错误:",n);let e=n instanceof Error?n.message:"未知错误",t=e;return n instanceof Error&&(n.message.includes("GRSAI_API_KEY")?t="API Key 未配置或无效，请检查环境变量 GRSAI_API_KEY":n.message.includes("空 choices")&&(t="API 返回空响应，可能 API Key 无效或服务不可用")),i.NextResponse.json({success:!1,error:t,debug:{errorMessage:e,suggestion:e.includes("GRSAI_API_KEY")?"请检查环境变量 GRSAI_API_KEY 是否已正确配置":"查看服务器日志获取更多详细信息"}},{status:500})}}async function y(e,t,n,s,o,a,r){try{let t=await (0,d.createServiceClient)(),i=n.find(e=>"user"===e.role);if(i){let n="";"string"==typeof i.content&&(n=i.content),await t.from("admin_chat_messages").insert({session_id:e,role:"user",content:n,images:a.length>0?a:null,model:null})}s&&await t.from("admin_chat_messages").insert({session_id:e,role:"assistant",content:s,images:null,model:o});let{data:l}=await t.from("admin_chat_sessions").select("title").eq("id",e).single();if(l&&!l.title){let n="SEO 对话";r&&"general"!==r?n=({"use-case":"使用场景生成",keyword:"关键词页面生成",blog:"博客文章生成",compare:"对比页面生成",industry:"行业页面生成"})[r]||"SEO 对话":i&&"string"==typeof i.content&&(n=i.content.substring(0,50)||"SEO 对话"),await t.from("admin_chat_sessions").update({updated_at:new Date().toISOString(),title:n}).eq("id",e)}else await t.from("admin_chat_sessions").update({updated_at:new Date().toISOString()}).eq("id",e)}catch(e){console.error("保存 SEO 聊天消息失败:",e)}}async function f(){try{if(!await (0,l.i7)())return i.NextResponse.json({success:!1,error:"未授权"},{status:401});return i.NextResponse.json({success:!0,data:p.map(e=>({id:e.id,name:e.name,description:e.description,parameters:e.parameters}))})}catch(t){console.error("获取 SEO 模板失败:",t);let e=t instanceof Error?t.message:"未知错误";return i.NextResponse.json({success:!1,error:e},{status:500})}}let A=new o.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/admin/seo-chat/route",pathname:"/api/admin/seo-chat",filename:"route",bundlePath:"app/api/admin/seo-chat/route"},resolvedPagePath:"/Users/p/Documents/GitHub/Sora-2Ai/app/api/admin/seo-chat/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:w,staticGenerationAsyncStorage:S,serverHooks:b}=A,I="/api/admin/seo-chat/route";function E(){return(0,r.patchFetch)({serverHooks:b,staticGenerationAsyncStorage:S})}},64363:(e,t,n)=>{n.d(t,{i7:()=>i});var s=n(60730),o=n(71615),a=n(84770);async function r(){try{let e=await (0,o.cookies)();return e.get("admin_session_token")?.value??null}catch(e){return console.error("[admin-auth] 获取 cookie 失败:",e),null}}async function i(){try{let e;let t=await r();if(!t)return null;try{e=await (0,s.e)()}catch(e){return console.error("[admin-auth] 创建 Supabase 客户端失败:",e),null}let n=(0,a.createHash)("sha256").update(t).digest("hex"),{data:i,error:l}=await e.rpc("admin_validate_session",{p_token_hash:n});if(l||!i){try{(await (0,o.cookies)()).delete("admin_session_token")}catch(e){console.warn("[admin-auth] 删除 cookie 失败:",e)}return null}return{id:i.id,username:i.username,is_super_admin:i.is_super_admin}}catch(e){return console.error("[admin-auth] validateAdminSession 异常:",e),null}}},60730:(e,t,n)=>{n.d(t,{e:()=>r});var s=n(85602),o=n(71615),a=n(77658);async function r(e){let t;let n=await (0,o.cookies)(),r=e??("function"==typeof o.headers?(()=>{try{return(0,o.headers)()}catch{return}})():void 0);r&&(t="function"==typeof r.get?r.get("authorization")??void 0:Array.isArray(r)?r.find(([e])=>"authorization"===e.toLowerCase())?.[1]:Object.entries(r).find(([e])=>"authorization"===e.toLowerCase())?.[1]??void 0);let i={fetch:(e,t)=>(0,a.e)(e,t,{timeoutMs:3e4,keepAlive:!0,maxRetries:5,retryDelay:500,exponentialBackoff:!0,returnErrorResponseOnFailure:!0})};return t&&(i.headers={Authorization:t}),(0,s.l)("https://hgzpzsiafycwlqrkzbis.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnenB6c2lhZnljd2xxcmt6YmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTk4NzIsImV4cCI6MjA3ODE5NTg3Mn0.WdpkrSXVZVZ64bY8NXG6Bpf-w59i305F7agny6wuj_Q",{global:i,cookies:{getAll:()=>n.getAll(),setAll(e){try{e.forEach(({name:e,value:t,options:s})=>n.set(e,t,s))}catch{}}}})}},23770:(e,t,n)=>{n.r(t),n.d(t,{createServiceClient:()=>r});var s=n(24330);n(60166);var o=n(37857),a=n(77658);async function r(){let e="https://hgzpzsiafycwlqrkzbis.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY,n="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnenB6c2lhZnljd2xxcmt6YmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTk4NzIsImV4cCI6MjA3ODE5NTg3Mn0.WdpkrSXVZVZ64bY8NXG6Bpf-w59i305F7agny6wuj_Q";if(!e)throw Error("缺少 Supabase 服务端配置，请设置 NEXT_PUBLIC_SUPABASE_URL");if(!t)throw Error("缺少 SUPABASE_SERVICE_ROLE_KEY，请在 .env.local 与部署环境中配置 Supabase Service Role Key");if(n&&t===n)throw Error("SUPABASE_SERVICE_ROLE_KEY 不能与 NEXT_PUBLIC_SUPABASE_ANON_KEY 相同，请复制 Supabase 项目的 Service Role Key");return(0,o.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1},global:{headers:{Connection:"keep-alive"},fetch:(e,t)=>(0,a.e)(e,t,{timeoutMs:3e4,keepAlive:!0,maxRetries:5,retryDelay:500,exponentialBackoff:!0,returnErrorResponseOnFailure:!0})}})}(0,n(40618).h)([r]),(0,s.j)("c5e0ed9abe93e89f66e50896ba7be6694aef9aa6",r)},77658:(e,t,n)=>{n.d(t,{e:()=>a});var s=n(47065);function o(e){if(!(e instanceof Error))return!1;let t=(e.message||"").toLowerCase(),n=e.cause?.code;return"AbortError"===e.name||t.includes("fetch failed")||t.includes("econnreset")||t.includes("etimedout")||t.includes("timeout")||t.includes("socket")||t.includes("tls")||t.includes("other side closed")||"UND_ERR_SOCKET"===n||"ECONNRESET"===n}async function a(e,t,n={}){let a=n.timeoutMs??3e4;try{return await (0,s.J)(async()=>{let{signal:s,cleanup:r}=function(e,t){let n=new AbortController,s=setTimeout(()=>n.abort(),t),o=null;return e&&(e.aborted?(clearTimeout(s),n.abort()):(o=()=>n.abort(),e.addEventListener("abort",o,{once:!0}))),{signal:n.signal,cleanup:()=>{clearTimeout(s),e&&o&&e.removeEventListener("abort",o)}}}(t?.signal,a);try{let o=new Headers(t?.headers);return n.keepAlive&&o.set("Connection","keep-alive"),await fetch(e,{...t,signal:s,headers:o})}catch(e){throw o(e),e}finally{r()}},{maxRetries:n.maxRetries??3,retryDelay:n.retryDelay??500,exponentialBackoff:n.exponentialBackoff??!0,onRetry:n.onRetry??(()=>{})})}catch(e){if(n.returnErrorResponseOnFailure&&o(e))return new Response(JSON.stringify({error:"fetch_failed",message:e instanceof Error?e.message:String(e)}),{status:503,headers:{"content-type":"application/json"}});throw e}}},47065:(e,t,n)=>{n.d(t,{J:()=>o,delay:()=>r,withRetryQuery:()=>a});let s={maxRetries:3,retryDelay:1e3,exponentialBackoff:!0,onRetry:()=>{}};async function o(e,t={}){let n;let o={...s,...t};for(let t=0;t<=o.maxRetries;t++)try{return await e()}catch(s){if(n=s,t===o.maxRetries)throw s;let e=o.exponentialBackoff?o.retryDelay*Math.pow(2,t):o.retryDelay;o.onRetry&&s instanceof Error&&o.onRetry(t+1,s),await new Promise(t=>setTimeout(t,e))}throw n}async function a(e,t={}){return o(async()=>{let t=await e();if(t.error){let e=t.error,n=e.message||String(e);if(n.includes("ECONNRESET")||n.includes("fetch failed")||n.includes("network")||n.includes("timeout")||n.includes("ETIMEDOUT")||n.includes("socket")||n.includes("TLS"))throw e}return t},t)}async function r(e){return new Promise(t=>setTimeout(t,e))}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),s=t.X(0,[8948,7289,5972,4967,8341,9606],()=>n(24806));module.exports=s})();