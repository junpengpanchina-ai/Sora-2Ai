#!/bin/bash
# 快速重启 GEO 更新任务（使用优化后的脚本）

cd /Users/p/Documents/GitHub/Sora-2Ai

# 停止当前任务
echo "🛑 停止当前任务..."
pkill -f "batch-update-geo-content" || echo "  没有运行中的任务"

sleep 2

# 检查已完成的数量
if [ -f /tmp/batch-5000-update.log ]; then
  COMPLETED=$(grep -c "✅ 更新成功" /tmp/batch-5000-update.log || echo "0")
  echo "📊 已完成：$COMPLETED 条"
fi

# 重新启动（使用优化后的脚本）
echo ""
echo "🚀 使用优化后的脚本重新启动..."
echo "   • 并发处理：3条同时"
echo "   • 延迟：0.2秒/条"
echo "   • 预计速度：5-10倍提升"
echo ""

node scripts/batch-update-geo-content.js \
  --ids="$(cat /tmp/batch-5000-ids.txt)" \
  --batch=500 \
  2>&1 | tee /tmp/batch-5000-update-fast.log

