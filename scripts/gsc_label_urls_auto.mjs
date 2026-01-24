#!/usr/bin/env node
/**
 * GSC URL Auto Labeler
 * - Auto-detect CSV columns (url/reason)
 * - Concurrent fetch: http_status, canonical_url, content_length, word_count
 * - Classify: delete / keep / enhance
 * - Output: Supabase-ready UPSERT SQL for seo_gsc_urls (matches 108 schema)
 *
 * Usage:
 *   node scripts/gsc_label_urls_auto.mjs <input.csv> <output.sql>
 *
 * Env:
 *   CONCURRENCY=20
 *   TIMEOUT_MS=15000
 *   ALLOW_HOSTS="sora2aivideos.com,www.sora2aivideos.com"
 *   USER_AGENT="Mozilla/5.0 ..."
 */

import fs from "fs";
import { setTimeout as sleep } from "timers/promises";

// -------------------- Config --------------------
const INPUT = process.argv[2];
const OUTPUT = process.argv[3] ?? "gsc_labeled.sql";

if (!INPUT) {
  console.error("Usage: node scripts/gsc_label_urls_auto.mjs <input.csv> <output.sql>");
  process.exit(1);
}

const CONCURRENCY = Number(process.env.CONCURRENCY ?? 20);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS ?? 15000);
const USER_AGENT =
  process.env.USER_AGENT ??
  "Mozilla/5.0 (compatible; Sora2-GSC-Auditor/1.0; +https://sora2aivideos.com)";
const ALLOW_HOSTS = (process.env.ALLOW_HOSTS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// -------------------- Helpers --------------------
function sqlEscape(str) {
  if (str === null || str === undefined) return "NULL";
  const s = String(str);
  return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

function sqlBool(v) {
  if (v === null || v === undefined) return "NULL";
  return v ? "TRUE" : "FALSE";
}

function nowIso() {
  return new Date().toISOString();
}

function parseCsv(raw) {
  // Minimal CSV parser supporting quotes and commas; good enough for GSC exports
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (lines.length === 0) return { header: [], rows: [] };

  const parseLine = (line) => {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // handle escaped quote
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((x) => x.trim());
  };

  const header = parseLine(lines[0]).map((h) => h.replace(/^\uFEFF/, "")); // remove BOM
  const rows = lines.slice(1).map(parseLine);
  return { header, rows };
}

function detectColumns(header) {
  const norm = header.map((h) => h.toLowerCase().trim());

  const urlCandidates = [
    "url",
    "page",
    "loc",
    "address",
    "link",
    "链接",
    "网址",
    "页面",
  ];
  const reasonCandidates = [
    "reason",
    "issue",
    "status",
    "problem",
    "why",
    "why_not_indexed",
    "原因",
    "问题",
    "状态",
  ];

  const findIdx = (cands) => {
    for (const c of cands) {
      const i = norm.findIndex((h) => h === c || h.includes(c));
      if (i >= 0) return i;
    }
    return -1;
  };

  const urlIdx = findIdx(urlCandidates);
  const reasonIdx = findIdx(reasonCandidates);

  return { urlIdx, reasonIdx };
}

function stripHtmlToText(html) {
  // naive: remove scripts/styles and tags
  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = noScript.replace(/<[^>]+>/g, " ");
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCanonical(html) {
  // <link rel="canonical" href="...">
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!m) return null;
  const tag = m[0];
  const href = tag.match(/href=["']([^"']+)["']/i);
  return href?.[1] ?? null;
}

function countWords(text) {
  // count "words" robustly for mixed languages:
  // - English tokens: \b\w+\b
  // - CJK: count characters excluding spaces/punct roughly
  const en = (text.match(/\b[\p{L}\p{N}_]+\b/gu) ?? []).length;
  const cjk = (text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu) ?? []).length;
  return Math.max(en, Math.floor(cjk / 2)); // heuristic: 2 CJK chars ~ 1 word
}

function hasQueryParams(url) {
  try {
    const u = new URL(url);
    return [...u.searchParams.keys()].length > 0;
  } catch {
    return url.includes("?");
  }
}

function isAllowedHost(url) {
  if (ALLOW_HOSTS.length === 0) return true;
  try {
    const u = new URL(url);
    return ALLOW_HOSTS.includes(u.host);
  } catch {
    return false;
  }
}

function normalizeUrl(url) {
  // Keep as-is mostly; just trim spaces
  return String(url ?? "").trim();
}

function classify({ reason, httpStatus, canonicalUrl, wordCount, url }) {
  const r = String(reason ?? "").toLowerCase();
  const wc = Number(wordCount ?? 0);
  const status = Number(httpStatus ?? 0);
  const hasQ = hasQueryParams(url);

  // ---- DELETE ----
  if (hasQ) return { tag: "delete", tag_reason: "has_query_params" };
  if (status === 404 || status === 410) return { tag: "delete", tag_reason: `http_${status}` };
  if (r.includes("soft 404") || r.includes("soft404")) return { tag: "delete", tag_reason: "gsc_soft_404" };
  if (r.includes("not found") || r.includes("404")) return { tag: "delete", tag_reason: "gsc_404" };
  if (wc > 0 && wc < 120) return { tag: "delete", tag_reason: "too_thin" };

  // ---- ENHANCE ----
  if (r.includes("duplicate") || r.includes("canonical") || r.includes("alternate page")) {
    return { tag: "enhance", tag_reason: "gsc_duplicate_or_canonical" };
  }
  if (canonicalUrl) {
    // canonical points elsewhere (prefer enhance)
    const cu = String(canonicalUrl).trim();
    if (cu && cu !== url) return { tag: "enhance", tag_reason: "canonical_mismatch" };
  }
  if (wc >= 120 && wc < 250) return { tag: "enhance", tag_reason: "thin_need_enhance" };

  // ---- KEEP ----
  if (r.includes("discovered") || r.includes("已发现")) return { tag: "keep", tag_reason: "gsc_discovered" };
  if (r.includes("crawled") || r.includes("已抓取")) return { tag: "keep", tag_reason: "gsc_crawled" };
  if (status >= 500) return { tag: "keep", tag_reason: `server_${status}` };

  // default: keep
  return { tag: "keep", tag_reason: "default_keep" };
}

async function fetchWithTimeout(url, timeoutMs) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": USER_AGENT,
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: ac.signal,
    });
    const ct = res.headers.get("content-type") ?? "";
    let body = "";
    // only parse html-ish
    if (ct.includes("text/html") || ct.includes("application/xhtml")) {
      body = await res.text();
    } else {
      // still read a small chunk? skip; keep empty for word count
      body = "";
    }
    return { ok: true, status: res.status, contentType: ct, body };
  } catch (e) {
    return { ok: false, error: e?.name === "AbortError" ? "timeout" : String(e) };
  } finally {
    clearTimeout(t);
  }
}

