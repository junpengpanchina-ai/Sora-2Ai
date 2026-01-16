"use strict";(()=>{var e={};e.id=5310,e.ids=[5310],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},76420:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>h,patchFetch:()=>w,requestAsyncStorage:()=>m,routeModule:()=>y,serverHooks:()=>f,staticGenerationAsyncStorage:()=>g});var n={};r.r(n),r.d(n,{GET:()=>d,dynamic:()=>c,revalidate:()=>u});var a=r(49303),o=r(88716),i=r(60670),s=r(87070),l=r(60730);let c="force-dynamic",u=0,p=e=>e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"):"";async function d(e,{params:t}){try{let e=await (0,l.e)(),{data:r,error:n}=await e.from("long_tail_keywords").select("*").eq("status","published").eq("page_slug",t.slug).maybeSingle();if(n)return console.error("Failed to load keyword for XML:",n),new s.NextResponse("Keyword not found",{status:404});if(!r)return new s.NextResponse("Keyword not found",{status:404});let a=process.env.NEXT_PUBLIC_SITE_URL??"https://sora2aivideos.com",o=`<?xml version="1.0" encoding="UTF-8"?>
<keyword-page xmlns="https://sora2aivideos.com/schema/keyword">
  <metadata>
    <url>${a}/keywords/${p(r.page_slug)}.xml</url>
    <slug>${p(r.page_slug)}</slug>
    <lastmod>${r.updated_at?new Date(r.updated_at).toISOString():new Date().toISOString()}</lastmod>
  </metadata>
  <content>
    <title>${p(r.title||r.keyword)}</title>
    <keyword>${p(r.keyword)}</keyword>
    <h1>${p(r.h1||r.keyword)}</h1>
    <meta-description>${p(r.meta_description||"")}</meta-description>
    <intro-paragraph><![CDATA[${r.intro_paragraph||""}]]></intro-paragraph>
    ${r.product?`<product>${p(r.product)}</product>`:""}
    ${r.service?`<service>${p(r.service)}</service>`:""}
    ${r.pain_point?`<pain-point><![CDATA[${r.pain_point}]]></pain-point>`:""}
    <intent>${p(r.intent||"information")}</intent>
    ${r.region?`<region>${p(r.region)}</region>`:""}
  </content>
  ${r.steps&&Array.isArray(r.steps)&&r.steps.length>0?`
  <steps>
    ${r.steps.map((e,t)=>`
    <step number="${t+1}">
      <title>${p(e.title||"")}</title>
      <description><![CDATA[${e.description||""}]]></description>
    </step>`).join("")}
  </steps>`:""}
  ${r.faq&&Array.isArray(r.faq)&&r.faq.length>0?`
  <faq>
    ${r.faq.map(e=>`
    <item>
      <question>${p(e.question||"")}</question>
      <answer><![CDATA[${e.answer||""}]]></answer>
    </item>`).join("")}
  </faq>`:""}
