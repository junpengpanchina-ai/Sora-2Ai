#!/usr/bin/env tsx

/**
 * 关键词分类脚本：将 21 万场景词自动分类为 KEEP / MERGE / STOP
 * 
 * 规则：
 * - KEEP: 有实际信号（sitemap/tier1/高分）
 * - MERGE: 同义/近似词（规范化后相同或相似）
 * - STOP: 无信号 + 高噪声形态（过长、垃圾模式、低意图堆词）
 * 
 * 使用方法：
 * npm run classify-keywords
 * 或
 * tsx scripts/classify-keywords.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// 明确加载 .env.local
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ 错误: 缺少 Supabase 环境变量");
  console.error("需要: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ") // symbols -> space
    .replace(/\s+/g, " ")
    .replace(/\b(a|an|the)\b/g, " ") // remove articles
    .replace(/\s+/g, " ")
    .trim();
}

// very cheap similarity: prefix + token overlap
function isNearDuplicate(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) <= 2 && (a.startsWith(b) || b.startsWith(a))) return true;

  const ta = new Set(a.split(" "));
  const tb = new Set(b.split(" "));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const j = inter / (ta.size + tb.size - inter);
  return j >= 0.86;
}

function shouldStop(norm: string): boolean {
  if (norm.length < 4) return true;
  if (norm.length > 90) return true;
  // spammy patterns
  if (/(free|download|crack|torrent|porn|casino|bet|xxx)\b/.test(norm)) return true;
  // too many tokens (keyword stuffing)
  if (norm.split(" ").length > 14) return true;
  return false;
}

type Scene = {
  id: string;
  slug: string | null;
  tier: number | null;
  noindex: boolean | null;
  in_sitemap: boolean | null;
  ai_citation_score: number | null;
  title?: string | null;
};

async function main() {
  const pageSize = 1000; // 减小批次大小，避免超时
  let from = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;

  // 维护一个"canonical 池"：优先用 sitemap + 高分 + tier1 的作为 merge 目标
  const canonical: { id: string; norm: string; score: number }[] = [];

  console.log("🚀 开始分类关键词...\n");

  while (true) {
    const { data, error } = await supabase
      .from("use_cases")
      .select("id,slug,tier,noindex,in_sitemap,ai_citation_score,title")
      .not("slug", "is", null) // 只处理有 slug 的记录
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("❌ 查询错误:", error);
      throw error;
    }
    if (!data || data.length === 0) break;

    const updates: {
      id: string;
      keyword_status: "KEEP" | "MERGE" | "STOP";
      merge_into_scene_id: string | null;
    }[] = [];

    for (const row of data as Scene[]) {
      // 跳过没有 slug 的记录（这些记录可能不完整）
      if (!row.slug) {
        continue;
      }
      
      const raw = (row.title || row.slug || "").toString();
      const norm = normalize(raw);

      // 1) hard stop
      if (shouldStop(norm)) {
        updates.push({
          id: row.id,
          keyword_status: "STOP",
          merge_into_scene_id: null,
        });
        continue;
      }

      // 2) strong keep signals (可按你后续字段加：impressions>0/clicks>0/visits>0)
      const score = row.ai_citation_score ?? 0;
      const keep =
        row.noindex === false &&
        (row.in_sitemap === true || row.tier === 1 || score >= 0.55);

      if (keep) {
        updates.push({
          id: row.id,
          keyword_status: "KEEP",
          merge_into_scene_id: null,
        });
        canonical.push({ id: row.id, norm, score });
        continue;
      }

      // 3) try merge into best canonical target
      // pick a near-duplicate in canonical pool
      let best: { id: string; score: number } | null = null;
      for (const c of canonical) {
        if (isNearDuplicate(norm, c.norm)) {
          if (!best || c.score > best.score) {
            best = { id: c.id, score: c.score };
          }
        }
      }

      if (best) {
        updates.push({
          id: row.id,
          keyword_status: "MERGE",
          merge_into_scene_id: best.id,
        });
      } else {
        // default keep-but-not-in-sitemap (you can later promote by score)
        updates.push({
          id: row.id,
          keyword_status: "KEEP",
          merge_into_scene_id: null,
        });
      }
    }

    // bulk update in chunks (批量更新，每次 50 条避免超时)
    for (let i = 0; i < updates.length; i += 50) {
      const chunk = updates.slice(i, i + 50);
      
      // 逐条更新（虽然慢但稳定）
      for (const update of chunk) {
        const updateData: any = {
          keyword_status: update.keyword_status,
        };
        
        if (update.merge_into_scene_id) {
          updateData.merge_into_scene_id = update.merge_into_scene_id;
        }
        
        const { error: upErr } = await supabase
          .from("use_cases")
          .update(updateData)
          .eq("id", update.id);
        
        if (upErr) {
          // 如果记录不存在，跳过（不抛出错误）
          if (upErr.code === 'PGRST116' || upErr.message?.includes('No rows')) {
            continue;
          }
          // 其他错误只记录，不中断
          if (i % 500 === 0) { // 每 500 条才输出一次错误，避免刷屏
            console.error(`❌ 更新记录失败 (${update.id}):`, upErr.message);
          }
        }
      }
    }

    totalProcessed += data.length;
    totalUpdated += updates.length;
    from += pageSize;
    
    console.log(
      `✅ 已处理 ${totalProcessed} 行，更新 ${totalUpdated} 条记录... canonical_pool=${canonical.length}`
    );
    
    // 每处理 10000 条记录，输出一次进度
    if (totalProcessed % 10000 === 0) {
      console.log(`📊 进度: ${totalProcessed} 条记录已处理`);
    }
  }

  console.log("\n✅ 分类完成！");
  console.log(`📊 总计处理: ${totalProcessed} 条记录`);
  console.log(`📊 总计更新: ${totalUpdated} 条记录`);
  console.log(`📊 Canonical 池大小: ${canonical.length}`);
}

main().catch((e) => {
  console.error("❌ 执行失败:", e);
  process.exit(1);
});