async function fetchMeta(url) {
  // retries for 429/403/timeout
  const maxRetry = 3;
  let last = null;

  for (let i = 0; i <= maxRetry; i++) {
    if (i > 0) {
      const backoff = 500 * Math.pow(2, i - 1);
      await sleep(backoff);
    }

    const res = await fetchWithTimeout(url, TIMEOUT_MS);
    last = res;

    if (!res.ok) continue;

    // Some sites return 403/429 transiently
    if (res.status === 429 || res.status === 403) continue;

    return res;
  }

  return last ?? { ok: false, error: "unknown" };
}

function buildUpsertSql(row) {
  // Matches 108 schema exactly:
  // url, reason, source, first_seen_at, last_seen_at, http_status, canonical_url, content_length, word_count,
  // in_sitemap, has_query_params, tag, tag_reason, notes
  const columns = [
    "url",
    "reason",
    "source",
    "first_seen_at",
    "last_seen_at",
    "http_status",
    "canonical_url",
    "content_length",
    "word_count",
    "in_sitemap",
    "has_query_params",
    "tag",
    "tag_reason",
    "notes",
  ];

  const values = [
    sqlEscape(row.url),
    sqlEscape(row.reason),
    sqlEscape(row.source ?? "gsc_export"),
    sqlEscape(row.first_seen_at ?? nowIso()),
    sqlEscape(row.last_seen_at ?? nowIso()),
    row.http_status === null || row.http_status === undefined ? "NULL" : Number(row.http_status),
    row.canonical_url ? sqlEscape(row.canonical_url) : "NULL",
    row.content_length === null || row.content_length === undefined ? "NULL" : Number(row.content_length),
    row.word_count === null || row.word_count === undefined ? "NULL" : Number(row.word_count),
    sqlBool(row.in_sitemap),
    sqlBool(row.has_query_params),
    row.tag ? sqlEscape(row.tag) : "NULL",
    row.tag_reason ? sqlEscape(row.tag_reason) : "NULL",
    row.notes ? sqlEscape(row.notes) : "NULL",
  ];

  return `
INSERT INTO seo_gsc_urls (${columns.join(", ")})
VALUES (${values.join(", ")})
ON CONFLICT (url) DO UPDATE SET
  reason = EXCLUDED.reason,
  source = EXCLUDED.source,
  last_seen_at = EXCLUDED.last_seen_at,
  http_status = EXCLUDED.http_status,
  canonical_url = EXCLUDED.canonical_url,
  content_length = EXCLUDED.content_length,
  word_count = EXCLUDED.word_count,
  in_sitemap = COALESCE(EXCLUDED.in_sitemap, seo_gsc_urls.in_sitemap),
  has_query_params = EXCLUDED.has_query_params,
  tag = EXCLUDED.tag,
  tag_reason = EXCLUDED.tag_reason,
  notes = EXCLUDED.notes;
`.trim();
}