</keyword-page>`;return new s.NextResponse(o,{status:200,headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=3600, s-maxage=3600","X-Content-Type-Options":"nosniff"}})}catch(e){return console.error("Failed to generate keyword XML:",e),new s.NextResponse("Internal Server Error",{status:500})}}let y=new a.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/keywords/[slug].xml/route",pathname:"/api/keywords/[slug].xml",filename:"route",bundlePath:"app/api/keywords/[slug].xml/route"},resolvedPagePath:"/Users/p/Documents/GitHub/Sora-2Ai/app/api/keywords/[slug].xml/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:m,staticGenerationAsyncStorage:g,serverHooks:f}=y,h="/api/keywords/[slug].xml/route";function w(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:g})}},60730:(e,t,r)=>{r.d(t,{e:()=>i});var n=r(85602),a=r(71615),o=r(77658);async function i(e){let t;let r=await (0,a.cookies)(),i=e??("function"==typeof a.headers?(()=>{try{return(0,a.headers)()}catch{return}})():void 0);i&&(t="function"==typeof i.get?i.get("authorization")??void 0:Array.isArray(i)?i.find(([e])=>"authorization"===e.toLowerCase())?.[1]:Object.entries(i).find(([e])=>"authorization"===e.toLowerCase())?.[1]??void 0);let s={fetch:(e,t)=>(0,o.e)(e,t,{timeoutMs:3e4,keepAlive:!0,maxRetries:5,retryDelay:500,exponentialBackoff:!0,returnErrorResponseOnFailure:!0})};return t&&(s.headers={Authorization:t}),(0,n.l)("https://hgzpzsiafycwlqrkzbis.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnenB6c2lhZnljd2xxcmt6YmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTk4NzIsImV4cCI6MjA3ODE5NTg3Mn0.WdpkrSXVZVZ64bY8NXG6Bpf-w59i305F7agny6wuj_Q",{global:s,cookies:{getAll:()=>r.getAll(),setAll(e){try{e.forEach(({name:e,value:t,options:n})=>r.set(e,t,n))}catch{}}}})}},77658:(e,t,r)=>{r.d(t,{e:()=>o});var n=r(47065);function a(e){if(!(e instanceof Error))return!1;let t=(e.message||"").toLowerCase(),r=e.cause?.code;return"AbortError"===e.name||t.includes("fetch failed")||t.includes("econnreset")||t.includes("etimedout")||t.includes("timeout")||t.includes("socket")||t.includes("tls")||t.includes("other side closed")||"UND_ERR_SOCKET"===r||"ECONNRESET"===r}async function o(e,t,r={}){let o=r.timeoutMs??3e4;try{return await (0,n.J)(async()=>{let{signal:n,cleanup:i}=function(e,t){let r=new AbortController,n=setTimeout(()=>r.abort(),t),a=null;return e&&(e.aborted?(clearTimeout(n),r.abort()):(a=()=>r.abort(),e.addEventListener("abort",a,{once:!0}))),{signal:r.signal,cleanup:()=>{clearTimeout(n),e&&a&&e.removeEventListener("abort",a)}}}(t?.signal,o);try{let a=new Headers(t?.headers);return r.keepAlive&&a.set("Connection","keep-alive"),await fetch(e,{...t,signal:n,headers:a})}catch(e){throw a(e),e}finally{i()}},{maxRetries:r.maxRetries??3,retryDelay:r.retryDelay??500,exponentialBackoff:r.exponentialBackoff??!0,onRetry:r.onRetry??(()=>{})})}catch(e){if(r.returnErrorResponseOnFailure&&a(e))return new Response(JSON.stringify({error:"fetch_failed",message:e instanceof Error?e.message:String(e)}),{status:503,headers:{"content-type":"application/json"}});throw e}}},47065:(e,t,r)=>{r.d(t,{J:()=>a,delay:()=>i,withRetryQuery:()=>o});let n={maxRetries:3,retryDelay:1e3,exponentialBackoff:!0,onRetry:()=>{}};async function a(e,t={}){let r;let a={...n,...t};for(let t=0;t<=a.maxRetries;t++)try{return await e()}catch(n){if(r=n,t===a.maxRetries)throw n;let e=a.exponentialBackoff?a.retryDelay*Math.pow(2,t):a.retryDelay;a.onRetry&&n instanceof Error&&a.onRetry(t+1,n),await new Promise(t=>setTimeout(t,e))}throw r}async function o(e,t={}){return a(async()=>{let t=await e();if(t.error){let e=t.error,r=e.message||String(e);if(r.includes("ECONNRESET")||r.includes("fetch failed")||r.includes("network")||r.includes("timeout")||r.includes("ETIMEDOUT")||r.includes("socket")||r.includes("TLS"))throw e}return t},t)}async function i(e){return new Promise(t=>setTimeout(t,e))}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[8948,7289,5972,4967],()=>r(76420));module.exports=n})();