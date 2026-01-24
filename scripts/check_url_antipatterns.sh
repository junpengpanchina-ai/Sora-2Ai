#!/bin/bash
# check_url_antipatterns.sh
# CI Gate: 检查 URL 反模式，防止 404/5xx 问题再发
#
# Exit codes:
#   0 = PASS
#   1 = FAIL (found anti-patterns)
#
# Usage:
#   ./scripts/check_url_antipatterns.sh
#   或在 CI 中: npm run check:url-patterns

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "======================================"
echo "🔍 URL Anti-Pattern Check"
echo "======================================"

ERRORS=0

# ============================================================================
# 1. 检查代码中是否有 format=xml 的硬编码 URL（排除注释）
# ============================================================================
echo ""
echo "1️⃣ Checking for hardcoded format=xml..."

# 排除：middleware.ts, 本脚本, 注释行 (// 或 *), url.ts 中的注释/废弃标记
MATCHES=$(grep -rn "format=xml" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  . 2>/dev/null \
  | grep -v "middleware.ts" \
  | grep -v "check_url_antipatterns.sh" \
  | grep -v "^\s*//" \
  | grep -v "^\s*\*" \
  | grep -v "@deprecated" \
  | grep -v "REMOVED" \
  | grep -v "注意：" \
  | grep -v "去掉.*format" \
  || true)

if [ -n "$MATCHES" ]; then
  echo -e "${RED}❌ Found format=xml in code:${NC}"
  echo "$MATCHES"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No hardcoded format=xml found${NC}"
fi

# ============================================================================
# 2. 检查代码中是否有重复 keywords- 前缀（排除注释和规范化函数）
# ============================================================================
echo ""
echo "2️⃣ Checking for duplicate keywords- prefix..."

# 排除：middleware.ts, 本脚本, 规范化函数中的注释
MATCHES=$(grep -rn "keywords-keywords-" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  . 2>/dev/null \
  | grep -v "middleware.ts" \
  | grep -v "check_url_antipatterns.sh" \
  | grep -v "^\s*//" \
  | grep -v "^\s*\*" \
  | grep -v "去掉重复" \
  | grep -v "normalize" \
  || true)

if [ -n "$MATCHES" ]; then
  echo -e "${RED}❌ Found duplicate keywords- prefix in code:${NC}"
  echo "$MATCHES"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No duplicate keywords- prefix found${NC}"
fi

# ============================================================================
# 3. 检查 sitemap 生成是否可能产生 .xml 后缀的页面 URL
# ============================================================================
echo ""
echo "3️⃣ Checking for .xml suffix in page URLs..."

MATCHES=$(grep -rn '\.xml"' --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  ./app 2>/dev/null | grep -v "sitemap" | grep -v "route.ts" | grep -v "middleware" || true)

if [ -n "$MATCHES" ]; then
  echo -e "${YELLOW}⚠️ Found .xml in page URLs (review needed):${NC}"
  echo "$MATCHES"
  # 不算错误，只是警告
else
  echo -e "${GREEN}✅ No .xml suffix in page URLs${NC}"
fi

# ============================================================================
# 4. 检查 slug 生成函数是否缺少规范化
# ============================================================================
echo ""
echo "4️⃣ Checking slug generation functions..."

# 检查是否有 normalizeSlug 或类似函数
if grep -rq "normalizeSlug\|normalize.*slug\|cleanSlug" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  ./lib 2>/dev/null; then
  echo -e "${GREEN}✅ Found slug normalization function${NC}"
else
  echo -e "${YELLOW}⚠️ No slug normalization function found in /lib${NC}"
  echo "   Consider adding a normalizeSlug() function to prevent URL variants"
fi

# ============================================================================
# 5. 检查 middleware 是否配置正确
# ============================================================================
echo ""
echo "5️⃣ Checking middleware configuration..."

if [ -f "./middleware.ts" ]; then
  if grep -q "format=xml\|format.*xml" ./middleware.ts; then
    echo -e "${GREEN}✅ middleware.ts handles format=xml${NC}"
  else
    echo -e "${YELLOW}⚠️ middleware.ts may not handle format=xml${NC}"
  fi
  
  if grep -q "keywords-keywords\|(keywords-)+\|keywords-.*keywords-" ./middleware.ts; then
    echo -e "${GREEN}✅ middleware.ts handles duplicate prefix${NC}"
  else
    echo -e "${YELLOW}⚠️ middleware.ts may not handle duplicate keywords- prefix${NC}"
  fi
else
  echo -e "${RED}❌ middleware.ts not found${NC}"
  ERRORS=$((ERRORS + 1))
fi

# ============================================================================
# 结果
# ============================================================================
echo ""
echo "======================================"
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ FAILED: $ERRORS error(s) found${NC}"
  echo "   Fix the issues above before deploying"
  exit 1
else
  echo -e "${GREEN}✅ PASSED: No URL anti-patterns detected${NC}"
  exit 0
fi