// -------------------- Main --------------------
(async function main() {
  const raw = fs.readFileSync(INPUT, "utf-8");
  const { header, rows } = parseCsv(raw);
  const { urlIdx, reasonIdx } = detectColumns(header);

  if (urlIdx < 0) {
    console.error("❌ Could not detect URL column. Header:", header);
    process.exit(1);
  }

  console.log("✅ Detected columns:");
  console.log("   URL:", header[urlIdx], `(index ${urlIdx})`);
  console.log("   Reason:", reasonIdx >= 0 ? header[reasonIdx] : "(not found)", `(index ${reasonIdx})`);

  const items = [];
  for (const r of rows) {
    const url = normalizeUrl(r[urlIdx]);
    if (!url) continue;
    const reason = reasonIdx >= 0 ? (r[reasonIdx] ?? "") : "";
    items.push({ url, reason });
  }

  console.log(`✅ Loaded ${items.length} URLs`);

  let done = 0;
  const results = new Array(items.length);

  async function workerLoop(workerId) {
    while (true) {
      const idx = items.findIndex((x) => x && !x._claimed);
      if (idx === -1) return;
      items[idx]._claimed = true;

      const { url, reason } = items[idx];
      let http_status = null;
      let canonical_url = null;
      let content_length = null;
      let word_count = null;
      const hqp = hasQueryParams(url);

      let notes = null;

      if (!isAllowedHost(url)) {
        notes = `skipped_non_host`;
      } else {
        const meta = await fetchMeta(url);
        if (!meta?.ok) {
          notes = `fetch_error:${meta?.error ?? "unknown"}`;
        } else {
          http_status = meta.status;
          const html = meta.body ?? "";
          content_length = html ? Buffer.byteLength(html, "utf8") : 0;
          canonical_url = html ? extractCanonical(html) : null;

          if (html) {
            const text = stripHtmlToText(html);
            word_count = countWords(text);
          } else {
            word_count = 0;
          }

          // If 403/429 after retries, mark note
          if (http_status === 403 || http_status === 429) {
            notes = `fetch_blocked_http_${http_status}`;
          }
        }
      }

      const decision = classify({
        reason,
        httpStatus: http_status,
        canonicalUrl: canonical_url,
        wordCount: word_count,
        url,
      });

      results[idx] = {
        url,
        reason,
        source: "gsc_export",
        first_seen_at: nowIso(),
        last_seen_at: nowIso(),
        http_status,
        canonical_url,
        content_length,
        word_count,
        in_sitemap: null, // 不引入 sitemap 解析；保持 null（后续可在 DB 侧补）
        has_query_params: hqp,
        tag: decision.tag,
        tag_reason: decision.tag_reason,
        notes,
      };

      done++;
      if (done % 50 === 0 || done === items.length) {
        console.log(`Progress: ${done}/${items.length} (${Math.round((done / items.length) * 100)}%)`);
      }

      // small jitter to avoid burst
      await sleep(50 + Math.floor(Math.random() * 100));
    }
  }

  console.log(`🚀 Starting ${CONCURRENCY} workers...`);
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => workerLoop(i)));

  // Build SQL
  let sql = "";
  sql += `-- Generated by scripts/gsc_label_urls_auto.mjs\n`;
  sql += `-- Input: ${INPUT}\n`;
  sql += `-- Time: ${new Date().toISOString()}\n\n`;
  sql += `BEGIN;\n\n`;

  const counts = { delete: 0, keep: 0, enhance: 0 };
  for (const r of results) {
    if (!r) continue;
    counts[r.tag] = (counts[r.tag] ?? 0) + 1;
    sql += buildUpsertSql(r) + "\n\n";
  }

  sql += `-- Stats\n`;
  sql += `COMMIT;\n\n`;
  sql += `-- Tag distribution\n`;
  sql += `SELECT tag, count(*) AS count\nFROM seo_gsc_urls\nGROUP BY tag\nORDER BY count DESC;\n`;

  fs.writeFileSync(OUTPUT, sql, "utf-8");

  console.log(`✅ Done! SQL saved to: ${OUTPUT}`);
  console.log(`📊 Tag distribution (local run): delete=${counts.delete}, keep=${counts.keep}, enhance=${counts.enhance}`);
})().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});
