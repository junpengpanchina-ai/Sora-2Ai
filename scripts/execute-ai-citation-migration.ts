#!/usr/bin/env tsx

/**
 * 执行 AI Citation Score 迁移和初始化脚本
 * 
 * 这个脚本会：
 * 1. 执行 SQL 迁移文件（072-077）
 * 2. 批量刷新 AI 分数
 * 3. 设置 in_sitemap
 * 
 * 注意：SQL 迁移需要通过 Supabase Dashboard 手动执行，此脚本会执行后续的批量操作
 */

import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
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

async function executeSQL(sql: string): Promise<void> {
  // 注意：Supabase JS 客户端不能直接执行任意 SQL
  // 需要通过 Supabase Dashboard 的 SQL Editor 执行
  // 这里只提供 SQL 内容用于复制
  console.log("\n" + "=".repeat(80));
  console.log("SQL 内容：");
  console.log("=".repeat(80));
  console.log(sql);
  console.log("=".repeat(80));
  console.log("\n⚠️  请将上述 SQL 复制到 Supabase Dashboard → SQL Editor 中执行");
}

async function refreshAIScores(): Promise<void> {
  console.log("\n🔄 开始批量刷新 AI 分数...\n");

  // 使用更小的批次避免超时
  const batches = [
    { limit: 10000, offset: 0 },
    { limit: 10000, offset: 10000 },
    { limit: 10000, offset: 20000 },
    { limit: 10000, offset: 30000 },
    { limit: 10000, offset: 40000 },
    { limit: 10000, offset: 50000 },
    { limit: 10000, offset: 60000 },
    { limit: 10000, offset: 70000 },
    { limit: 10000, offset: 80000 },
    { limit: 10000, offset: 90000 },
    { limit: 10000, offset: 100000 },
    { limit: 10000, offset: 110000 },
    { limit: 10000, offset: 120000 },
    { limit: 10000, offset: 130000 },
    { limit: 10000, offset: 140000 },
    { limit: 10000, offset: 150000 },
    { limit: 10000, offset: 160000 },
    { limit: 10000, offset: 170000 },
    { limit: 10000, offset: 180000 },
    { limit: 10000, offset: 190000 },
    { limit: 10000, offset: 200000 },
  ];

  for (const batch of batches) {
    try {
      const { data, error } = await supabase.rpc("refresh_ai_citation_scores", {
        p_limit: batch.limit,
        p_offset: batch.offset,
      });

      if (error) {
        console.error(`❌ 批次 ${batch.offset}-${batch.offset + batch.limit} 失败:`, error.message);
        // 继续执行下一批次
        continue;
      }

      const updated = data as number;
      console.log(`✅ 批次 ${batch.offset}-${batch.offset + batch.limit}: 更新了 ${updated} 条记录`);

      // 如果更新数为 0，说明已经处理完所有数据
      if (updated === 0) {
        console.log("📊 所有数据已处理完成");
        break;
      }
    } catch (error) {
      console.error(`❌ 批次 ${batch.offset}-${batch.offset + batch.limit} 异常:`, error);
    }
  }

  console.log("\n✅ AI 分数刷新完成！");
}

async function setInSitemap(): Promise<void> {
  console.log("\n🔄 设置 in_sitemap...\n");

  // 先重置所有（分批重置，避免超时）
  console.log("🔄 重置所有 in_sitemap = false（分批执行）...");
  let resetOffset = 0;
  const resetBatchSize = 10000;
  let resetCount = 0;
  
  while (true) {
    // 获取一批需要重置的记录
    const { data: batch, error: fetchError } = await supabase
      .from("use_cases")
      .select("id")
      .eq("in_sitemap", true)
      .range(resetOffset, resetOffset + resetBatchSize - 1);

    if (fetchError) {
      console.error("❌ 获取重置批次失败:", fetchError.message);
      break;
    }

    if (!batch || batch.length === 0) {
      break;
    }

    const ids = batch.map((row) => row.id);
    const { error: updateError } = await supabase
      .from("use_cases")
      .update({ in_sitemap: false })
      .in("id", ids);

    if (updateError) {
      console.error(`❌ 重置批次 ${resetOffset} 失败:`, updateError.message);
      break;
    }

    resetCount += ids.length;
    resetOffset += resetBatchSize;
    console.log(`✅ 已重置 ${resetCount} 条记录的 in_sitemap = false`);

    // 如果这批数据少于批次大小，说明已经处理完
    if (ids.length < resetBatchSize) {
      break;
    }
  }

  console.log(`✅ 重置完成，共重置 ${resetCount} 条记录`);

  // 获取 Top 20k 并设置
  const { data, error } = await supabase
    .from("use_cases")
    .select("id")
    .eq("noindex", false)
    .eq("tier", 1)
    .order("ai_citation_score", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(20000);

  if (error) {
    console.error("❌ 查询 Top 20k 失败:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log("⚠️  没有找到符合条件的记录");
    return;
  }

  const ids = data.map((row) => row.id);

  // 分批更新（每次 500 条）
  const batchSize = 500;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const { error: updateError } = await supabase
      .from("use_cases")
      .update({ in_sitemap: true })
      .in("id", batch);

    if (updateError) {
      console.error(`❌ 更新批次 ${i}-${i + batchSize} 失败:`, updateError.message);
    } else {
      console.log(`✅ 已设置 ${Math.min(i + batchSize, ids.length)}/${ids.length} 条记录的 in_sitemap = true`);
    }
  }

  console.log(`\n✅ 已设置 ${ids.length} 条记录的 in_sitemap = true`);
}

async function main() {
  console.log("🚀 开始执行 AI Citation Score 迁移和初始化\n");
  console.log("⚠️  注意：SQL 迁移文件（072-077）需要在 Supabase Dashboard 中手动执行");
  console.log("   详细步骤请查看：EXECUTE_AI_CITATION_MIGRATION.md\n");

  // 步骤 1: 批量刷新 AI 分数
  console.log("=".repeat(80));
  console.log("步骤 1: 批量刷新 AI 分数");
  console.log("=".repeat(80));
  try {
    await refreshAIScores();
  } catch (error) {
    console.error("❌ 刷新 AI 分数失败:", error);
    console.log("\n💡 提示：如果函数不存在，请先执行 SQL 迁移文件 073 和 074");
    return;
  }

  // 步骤 2: 设置 in_sitemap
  console.log("\n" + "=".repeat(80));
  console.log("步骤 2: 设置 in_sitemap (Top 20k)");
  console.log("=".repeat(80));
  try {
    await setInSitemap();
  } catch (error) {
    console.error("❌ 设置 in_sitemap 失败:", error);
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ 批量操作完成！");
  console.log("=".repeat(80));
  console.log("\n下一步：运行分类脚本");
  console.log("  npm run classify-keywords");
  console.log("  或");
  console.log("  tsx scripts/classify-keywords.ts");
}

main().catch((e) => {
  console.error("❌ 执行失败:", e);
  process.exit(1);
});
