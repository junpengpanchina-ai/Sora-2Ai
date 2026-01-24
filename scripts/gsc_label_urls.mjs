#!/usr/bin/env node
/**
 * GSC URL 自动标签脚本
 * 
 * 功能：
 * 1. 读取 GSC 导出的 CSV（url, reason）
 * 2. 并发请求页面，获取 HTTP 状态、canonical、内容长度、字数
 * 3. 自动分类：delete / keep / enhance
 * 4. 输出 labeled.csv
 * 
 * 使用方法：
 * node scripts/gsc_label_urls.mjs gsc_not_indexed.csv labeled.csv
 * 
 * 环境变量：
 * CONCURRENCY=20  # 并发数（默认 20）
 * TIMEOUT_MS=15000  # 超时时间（默认 15 秒）
 */

import fs from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const INPUT = process.argv[2] || "gsc_not_indexed.csv";
const OUTPUT = process.argv[3] || "labeled.csv";
const CONCURRENCY = Number(process.env.CONCURRENCY || 20);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 15000);

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }
  
  const header = lines.shift().split(",").map(s => s.trim().replace(/^"|"$/g, ''));
  const idxUrl = header.findIndex(h => h.toLowerCase() === "url");
  const idxReason = header.findIndex(h => h.toLowerCase() === "reason");
  
  if (idxUrl === -1) {
    throw new Error("CSV must have 'url' column");
  }
  
  return lines.map(line => {
    // 处理 CSV 中的引号和逗号
    const cols = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.trim());
    
    return { 
      url: cols[idxUrl]?.trim().replace(/^"|"$/g, '') || '', 
      reason: (cols[idxReason] || "").trim().replace(/^"|"$/g, '') || '' 
    };
  }).filter(r => r.url && r.url.length > 0);
}

function classify({ reason, url, http_status, word_count, canonical_url }) {
  const r = (reason || "").toLowerCase();
  const hasParams = url.includes("?");
  const isSoft404 = r.includes("soft 404");
  const isDup = r.includes("duplicate") || r.includes("canonical") || r.includes("alternate page");
  const discovered = r.includes("discovered");
  const crawled = r.includes("crawled");

  // 基础策略
  let tag = "enhance";
  let tag_reason = "default_enhance";

  if (hasParams) { 
    tag = "delete"; 
    tag_reason = "has_query_params"; 
  } else if (isSoft404) { 
    tag = "delete"; 
    tag_reason = "soft_404"; 
  } else if (isDup) { 
    tag = "enhance"; 
    tag_reason = "duplicate_or_canonical"; 
  } else if (discovered || crawled) { 
    tag = "keep"; 
    tag_reason = discovered ? "discovered_not_indexed" : "crawled_not_indexed"; 
  }

  // 抓取纠偏（更可靠）
  if (http_status === 404 || http_status === 410) { 
    tag = "delete"; 
    tag_reason = "http_404_410"; 
  }
  if (http_status >= 500) { 
    tag = "keep"; 
    tag_reason = "server_error_retry"; 
  }

  // 内容过薄倾向 delete / enhance
  if (http_status === 200) {
    if (word_count !== null && word_count < 120) {
      tag = "delete";
      tag_reason = "too_thin";
    } else if (word_count !== null && word_count < 250) {
      tag = "enhance";
      tag_reason = "thin_need_enhance";
    }
  }

  // canonical 指向别处，优先 enhance（抢回主权）
  if (canonical_url && canonical_url !== url) {
    tag = "enhance";
    tag_reason = "canonical_points_elsewhere";
  }

  return { tag, tag_reason };
}

async function fetchMeta(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);

  try {
    // 用 GET 更容易拿 canonical & body；同时避免某些站对 HEAD 不返回完整头
    const res = await fetch(url, { 
      redirect: "follow", 
      signal: ctl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GSC-Label-Bot/1.0)'
      }
    });
    const http_status = res.status;

    const html = await res.text();
    
    // 提取 canonical
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    let canonical_url = canonicalMatch?.[1] || "";
    
    // 规范化 canonical URL（相对路径转绝对路径）
    if (canonical_url && !canonical_url.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        canonical_url = new URL(canonical_url, urlObj.origin).href;
      } catch (e) {
        // 忽略 URL 解析错误
      }
    }

    // 粗略 word_count（去标签）
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const word_count = text ? text.split(" ").filter(w => w.length > 0).length : 0;

    const content_length = Buffer.byteLength(html, "utf8");
    return { http_status, canonical_url, word_count, content_length };
  } catch (e) {
    return { 
      http_status: 0, 
      canonical_url: "", 
      word_count: null, 
      content_length: null, 
      error: String(e?.message || e) 
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log(`Reading ${INPUT}...`);
  const inputText = fs.readFileSync(INPUT, "utf8");
  const rows = parseCSV(inputText);
  console.log(`Found ${rows.length} URLs to process`);

  const out = [];
  let i = 0;
  let processed = 0;

  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= rows.length) return;
      const row = rows[idx];

      try {
        const meta = await fetchMeta(row.url);
        const { tag, tag_reason } = classify({
          reason: row.reason,
          url: row.url,
          http_status: meta.http_status,
          word_count: meta.word_count,
          canonical_url: meta.canonical_url,
        });

        out[idx] = {
          url: row.url,
          reason: row.reason,
          http_status: meta.http_status,
          canonical_url: meta.canonical_url,
          content_length: meta.content_length,
          word_count: meta.word_count,
          tag,
          tag_reason,
          error: meta.error || "",
        };

        processed++;
        if (processed % 50 === 0) {
          console.log(`Progress: ${processed}/${rows.length} (${Math.round(processed/rows.length*100)}%)`);
        }
      } catch (e) {
        out[idx] = {
          url: row.url,
          reason: row.reason,
          http_status: 0,
          canonical_url: "",
          content_length: null,
          word_count: null,
          tag: "enhance",
          tag_reason: "fetch_error",
          error: String(e?.message || e),
        };
        processed++;
      }

      // 小抖动，避免被限速
      await sleep(30);
    }
  }

  console.log(`Starting ${CONCURRENCY} workers...`);
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  // 确保所有结果都已填充
  for (let i = 0; i < rows.length; i++) {
    if (!out[i]) {
      out[i] = {
        url: rows[i].url,
        reason: rows[i].reason,
        http_status: 0,
        canonical_url: "",
        content_length: null,
        word_count: null,
        tag: "enhance",
        tag_reason: "not_processed",
        error: "Not processed",
      };
    }
  }

  const header = ["url","reason","http_status","canonical_url","content_length","word_count","tag","tag_reason","error"];
  const csv = [header.join(",")]
    .concat(out.map(r => header.map(k => {
      const val = String((r?.[k] ?? "")).replaceAll(",", " ").replaceAll("\n", " ").replaceAll("\r", " ");
      return `"${val}"`;
    }).join(",")))
    .join("\n");

  fs.writeFileSync(OUTPUT, csv, "utf8");
  
  // 统计
  const stats = {
    delete: out.filter(r => r.tag === 'delete').length,
    keep: out.filter(r => r.tag === 'keep').length,
    enhance: out.filter(r => r.tag === 'enhance').length,
  };
  
  console.log(`\nDone! Output saved to ${OUTPUT}`);
  console.log(`\nTag distribution:`);
  console.log(`  delete:  ${stats.delete} (${Math.round(stats.delete/out.length*100)}%)`);
  console.log(`  keep:    ${stats.keep} (${Math.round(stats.keep/out.length*100)}%)`);
  console.log(`  enhance: ${stats.enhance} (${Math.round(stats.enhance/out.length*100)}%)`);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
