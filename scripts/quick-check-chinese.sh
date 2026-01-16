#!/bin/bash

# 快速检查中文字符脚本
# 使用方法: ./scripts/quick-check-chinese.sh

echo "🔍 快速检查中文字符..."
echo ""

# 检查用户可见的字符串（高优先级）
echo "📋 检查用户可见内容（高优先级）..."
echo ""

# 检查 .tsx 文件中的字符串字面量
echo "检查 .tsx 文件:"
grep -rn "['\"\`].*[\u4e00-\u9fff]" app/ components/ --include="*.tsx" 2>/dev/null | head -20

# 检查 .ts 文件中的字符串字面量
echo ""
echo "检查 .ts 文件:"
grep -rn "['\"\`].*[\u4e00-\u9fff]" app/ lib/ components/ --include="*.ts" 2>/dev/null | head -20

# 检查 .js 文件中的字符串字面量
echo ""
echo "检查 .js 文件:"
grep -rn "['\"\`].*[\u4e00-\u9fff]" app/ lib/ components/ scripts/ --include="*.js" 2>/dev/null | head -20

echo ""
echo "✅ 快速检查完成！"
echo ""
echo "💡 提示：如果发现中文，请："
echo "   1. 检查是否是用户可见内容（必须修复）"
echo "   2. 检查是否是代码注释（建议修复）"
echo "   3. 运行完整检查: npm run check:chinese"
